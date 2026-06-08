from __future__ import annotations

import uuid
from datetime import UTC, datetime
from decimal import Decimal

from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.errors import BusinessRuleError, NotFoundError, ValidationRuleError
from app.models import (
    CuringStatus,
    Customer,
    FulfillmentReceipt,
    Inventory,
    InventoryTransaction,
    InventoryTransactionType,
    Product,
    ProductionBatch,
    QualityApprovalState,
    QualityTest,
    Sale,
    SaleStatus,
)
from app.schemas import (
    AvailabilityResponse,
    ContractorOrderRequest,
    ContractorOrderResponse,
    DispatchRequest,
    DispatchResponse,
    FinalizeBatchRequest,
    FulfillmentReceiptRead,
    InventoryTransactionRead,
    ProductionBatchRead,
    SaleRead,
)


APPROVED_QUALITY_STATES = (QualityApprovalState.UNBS_APPROVED, QualityApprovalState.INTERNAL_PASS)


def _money(value: Decimal) -> Decimal:
    return value.quantize(Decimal("0.01"))


def _generate_invoice_number() -> str:
    return f"INV-{datetime.now(tz=UTC).strftime('%Y%m%d')}-{uuid.uuid4().hex[:8].upper()}"


def _available_stock(inventory: Inventory) -> Decimal:
    return inventory.physical_stock_on_hand - inventory.reserved_stock


async def list_public_availability(session: AsyncSession) -> list[AvailabilityResponse]:
    released_batches = (
        select(
            ProductionBatch.product_id.label("product_id"),
            func.coalesce(
                func.sum(func.greatest(ProductionBatch.actual_yield_qty - ProductionBatch.reject_qty, 0)),
                0,
            ).label("released_batch_qty"),
        )
        .join(
            QualityTest,
            and_(
                QualityTest.production_batch_id == ProductionBatch.id,
                QualityTest.product_id == ProductionBatch.product_id,
            ),
        )
        .where(
            ProductionBatch.curing_status == CuringStatus.RELEASED_FOR_SALE,
            QualityTest.approval_state.in_(APPROVED_QUALITY_STATES),
            ProductionBatch.actual_yield_qty.is_not(None),
        )
        .group_by(ProductionBatch.product_id)
        .subquery()
    )

    finished_goods_inventory = (
        select(
            Inventory.product_id.label("product_id"),
            func.coalesce(func.sum(Inventory.available_stock), 0).label("available_inventory_qty"),
        )
        .where(Inventory.product_id.is_not(None))
        .group_by(Inventory.product_id)
        .subquery()
    )

    public_available_qty = func.least(
        released_batches.c.released_batch_qty,
        func.coalesce(finished_goods_inventory.c.available_inventory_qty, released_batches.c.released_batch_qty),
    )

    statement = (
        select(
            Product.id,
            Product.code,
            Product.format_description,
            Product.uom,
            Product.base_ex_works_price,
            released_batches.c.released_batch_qty,
            finished_goods_inventory.c.available_inventory_qty,
            public_available_qty.label("public_available_qty"),
        )
        .join(released_batches, released_batches.c.product_id == Product.id)
        .outerjoin(finished_goods_inventory, finished_goods_inventory.c.product_id == Product.id)
        .where(public_available_qty > 0)
        .order_by(Product.code)
    )

    rows = (await session.execute(statement)).all()
    return [
        AvailabilityResponse(
            product_id=row.id,
            code=row.code,
            format_description=row.format_description,
            uom=row.uom,
            base_ex_works_price=row.base_ex_works_price,
            released_batch_qty=row.released_batch_qty,
            available_inventory_qty=row.available_inventory_qty,
            public_available_qty=row.public_available_qty,
        )
        for row in rows
    ]


