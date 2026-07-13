from __future__ import annotations

import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.models import (
    CompetitorProfileLayer,
    CuringStatus,
    CustomerSegmentType,
    ExpenseCategory,
    InventoryTransactionType,
    InventoryUom,
    ProductUom,
    QualityApprovalState,
    SaleStatus,
    SupplierSupplyCategory,
    UserRole,
)


Money = Decimal
Quantity = Decimal


class StrictBaseModel(BaseModel):
    model_config = ConfigDict(from_attributes=True, use_enum_values=True)


class ProductCreate(StrictBaseModel):
    code: str = Field(min_length=1, max_length=32)
    format_description: str = Field(min_length=3)
    uom: ProductUom
    base_ex_works_price: Money = Field(ge=0, decimal_places=2)
    min_stock_threshold: Quantity = Field(default=Decimal("0"), ge=0)


class ProductRead(ProductCreate):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime


class SupplierCreate(StrictBaseModel):
    name: str = Field(min_length=2, max_length=200)
    supply_category: SupplierSupplyCategory
    contact_info: dict[str, Any] = Field(default_factory=dict)
    active_status: bool = True


class SupplierRead(SupplierCreate):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime


class CustomerCreate(StrictBaseModel):
    business_name: str = Field(min_length=2, max_length=200)
    segment_type: CustomerSegmentType
    credit_limit: Money = Field(default=Decimal("0"), ge=0, decimal_places=2)
    current_balance: Money = Field(default=Decimal("0"), ge=0, decimal_places=2)
    payment_reliability_score: int = Field(default=50, ge=0, le=100)


class CustomerRead(CustomerCreate):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime


class RawMaterialIssueLine(StrictBaseModel):
    item_name: str = Field(min_length=1, max_length=160)
    quantity: Quantity = Field(gt=0)
    uom: InventoryUom
    quantity_kg: Quantity | None = Field(default=None, ge=0)
    metadata: dict[str, Any] = Field(default_factory=dict)


class ProductionBatchCreate(StrictBaseModel):
    batch_number: str = Field(min_length=1, max_length=64)
    product_id: uuid.UUID
    scheduled_qty: Quantity = Field(ge=0)
    machine_hours: Quantity = Field(default=Decimal("0"), ge=0)
    raw_material_mix_log: list[RawMaterialIssueLine] = Field(default_factory=list)
    curing_status: CuringStatus = CuringStatus.MOLDING


class ProductionBatchRead(StrictBaseModel):
    id: uuid.UUID
    batch_number: str
    product_id: uuid.UUID
    scheduled_qty: Quantity
    actual_yield_qty: Quantity | None
    reject_qty: Quantity
    machine_hours: Quantity
    raw_material_mix_log: list[dict[str, Any]]
    curing_status: CuringStatus
    finalized_at: datetime | None
    materials_posted_at: datetime | None
    created_at: datetime
    updated_at: datetime


class FinalizeBatchRequest(StrictBaseModel):
    actual_yield_qty: Quantity = Field(ge=0)
    reject_qty: Quantity = Field(default=Decimal("0"), ge=0)
    machine_hours: Quantity | None = Field(default=None, ge=0)
    curing_status: CuringStatus = CuringStatus.READY_FOR_TESTING
    raw_material_mix_log: list[RawMaterialIssueLine] | None = None
    operator_id: uuid.UUID

    @model_validator(mode="after")
    def reject_qty_cannot_exceed_yield(self) -> FinalizeBatchRequest:
        if self.reject_qty > self.actual_yield_qty:
            raise ValueError("reject_qty cannot exceed actual_yield_qty")
        return self


class InventoryCreate(StrictBaseModel):
    supplier_id: uuid.UUID | None = None
    product_id: uuid.UUID | None = None
    item_name: str = Field(min_length=1, max_length=160)
    physical_stock_on_hand: Quantity = Field(default=Decimal("0"), ge=0)
    reserved_stock: Quantity = Field(default=Decimal("0"), ge=0)
    reorder_level: Quantity = Field(default=Decimal("0"), ge=0)
    unit_cost: Money = Field(default=Decimal("0"), ge=0, decimal_places=2)
    uom: InventoryUom

    @model_validator(mode="after")
    def reserved_stock_cannot_exceed_physical_stock(self) -> InventoryCreate:
        if self.reserved_stock > self.physical_stock_on_hand:
            raise ValueError("reserved_stock cannot exceed physical_stock_on_hand")
        return self


class InventoryRead(InventoryCreate):
    id: uuid.UUID
    available_stock: Quantity
    created_at: datetime
    updated_at: datetime


class InventoryTransactionRead(StrictBaseModel):
    id: uuid.UUID
    inventory_id: uuid.UUID
    production_batch_id: uuid.UUID | None
    tx_type: InventoryTransactionType
    quantity: Quantity
    operator_id: uuid.UUID
    timestamp: datetime


