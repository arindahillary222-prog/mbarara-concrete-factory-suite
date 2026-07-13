from __future__ import annotations

import enum
import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Any

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Computed,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    func,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy.types import Enum as SAEnum


def enum_values(enum_cls: type[enum.Enum]) -> list[str]:
    return [member.value for member in enum_cls]


class Base(DeclarativeBase):
    pass


class ProductUom(str, enum.Enum):
    UNIT = "unit"
    M2 = "m2"
    M3 = "m3"


class SupplierSupplyCategory(str, enum.Enum):
    CEMENT = "cement"
    QUARRY = "quarry"
    DIESEL = "diesel"
    WATER = "water"
    SPARES = "spares"
    LOGISTICS = "logistics"


class CustomerSegmentType(str, enum.Enum):
    CASH_BUYER = "Cash Buyer"
    CONTRACTOR = "Contractor"
    DEALER = "Dealer"
    INSTITUTION = "Institution"


class CuringStatus(str, enum.Enum):
    MOLDING = "Molding"
    COVERED_WET_CURING = "Covered Wet Curing"
    CONTROLLED_CHAMBERS = "Controlled Chambers"
    READY_FOR_TESTING = "Ready for Testing"
    RELEASED_FOR_SALE = "Released for Sale"
    REJECTED = "Rejected"


class InventoryUom(str, enum.Enum):
    UNIT = "unit"
    M2 = "m2"
    M3 = "m3"
    BAG = "bag"
    KG = "kg"
    TONNE = "tonne"
    LITRE = "litre"


class InventoryTransactionType(str, enum.Enum):
    ADD_STOCK_SUPPLIER = "add-stock-supplier"
    ISSUE_TO_PRODUCTION = "issue-to-production"
    ADJUSTMENT = "adjustment"


class SaleStatus(str, enum.Enum):
    DRAFT = "Draft"
    APPROVED = "Approved"
    FULFILLING = "Fulfilling"
    OUT_FOR_DELIVERY = "Out for Delivery"
    COMPLETED = "Completed"
    CANCELLED = "Cancelled"


class ExpenseCategory(str, enum.Enum):
    PAYROLL = "payroll"
    UTILITIES = "utilities"
    MAINTENANCE = "maintenance"
    SECURITY = "security"
    TRANSPORT = "transport"
    OTHER = "other"


class QualityApprovalState(str, enum.Enum):
    PENDING_REVIEW = "Pending Review"
    UNBS_APPROVED = "UNBS Approved"
    INTERNAL_PASS = "Internal Pass"
    FAILED_SCRAPPED = "Failed/Scrapped"


class CompetitorProfileLayer(str, enum.Enum):
    INFORMAL = "informal"
    REGIONAL = "regional"
    NATIONAL = "national"
    CEMENT_LINKED = "cement-linked"
    SITE_CAST = "site-cast"


class UserRole(str, enum.Enum):
    OWNER = "owner"
    ADMIN = "admin"
    MANAGER = "manager"
    STAFF = "staff"
    VIEWER = "viewer"


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    full_name: Mapped[str] = mapped_column(String(200), nullable=False)
    role: Mapped[UserRole] = mapped_column(
        SAEnum(UserRole, name="user_role", values_callable=enum_values),
        nullable=False,
        server_default=UserRole.VIEWER.value,
    )
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("true"))
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    audit_logs: Mapped[list["AuditLog"]] = relationship(back_populates="actor")

    __table_args__ = (
        Index("ix_users_email", "email"),
        Index("ix_users_role", "role"),
    )


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    actor_user_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action: Mapped[str] = mapped_column(String(120), nullable=False)
    entity_type: Mapped[str] = mapped_column(String(120), nullable=False)
    entity_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    event_metadata: Mapped[dict[str, Any]] = mapped_column(
        "metadata",
        JSONB,
        nullable=False,
        server_default=text("'{}'::jsonb"),
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    actor: Mapped[User | None] = relationship(back_populates="audit_logs")

    __table_args__ = (
        Index("ix_audit_logs_actor_user_id", "actor_user_id"),
        Index("ix_audit_logs_entity", "entity_type", "entity_id"),
        Index("ix_audit_logs_created_at", "created_at"),
    )


class Product(Base, TimestampMixin):
    __tablename__ = "products"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code: Mapped[str] = mapped_column(String(32), unique=True, nullable=False)
    format_description: Mapped[str] = mapped_column(Text, nullable=False)
    uom: Mapped[ProductUom] = mapped_column(
        SAEnum(ProductUom, name="product_uom", values_callable=enum_values),
        nullable=False,
    )
    base_ex_works_price: Mapped[Decimal] = mapped_column(Numeric(15, 2), nullable=False)
    min_stock_threshold: Mapped[Decimal] = mapped_column(Numeric(18, 3), nullable=False, server_default=text("0"))

    production_batches: Mapped[list[ProductionBatch]] = relationship(back_populates="product")
    quality_tests: Mapped[list[QualityTest]] = relationship(back_populates="product")
    sales: Mapped[list[Sale]] = relationship(back_populates="product")
    inventory_items: Mapped[list[Inventory]] = relationship(back_populates="product")

    __table_args__ = (
        CheckConstraint("base_ex_works_price >= 0", name="ck_products_base_price_non_negative"),
        CheckConstraint("min_stock_threshold >= 0", name="ck_products_min_stock_non_negative"),
        Index("ix_products_code", "code"),
    )


class Supplier(Base, TimestampMixin):
    __tablename__ = "suppliers"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    supply_category: Mapped[SupplierSupplyCategory] = mapped_column(
        SAEnum(SupplierSupplyCategory, name="supplier_supply_category", values_callable=enum_values),
        nullable=False,
    )
    contact_info: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False, server_default=text("'{}'::jsonb"))
    active_status: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("true"))

    inventory_items: Mapped[list[Inventory]] = relationship(back_populates="supplier")
    expenses: Mapped[list[Expense]] = relationship(back_populates="supplier")

    __table_args__ = (Index("ix_suppliers_supply_category", "supply_category"),)


