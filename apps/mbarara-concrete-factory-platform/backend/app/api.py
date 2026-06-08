from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.errors import DomainError
from app.models import CompetitorRecord, Customer, Expense, Inventory, Product, ProductionBatch, QualityTest, Supplier
from app.schemas import (
    AvailabilityResponse,
    CompetitorRecordCreate,
    CompetitorRecordRead,
    ContractorOrderRequest,
    ContractorOrderResponse,
    CustomerCreate,
    CustomerRead,
    DispatchRequest,
    DispatchResponse,
    ErrorResponse,
    ExpenseCreate,
    ExpenseRead,
    FinalizeBatchRequest,
    InventoryCreate,
    InventoryRead,
    ProductCreate,
    ProductRead,
    ProductionBatchCreate,
    ProductionBatchRead,
    QualityTestCreate,
    QualityTestRead,
    SupplierCreate,
    SupplierRead,
)
from app.services import dispatch_sale, finalize_production_batch, list_public_availability, place_contractor_order


router = APIRouter(prefix="/api/v1", responses={400: {"model": ErrorResponse}})


def raise_http_error(error: DomainError) -> None:
    raise HTTPException(status_code=error.status_code, detail=str(error)) from error


async def _create_record(session: AsyncSession, instance: object) -> object:
    try:
        async with session.begin():
            session.add(instance)
            await session.flush()
    except IntegrityError as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Record violates a database constraint.") from error
    await session.refresh(instance)
    return instance


@router.post("/products", response_model=ProductRead, status_code=status.HTTP_201_CREATED, tags=["ERP Reference Data"])
async def create_product(payload: ProductCreate, session: AsyncSession = Depends(get_session)) -> ProductRead:
    product = Product(**payload.model_dump())
    return ProductRead.model_validate(await _create_record(session, product))


@router.get("/products", response_model=list[ProductRead], tags=["ERP Reference Data"])
async def list_products(
    limit: int = 100,
    offset: int = 0,
    session: AsyncSession = Depends(get_session),
) -> list[ProductRead]:
    rows = (await session.scalars(select(Product).order_by(Product.code).limit(limit).offset(offset))).all()
    return [ProductRead.model_validate(row) for row in rows]


@router.post("/suppliers", response_model=SupplierRead, status_code=status.HTTP_201_CREATED, tags=["ERP Reference Data"])
async def create_supplier(payload: SupplierCreate, session: AsyncSession = Depends(get_session)) -> SupplierRead:
    supplier = Supplier(**payload.model_dump())
    return SupplierRead.model_validate(await _create_record(session, supplier))


@router.get("/suppliers", response_model=list[SupplierRead], tags=["ERP Reference Data"])
async def list_suppliers(
    limit: int = 100,
    offset: int = 0,
    session: AsyncSession = Depends(get_session),
) -> list[SupplierRead]:
    rows = (await session.scalars(select(Supplier).order_by(Supplier.name).limit(limit).offset(offset))).all()
    return [SupplierRead.model_validate(row) for row in rows]


@router.post("/customers", response_model=CustomerRead, status_code=status.HTTP_201_CREATED, tags=["ERP Reference Data"])
async def create_customer(payload: CustomerCreate, session: AsyncSession = Depends(get_session)) -> CustomerRead:
    customer = Customer(**payload.model_dump())
    return CustomerRead.model_validate(await _create_record(session, customer))


@router.get("/customers", response_model=list[CustomerRead], tags=["ERP Reference Data"])
async def list_customers(
    limit: int = 100,
    offset: int = 0,
    session: AsyncSession = Depends(get_session),
) -> list[CustomerRead]:
    rows = (await session.scalars(select(Customer).order_by(Customer.business_name).limit(limit).offset(offset))).all()
    return [CustomerRead.model_validate(row) for row in rows]


@router.post("/inventory", response_model=InventoryRead, status_code=status.HTTP_201_CREATED, tags=["Inventory"])
async def create_inventory_item(payload: InventoryCreate, session: AsyncSession = Depends(get_session)) -> InventoryRead:
    inventory = Inventory(**payload.model_dump())
    return InventoryRead.model_validate(await _create_record(session, inventory))


@router.get("/inventory", response_model=list[InventoryRead], tags=["Inventory"])
async def list_inventory(
    limit: int = 100,
    offset: int = 0,
    session: AsyncSession = Depends(get_session),
) -> list[InventoryRead]:
    rows = (await session.scalars(select(Inventory).order_by(Inventory.item_name).limit(limit).offset(offset))).all()
    return [InventoryRead.model_validate(row) for row in rows]


@router.post(
    "/production/batches",
    response_model=ProductionBatchRead,
    status_code=status.HTTP_201_CREATED,
    tags=["Production"],
)
async def create_production_batch(
    payload: ProductionBatchCreate,
    session: AsyncSession = Depends(get_session),
) -> ProductionBatchRead:
    data = payload.model_dump(exclude={"raw_material_mix_log"})
    batch = ProductionBatch(
        **data,
        raw_material_mix_log=[line.model_dump(mode="json") for line in payload.raw_material_mix_log],
    )
    return ProductionBatchRead.model_validate(await _create_record(session, batch))