class SaleRead(StrictBaseModel):
    id: uuid.UUID
    product_id: uuid.UUID
    customer_id: uuid.UUID
    invoice_number: str
    order_qty: Quantity
    unit_price: Money
    delivery_cost: Money
    total_amount: Money
    paid_amount: Money
    balance_owed: Money
    status: SaleStatus
    dispatched_at: datetime | None
    created_at: datetime
    updated_at: datetime


class ContractorOrderRequest(StrictBaseModel):
    customer_id: uuid.UUID
    product_id: uuid.UUID
    order_qty: Quantity = Field(gt=0)
    unit_price: Money = Field(gt=0, decimal_places=2)
    delivery_cost: Money = Field(default=Decimal("0"), ge=0, decimal_places=2)
    paid_amount: Money = Field(default=Decimal("0"), ge=0, decimal_places=2)
    invoice_number: str | None = Field(default=None, max_length=64)


class ContractorOrderResponse(StrictBaseModel):
    sale: SaleRead
    reserved_stock_after_order: Quantity
    available_stock_after_order: Quantity


class ExpenseCreate(StrictBaseModel):
    supplier_id: uuid.UUID | None = None
    expense_category: ExpenseCategory
    amount: Money = Field(ge=0, decimal_places=2)
    description: str = Field(min_length=2)
    tracking_metadata: dict[str, Any] = Field(default_factory=dict)


class ExpenseRead(ExpenseCreate):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime


class QualityTestCreate(StrictBaseModel):
    production_batch_id: uuid.UUID
    product_id: uuid.UUID
    test_date: date
    compressive_strength_mpa: Decimal = Field(ge=0)
    absorption_rate: Decimal = Field(ge=0)
    dimensions_passed: bool
    defects_count: int = Field(ge=0)
    approval_state: QualityApprovalState = QualityApprovalState.PENDING_REVIEW


class QualityTestRead(QualityTestCreate):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime


class CompetitorRecordCreate(StrictBaseModel):
    competitor_name: str = Field(min_length=2, max_length=200)
    profile_layer: CompetitorProfileLayer
    product_profile_code: str = Field(min_length=1, max_length=64)
    direct_quote_price: Money | None = Field(default=None, ge=0, decimal_places=2)
    validation_metadata: dict[str, Any] = Field(default_factory=dict)


class CompetitorRecordRead(CompetitorRecordCreate):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime


class AvailabilityResponse(StrictBaseModel):
    product_id: uuid.UUID
    code: str
    format_description: str
    uom: ProductUom
    base_ex_works_price: Money
    released_batch_qty: Quantity
    available_inventory_qty: Quantity | None
    public_available_qty: Quantity
    data_gate: str = "Released for Sale + approved quality test only"


class DispatchRequest(StrictBaseModel):
    sale_id: uuid.UUID
    delivery_note_number: str = Field(min_length=1, max_length=80)
    signed_by: str = Field(min_length=2, max_length=160)
    operator_id: uuid.UUID
    delivery_metadata: dict[str, Any] = Field(default_factory=dict)


class FulfillmentReceiptRead(StrictBaseModel):
    id: uuid.UUID
    sale_id: uuid.UUID
    inventory_id: uuid.UUID
    delivery_note_number: str
    signed_by: str
    dispatched_qty: Quantity
    receipt_payload: dict[str, Any]
    created_at: datetime


class DispatchResponse(StrictBaseModel):
    sale: SaleRead
    receipt: FulfillmentReceiptRead
    customer_balance_after_dispatch: Money
    physical_stock_after_dispatch: Quantity
    reserved_stock_after_dispatch: Quantity


class ErrorResponse(StrictBaseModel):
    detail: str


class OwnerBootstrapRequest(StrictBaseModel):
    email: str = Field(min_length=5, max_length=255)
    full_name: str = Field(min_length=2, max_length=200)
    password: str = Field(min_length=10, max_length=128)
    setup_key: str | None = Field(default=None, max_length=255)

    @field_validator("email")
    @classmethod
    def normalise_email(cls, value: str) -> str:
        return value.strip().lower()


class LoginRequest(StrictBaseModel):
    email: str = Field(min_length=5, max_length=255)
    password: str = Field(min_length=1, max_length=128)

    @field_validator("email")
    @classmethod
    def normalise_email(cls, value: str) -> str:
        return value.strip().lower()


class UserRead(StrictBaseModel):
    id: uuid.UUID
    email: str
    full_name: str
    role: UserRole
    is_active: bool
    last_login_at: datetime | None
    created_at: datetime
    updated_at: datetime


class AccessTokenResponse(StrictBaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in_seconds: int
    user: UserRead


class AuditLogRead(StrictBaseModel):
    id: uuid.UUID
    actor_user_id: uuid.UUID | None
    action: str
    entity_type: str
    entity_id: uuid.UUID | None
    event_metadata: dict[str, Any]
    created_at: datetime


class SoftwareStatusResponse(StrictBaseModel):
    app_name: str
    environment: str
    database_engine: str
    security_model: str
    protected_modules: list[str]
    currency_policy: str
    owner_control: str