class Customer(Base, TimestampMixin):
    __tablename__ = "customers"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    business_name: Mapped[str] = mapped_column(String(200), nullable=False)
    segment_type: Mapped[CustomerSegmentType] = mapped_column(
        SAEnum(CustomerSegmentType, name="customer_segment_type", values_callable=enum_values),
        nullable=False,
    )
    credit_limit: Mapped[Decimal] = mapped_column(Numeric(15, 2), nullable=False, server_default=text("0"))
    current_balance: Mapped[Decimal] = mapped_column(Numeric(15, 2), nullable=False, server_default=text("0"))
    payment_reliability_score: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("50"))

    sales: Mapped[list[Sale]] = relationship(back_populates="customer")

    __table_args__ = (
        CheckConstraint("credit_limit >= 0", name="ck_customers_credit_limit_non_negative"),
        CheckConstraint("current_balance >= 0", name="ck_customers_balance_non_negative"),
        CheckConstraint(
            "payment_reliability_score BETWEEN 0 AND 100",
            name="ck_customers_payment_reliability_score_range",
        ),
        Index("ix_customers_segment_type", "segment_type"),
    )


class ProductionBatch(Base, TimestampMixin):
    __tablename__ = "production_batches"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    batch_number: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    product_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("products.id", ondelete="RESTRICT"), nullable=False)
    scheduled_qty: Mapped[Decimal] = mapped_column(Numeric(18, 3), nullable=False)
    actual_yield_qty: Mapped[Decimal | None] = mapped_column(Numeric(18, 3), nullable=True)
    reject_qty: Mapped[Decimal] = mapped_column(Numeric(18, 3), nullable=False, server_default=text("0"))
    machine_hours: Mapped[Decimal] = mapped_column(Numeric(18, 3), nullable=False, server_default=text("0"))
    raw_material_mix_log: Mapped[list[dict[str, Any]]] = mapped_column(
        JSONB,
        nullable=False,
        server_default=text("'[]'::jsonb"),
    )
    curing_status: Mapped[CuringStatus] = mapped_column(
        SAEnum(CuringStatus, name="curing_status", values_callable=enum_values),
        nullable=False,
        server_default=CuringStatus.MOLDING.value,
    )
    finalized_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    materials_posted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    product: Mapped[Product] = relationship(back_populates="production_batches")
    quality_tests: Mapped[list[QualityTest]] = relationship(back_populates="production_batch")
    inventory_transactions: Mapped[list[InventoryTransaction]] = relationship(back_populates="production_batch")

    __table_args__ = (
        CheckConstraint("scheduled_qty >= 0", name="ck_batches_scheduled_qty_non_negative"),
        CheckConstraint("actual_yield_qty IS NULL OR actual_yield_qty >= 0", name="ck_batches_actual_yield_non_negative"),
        CheckConstraint("reject_qty >= 0", name="ck_batches_reject_qty_non_negative"),
        CheckConstraint("machine_hours >= 0", name="ck_batches_machine_hours_non_negative"),
        Index("ix_production_batches_product_id", "product_id"),
        Index("ix_production_batches_status_product", "curing_status", "product_id"),
    )