async def finalize_production_batch(
    session: AsyncSession,
    batch_id: uuid.UUID,
    payload: FinalizeBatchRequest,
) -> ProductionBatchRead:
    async with session.begin():
        batch = await session.scalar(
            select(ProductionBatch).where(ProductionBatch.id == batch_id).with_for_update()
        )
        if batch is None:
            raise NotFoundError("Production batch not found.")
        if batch.materials_posted_at is not None:
            raise BusinessRuleError("Raw material consumption has already been posted for this batch.")

        mix_log = payload.raw_material_mix_log
        if mix_log is not None:
            batch.raw_material_mix_log = [line.model_dump(mode="json") for line in mix_log]

        if not batch.raw_material_mix_log:
            raise ValidationRuleError("raw_material_mix_log must contain at least one raw material issue line.")

        batch.actual_yield_qty = payload.actual_yield_qty
        batch.reject_qty = payload.reject_qty
        if payload.machine_hours is not None:
            batch.machine_hours = payload.machine_hours
        batch.curing_status = payload.curing_status
        batch.finalized_at = datetime.now(tz=UTC)

        for line in batch.raw_material_mix_log:
            item_name = str(line.get("item_name", "")).strip()
            quantity = Decimal(str(line.get("quantity", "0")))
            if not item_name or quantity <= 0:
                raise ValidationRuleError("Each raw material issue line requires item_name and positive quantity.")

            inventory = await session.scalar(
                select(Inventory)
                .where(func.lower(Inventory.item_name) == item_name.lower())
                .with_for_update()
            )
            if inventory is None:
                raise NotFoundError(f"Inventory item not found for raw material: {item_name}.")
            if _available_stock(inventory) < quantity:
                raise BusinessRuleError(
                    f"Insufficient available stock for {inventory.item_name}. "
                    f"Required {quantity}, available {_available_stock(inventory)}."
                )

            inventory.physical_stock_on_hand -= quantity
            session.add(
                InventoryTransaction(
                    inventory_id=inventory.id,
                    production_batch_id=batch.id,
                    tx_type=InventoryTransactionType.ISSUE_TO_PRODUCTION,
                    quantity=quantity,
                    operator_id=payload.operator_id,
                )
            )

        batch.materials_posted_at = datetime.now(tz=UTC)
        await session.flush()

    await session.refresh(batch)
    return ProductionBatchRead.model_validate(batch)


async def place_contractor_order(
    session: AsyncSession,
    payload: ContractorOrderRequest,
) -> ContractorOrderResponse:
    async with session.begin():
        customer = await session.scalar(
            select(Customer).where(Customer.id == payload.customer_id).with_for_update()
        )
        if customer is None:
            raise NotFoundError("Customer not found.")

        product = await session.scalar(select(Product).where(Product.id == payload.product_id))
        if product is None:
            raise NotFoundError("Product not found.")

        inventory = await session.scalar(
            select(Inventory)
            .where(Inventory.product_id == payload.product_id)
            .order_by(Inventory.created_at.asc())
            .with_for_update()
        )
        if inventory is None:
            raise NotFoundError("Finished-goods inventory record not found for this product.")

        order_total = _money((payload.order_qty * payload.unit_price) + payload.delivery_cost)
        balance_owed = _money(order_total - payload.paid_amount)
        if balance_owed < 0:
            raise ValidationRuleError("paid_amount cannot exceed order total.")
        if customer.current_balance + order_total > customer.credit_limit:
            raise BusinessRuleError(
                "Credit limit exceeded. Contractor order cannot be approved until payment or limit adjustment."
            )
        if _available_stock(inventory) < payload.order_qty:
            raise BusinessRuleError(
                f"Insufficient available stock. Requested {payload.order_qty}, available {_available_stock(inventory)}."
            )

        inventory.reserved_stock += payload.order_qty
        sale = Sale(
            product_id=payload.product_id,
            customer_id=payload.customer_id,
            invoice_number=payload.invoice_number or _generate_invoice_number(),
            order_qty=payload.order_qty,
            unit_price=payload.unit_price,
            delivery_cost=payload.delivery_cost,
            total_amount=order_total,
            paid_amount=payload.paid_amount,
            balance_owed=balance_owed,
            status=SaleStatus.APPROVED,
        )
        session.add(sale)
        await session.flush()

        reserved_after = inventory.reserved_stock
        available_after = _available_stock(inventory)

    await session.refresh(sale)
    return ContractorOrderResponse(
        sale=SaleRead.model_validate(sale),
        reserved_stock_after_order=reserved_after,
        available_stock_after_order=available_after,
    )