@router.get("/production/batches", response_model=list[ProductionBatchRead], tags=["Production"])
async def list_production_batches(
    limit: int = 100,
    offset: int = 0,
    session: AsyncSession = Depends(get_session),
) -> list[ProductionBatchRead]:
    rows = (
        await session.scalars(select(ProductionBatch).order_by(ProductionBatch.created_at.desc()).limit(limit).offset(offset))
    ).all()
    return [ProductionBatchRead.model_validate(row) for row in rows]


@router.post("/quality-tests", response_model=QualityTestRead, status_code=status.HTTP_201_CREATED, tags=["Quality"])
async def create_quality_test(payload: QualityTestCreate, session: AsyncSession = Depends(get_session)) -> QualityTestRead:
    quality_test = QualityTest(**payload.model_dump())
    return QualityTestRead.model_validate(await _create_record(session, quality_test))


@router.get("/quality-tests", response_model=list[QualityTestRead], tags=["Quality"])
async def list_quality_tests(
    limit: int = 100,
    offset: int = 0,
    session: AsyncSession = Depends(get_session),
) -> list[QualityTestRead]:
    rows = (
        await session.scalars(select(QualityTest).order_by(QualityTest.test_date.desc()).limit(limit).offset(offset))
    ).all()
    return [QualityTestRead.model_validate(row) for row in rows]


@router.post("/expenses", response_model=ExpenseRead, status_code=status.HTTP_201_CREATED, tags=["Expenses"])
async def create_expense(payload: ExpenseCreate, session: AsyncSession = Depends(get_session)) -> ExpenseRead:
    expense = Expense(**payload.model_dump())
    return ExpenseRead.model_validate(await _create_record(session, expense))


@router.get("/expenses", response_model=list[ExpenseRead], tags=["Expenses"])
async def list_expenses(
    limit: int = 100,
    offset: int = 0,
    session: AsyncSession = Depends(get_session),
) -> list[ExpenseRead]:
    rows = (await session.scalars(select(Expense).order_by(Expense.created_at.desc()).limit(limit).offset(offset))).all()
    return [ExpenseRead.model_validate(row) for row in rows]


@router.post(
    "/competitors",
    response_model=CompetitorRecordRead,
    status_code=status.HTTP_201_CREATED,
    tags=["Market Intelligence"],
)
async def create_competitor_record(
    payload: CompetitorRecordCreate,
    session: AsyncSession = Depends(get_session),
) -> CompetitorRecordRead:
    competitor = CompetitorRecord(**payload.model_dump())
    return CompetitorRecordRead.model_validate(await _create_record(session, competitor))


@router.get("/competitors", response_model=list[CompetitorRecordRead], tags=["Market Intelligence"])
async def list_competitor_records(
    limit: int = 100,
    offset: int = 0,
    session: AsyncSession = Depends(get_session),
) -> list[CompetitorRecordRead]:
    rows = (
        await session.scalars(
            select(CompetitorRecord).order_by(CompetitorRecord.competitor_name).limit(limit).offset(offset)
        )
    ).all()
    return [CompetitorRecordRead.model_validate(row) for row in rows]


@router.get("/public/availability", response_model=list[AvailabilityResponse], tags=["B2B Portal"])
async def get_public_availability(session: AsyncSession = Depends(get_session)) -> list[AvailabilityResponse]:
    return await list_public_availability(session)


@router.post(
    "/production/batches/{batch_id}/finalize",
    response_model=ProductionBatchRead,
    status_code=status.HTTP_200_OK,
    tags=["Production"],
)
async def finalize_batch_endpoint(
    batch_id: uuid.UUID,
    payload: FinalizeBatchRequest,
    session: AsyncSession = Depends(get_session),
) -> ProductionBatchRead:
    try:
        return await finalize_production_batch(session, batch_id, payload)
    except DomainError as error:
        raise_http_error(error)


@router.post(
    "/contractor/orders",
    response_model=ContractorOrderResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["B2B Portal"],
)
async def contractor_order_endpoint(
    payload: ContractorOrderRequest,
    session: AsyncSession = Depends(get_session),
) -> ContractorOrderResponse:
    try:
        return await place_contractor_order(session, payload)
    except DomainError as error:
        raise_http_error(error)


@router.post(
    "/fulfillment/dispatch",
    response_model=DispatchResponse,
    status_code=status.HTTP_200_OK,
    tags=["Fulfillment"],
)
async def dispatch_endpoint(
    payload: DispatchRequest,
    session: AsyncSession = Depends(get_session),
) -> DispatchResponse:
    try:
        return await dispatch_sale(session, payload)
    except DomainError as error:
        raise_http_error(error)