class Inventory(Base, TimestampMixin):
    __tablename__ = "inventory"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    supplier_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("suppliers.id", ondelete="RESTRICT"), nullable=True)
    product_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("products.id", ondelete="RESTRICT"), nullable=True)
    item_name: Mapped[str] = mapped_column(String(160), nullable=False)
    physical_stock_on_hand: Mapped[Decimal] = mapped_column(Numeric(18, 3), nullable=False, server_default=text("0"))
    reserved_stock: Mapped[Decimal] = mapped_column(Numeric(18, 3), nullable=False, server_default=text("0"))
    available_stock: Mapped[Decimal] = mapped_column(
        Numeric(18, 3),
        Computed("physical_stock_on_hand - reserved_stock", persisted=True),
        nullable=False,
    )
    reorder_level: Mapped[Decimal] = mapped_column(Numeric(18, 3), nullable=False, server_default=text("0"))
    unit_cost: Mapped[Decimal] = mapped_column(Numeric(15, 2), nullable=False, server_default=text("0"))
    uom: Mapped[InventoryUom] = mapped_column(
        SAEnum(InventoryUom, name="inventory_uom", values_callable=enum_values),
        nullable=False,
    )

    supplier: Mapped[Supplier | None] = relationship(back_populates="inventory_items")
    product: Mapped[Product | None] = relationship(back_populates="inventory_items")
    transactions: Mapped[list[InventoryTransaction]] = relationship(back_populates="inventory")

    __table_args__ = (
        UniqueConstraint("item_name", "supplier_id", "product_id", name="uq_inventory_item_supplier_product"),
        CheckConstraint("physical_stock_on_hand >= 0", name="ck_inventory_physical_non_negative"),
        CheckConstraint("reserved_stock >= 0", name="ck_inventory_reserved_non_negative"),
        CheckConstraint("physical_stock_on_hand >= reserved_stock", name="ck_inventory_reserved_not_above_physical"),
        CheckConstraint("reorder_level >= 0", name="ck_inventory_reorder_non_negative"),
        CheckConstraint("unit_cost >= 0", name="ck_inventory_unit_cost_non_negative"),
        Index("ix_inventory_supplier_id", "supplier_id"),
        Index("ix_inventory_product_id", "product_id"),
        Index("ix_inventory_item_name", "item_name"),
    )


class InventoryTransaction(Base):
    __tablename__ = "inventory_transactions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    inventory_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("inventory.id", ondelete="RESTRICT"), nullable=False)
    production_batch_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("production_batches.id", ondelete="RESTRICT"),
        nullable=True,
    )
    tx_type: Mapped[InventoryTransactionType] = mapped_column(
        SAEnum(InventoryTransactionType, name="inventory_tx_type", values_callable=enum_values),
        nullable=False,
    )
    quantity: Mapped[Decimal] = mapped_column(Numeric(18, 3), nullable=False)
    operator_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    inventory: Mapped[Inventory] = relationship(back_populates="transactions")
    production_batch: Mapped[ProductionBatch | None] = relationship(back_populates="inventory_transactions")

    __table_args__ = (
        CheckConstraint("quantity > 0", name="ck_inventory_transactions_quantity_positive"),
        Index("ix_inventory_transactions_inventory_id", "inventory_id"),
        Index("ix_inventory_transactions_batch_id", "production_batch_id"),
        Index("ix_inventory_transactions_timestamp", "timestamp"),
    )


class Sale(Base, TimestampMixin):
    __tablename__ = "sales"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("products.id", ondelete="RESTRICT"), nullable=False)
    customer_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("customers.id", ondelete="RESTRICT"), nullable=False)
    invoice_number: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    order_qty: Mapped[Decimal] = mapped_column(Numeric(18, 3), nullable=False)
    unit_price: Mapped[Decimal] = mapped_column(Numeric(15, 2), nullable=False)
    delivery_cost: Mapped[Decimal] = mapped_column(Numeric(15, 2), nullable=False, server_default=text("0"))
    total_amount: Mapped[Decimal] = mapped_column(Numeric(15, 2), nullable=False)
    paid_amount: Mapped[Decimal] = mapped_column(Numeric(15, 2), nullable=False, server_default=text("0"))
    balance_owed: Mapped[Decimal] = mapped_column(Numeric(15, 2), nullable=False)
    status: Mapped[SaleStatus] = mapped_column(
        SAEnum(SaleStatus, name="sales_status", values_callable=enum_values),
        nullable=False,
        server_default=SaleStatus.DRAFT.value,
    )
    dispatched_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    product: Mapped[Product] = relationship(back_populates="sales")
    customer: Mapped[Customer] = relationship(back_populates="sales")
    fulfillment_receipts: Mapped[list[FulfillmentReceipt]] = relationship(back_populates="sale")

    __table_args__ = (
        CheckConstraint("order_qty > 0", name="ck_sales_order_qty_positive"),
        CheckConstraint("unit_price >= 0", name="ck_sales_unit_price_non_negative"),
        CheckConstraint("delivery_cost >= 0", name="ck_sales_delivery_cost_non_negative"),
        CheckConstraint("total_amount >= 0", name="ck_sales_total_amount_non_negative"),
        CheckConstraint("paid_amount >= 0", name="ck_sales_paid_amount_non_negative"),
        CheckConstraint("balance_owed >= 0", name="ck_sales_balance_owed_non_negative"),
        Index("ix_sales_product_id", "product_id"),
        Index("ix_sales_customer_id", "customer_id"),
        Index("ix_sales_status", "status"),
    )