async def dispatch_sale(session: AsyncSession, payload: DispatchRequest) -> DispatchResponse:
    async with session.begin():
        sale = await session.scalar(select(Sale).where(Sale.id == payload.sale_id).with_for_update())
        if sale is None:
            raise NotFoundError("Sale not found.")
        if sale.status in (SaleStatus.COMPLETED, SaleStatus.CANCELLED):
            raise BusinessRuleError(f"Sale cannot be dispatched from status {sale.status.value}.")

        existing_receipt = await session.scalar(
            select(FulfillmentReceipt).where(FulfillmentReceipt.sale_id == sale.id)
        )
        if existing_receipt is not None:
            raise BusinessRuleError("This sale already has a dispatch receipt and cannot be dispatched twice.")

        customer = await session.scalar(select(Customer).where(Customer.id == sale.customer_id).with_for_update())
        if customer is None:
            raise NotFoundError("Customer not found.")

        inventory = await session.scalar(
            select(Inventory)
            .where(Inventory.product_id == sale.product_id)
            .order_by(Inventory.created_at.asc())
            .with_for_update()
        )
        if inventory is None:
            raise NotFoundError("Finished-goods inventory record not found for this product.")
        if inventory.reserved_stock < sale.order_qty:
            raise BusinessRuleError("Reserved stock is lower than sale quantity; dispatch is blocked.")
        if inventory.physical_stock_on_hand < sale.order_qty:
            raise BusinessRuleError("Physical stock is lower than sale quantity; dispatch is blocked.")

        previous_customer_balance = customer.current_balance
        previous_physical_stock = inventory.physical_stock_on_hand
        previous_reserved_stock = inventory.reserved_stock

        inventory.physical_stock_on_hand -= sale.order_qty
        inventory.reserved_stock -= sale.order_qty
        customer.current_balance += sale.balance_owed
        sale.status = SaleStatus.COMPLETED
        sale.dispatched_at = datetime.now(tz=UTC)

        receipt = FulfillmentReceipt(
            sale_id=sale.id,
            inventory_id=inventory.id,
            delivery_note_number=payload.delivery_note_number,
            signed_by=payload.signed_by,
            dispatched_qty=sale.order_qty,
            receipt_payload={
                "operator_id": str(payload.operator_id),
                "invoice_number": sale.invoice_number,
                "customer_id": str(customer.id),
                "product_id": str(sale.product_id),
                "previous_customer_balance": str(previous_customer_balance),
                "new_customer_balance": str(customer.current_balance),
                "previous_physical_stock": str(previous_physical_stock),
                "new_physical_stock": str(inventory.physical_stock_on_hand),
                "previous_reserved_stock": str(previous_reserved_stock),
                "new_reserved_stock": str(inventory.reserved_stock),
                "delivery_metadata": payload.delivery_metadata,
            },
        )
        session.add(receipt)
        await session.flush()

        customer_balance_after = customer.current_balance
        physical_after = inventory.physical_stock_on_hand
        reserved_after = inventory.reserved_stock

    await session.refresh(sale)
    await session.refresh(receipt)
    return DispatchResponse(
        sale=SaleRead.model_validate(sale),
        receipt=FulfillmentReceiptRead.model_validate(receipt),
        customer_balance_after_dispatch=customer_balance_after,
        physical_stock_after_dispatch=physical_after,
        reserved_stock_after_dispatch=reserved_after,
    )