class Expense(Base, TimestampMixin):
    __tablename__ = "expenses"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    supplier_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("suppliers.id", ondelete="RESTRICT"), nullable=True)
    expense_category: Mapped[ExpenseCategory] = mapped_column(
        SAEnum(ExpenseCategory, name="expense_category", values_callable=enum_values),
        nullable=False,
    )
    amount: Mapped[Decimal] = mapped_column(Numeric(15, 2), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    tracking_metadata: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False, server_default=text("'{}'::jsonb"))

    supplier: Mapped[Supplier | None] = relationship(back_populates="expenses")

    __table_args__ = (
        CheckConstraint("amount >= 0", name="ck_expenses_amount_non_negative"),
        Index("ix_expenses_supplier_id", "supplier_id"),
        Index("ix_expenses_category", "expense_category"),
    )


class QualityTest(Base, TimestampMixin):
    __tablename__ = "quality_tests"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    production_batch_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("production_batches.id", ondelete="RESTRICT"),
        nullable=False,
    )
    product_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("products.id", ondelete="RESTRICT"), nullable=False)
    test_date: Mapped[date] = mapped_column(Date, nullable=False)
    compressive_strength_mpa: Mapped[Decimal] = mapped_column(Numeric(10, 3), nullable=False)
    absorption_rate: Mapped[Decimal] = mapped_column(Numeric(10, 3), nullable=False)
    dimensions_passed: Mapped[bool] = mapped_column(Boolean, nullable=False)
    defects_count: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("0"))
    approval_state: Mapped[QualityApprovalState] = mapped_column(
        SAEnum(QualityApprovalState, name="quality_approval_state", values_callable=enum_values),
        nullable=False,
        server_default=QualityApprovalState.PENDING_REVIEW.value,
    )

    production_batch: Mapped[ProductionBatch] = relationship(back_populates="quality_tests")
    product: Mapped[Product] = relationship(back_populates="quality_tests")

    __table_args__ = (
        CheckConstraint("compressive_strength_mpa >= 0", name="ck_quality_strength_non_negative"),
        CheckConstraint("absorption_rate >= 0", name="ck_quality_absorption_non_negative"),
        CheckConstraint("defects_count >= 0", name="ck_quality_defects_non_negative"),
        Index("ix_quality_tests_production_batch_id", "production_batch_id"),
        Index("ix_quality_tests_product_id", "product_id"),
        Index("ix_quality_tests_approval_state", "approval_state"),
    )


class CompetitorRecord(Base, TimestampMixin):
    __tablename__ = "competitor_records"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    competitor_name: Mapped[str] = mapped_column(String(200), nullable=False)
    profile_layer: Mapped[CompetitorProfileLayer] = mapped_column(
        SAEnum(CompetitorProfileLayer, name="competitor_profile_layer", values_callable=enum_values),
        nullable=False,
    )
    product_profile_code: Mapped[str] = mapped_column(String(64), nullable=False)
    direct_quote_price: Mapped[Decimal | None] = mapped_column(Numeric(15, 2), nullable=True)
    validation_metadata: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False, server_default=text("'{}'::jsonb"))

    __table_args__ = (
        CheckConstraint("direct_quote_price IS NULL OR direct_quote_price >= 0", name="ck_competitor_quote_non_negative"),
        Index("ix_competitor_records_profile_layer", "profile_layer"),
        Index("ix_competitor_records_product_profile_code", "product_profile_code"),
    )


class FulfillmentReceipt(Base):
    """Immutable delivery-note receipt log emitted by dispatch workflow."""

    __tablename__ = "fulfillment_receipts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    sale_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("sales.id", ondelete="RESTRICT"), nullable=False)
    inventory_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("inventory.id", ondelete="RESTRICT"), nullable=False)
    delivery_note_number: Mapped[str] = mapped_column(String(80), unique=True, nullable=False)
    signed_by: Mapped[str] = mapped_column(String(160), nullable=False)
    dispatched_qty: Mapped[Decimal] = mapped_column(Numeric(18, 3), nullable=False)
    receipt_payload: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False, server_default=text("'{}'::jsonb"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    sale: Mapped[Sale] = relationship(back_populates="fulfillment_receipts")

    __table_args__ = (
        CheckConstraint("dispatched_qty > 0", name="ck_fulfillment_receipts_qty_positive"),
        Index("ix_fulfillment_receipts_sale_id", "sale_id"),
        Index("ix_fulfillment_receipts_inventory_id", "inventory_id"),
    )
