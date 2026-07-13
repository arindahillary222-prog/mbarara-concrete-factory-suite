from __future__ import annotations

import uuid
from datetime import UTC, datetime

from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.database import get_session
from app.errors import DomainError
from app.models import (
    AuditLog,
    CompetitorRecord,
    Customer,
    Expense,
    Inventory,
    Product,
    ProductionBatch,
    QualityTest,
    Supplier,
    User,
    UserRole,
)
from app.schemas import (
    AccessTokenResponse,
    AvailabilityResponse,
    AuditLogRead,
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
    LoginRequest,
    OwnerBootstrapRequest,
    InventoryCreate,
    InventoryRead,
    ProductCreate,
    ProductRead,
    ProductionBatchCreate,
    ProductionBatchRead,
    QualityTestCreate,
    QualityTestRead,
    SoftwareStatusResponse,
    SupplierCreate,
    SupplierRead,
    UserRead,
)
from app.security import create_access_token, hash_password, verify_access_token, verify_password
from app.services import dispatch_sale, finalize_production_batch, list_public_availability, place_contractor_order


router = APIRouter(prefix="/api/v1", responses={400: {"model": ErrorResponse}})
settings = get_settings()


def raise_http_error(error: DomainError) -> None:
    raise HTTPException(status_code=error.status_code, detail=str(error)) from error


async def get_current_user(
    authorization: str | None = Header(default=None),
    session: AsyncSession = Depends(get_session),
) -> User:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required.")

    token = authorization.split(" ", 1)[1].strip()
    payload = verify_access_token(token, settings.api_secret_key)
    if payload is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired access token.")

    try:
        user_id = uuid.UUID(str(payload.get("sub")))
    except (TypeError, ValueError) as error:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid access token subject.") from error

    user = await session.scalar(select(User).where(User.id == user_id))
    if user is None or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User is not active.")
    return user


async def require_staff_user(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role not in {UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Staff access required.")
    return current_user


async def require_admin_user(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role not in {UserRole.OWNER, UserRole.ADMIN}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Owner or admin access required.")
    return current_user


def _audit_log(actor: User | None, action: str, entity_type: str, entity_id: uuid.UUID | None = None) -> AuditLog:
    return AuditLog(
        actor_user_id=actor.id if actor else None,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        event_metadata={},
    )


async def _create_record(session: AsyncSession, instance: object, actor: User | None = None, entity_type: str | None = None) -> object:
    try:
        async with session.begin():
            session.add(instance)
            await session.flush()
            if actor is not None and entity_type is not None:
                session.add(_audit_log(actor, "create", entity_type, getattr(instance, "id", None)))
    except IntegrityError as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Record violates a database constraint.") from error
    await session.refresh(instance)
    return instance


@router.post("/auth/bootstrap-owner", response_model=UserRead, status_code=status.HTTP_201_CREATED, tags=["Security"])
async def bootstrap_owner(payload: OwnerBootstrapRequest, session: AsyncSession = Depends(get_session)) -> UserRead:
    if settings.bootstrap_owner_setup_key and payload.setup_key != settings.bootstrap_owner_setup_key:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid owner setup key.")

    existing_count = await session.scalar(select(func.count(User.id)))
    if existing_count:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Owner account has already been bootstrapped.")

    owner = User(
        email=payload.email,
        full_name=payload.full_name,
        role=UserRole.OWNER,
        password_hash=hash_password(payload.password),
        is_active=True,
    )
    try:
        session.add(owner)
        await session.flush()
        session.add(_audit_log(owner, "bootstrap-owner", "users", owner.id))
        await session.commit()
    except IntegrityError as error:
        await session.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Owner account could not be created.") from error
    await session.refresh(owner)
    return UserRead.model_validate(owner)


@router.post("/auth/login", response_model=AccessTokenResponse, tags=["Security"])
async def login(payload: LoginRequest, session: AsyncSession = Depends(get_session)) -> AccessTokenResponse:
    user = await session.scalar(select(User).where(func.lower(User.email) == payload.email.lower()))
    if user is None or not user.is_active or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password.")

    user.last_login_at = datetime.now(tz=UTC)
    session.add(_audit_log(user, "login", "users", user.id))
    await session.commit()

    expires_in = settings.access_token_expire_minutes * 60
    token = create_access_token(
        {"sub": str(user.id), "email": user.email, "role": user.role.value},
        settings.api_secret_key,
        expires_in,
    )
    await session.refresh(user)
    return AccessTokenResponse(access_token=token, expires_in_seconds=expires_in, user=UserRead.model_validate(user))


@router.get("/auth/me", response_model=UserRead, tags=["Security"])
async def read_current_user(current_user: User = Depends(get_current_user)) -> UserRead:
    return UserRead.model_validate(current_user)


@router.get("/audit-logs", response_model=list[AuditLogRead], tags=["Security"])
async def list_audit_logs(
    limit: int = 100,
    offset: int = 0,
    _: User = Depends(require_admin_user),
    session: AsyncSession = Depends(get_session),
) -> list[AuditLogRead]:
    rows = (await session.scalars(select(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit).offset(offset))).all()
    return [AuditLogRead.model_validate(row) for row in rows]


@router.get("/system/software-core", response_model=SoftwareStatusResponse, tags=["System"])
async def software_core_status(_: User = Depends(require_staff_user)) -> SoftwareStatusResponse:
    return SoftwareStatusResponse(
        app_name=settings.app_name,
        environment=settings.environment,
        database_engine="PostgreSQL via async SQLAlchemy",
        security_model="Owner/staff bearer tokens with PBKDF2 password hashing and HMAC token signatures",
        protected_modules=["sales", "inventory", "production", "quality control", "expenses", "market intelligence"],
        currency_policy="UGX remains the accounting and settlement currency",
        owner_control="Only authenticated owner/admin/staff users can write ERP records",
    )


@router.post("/products", response_model=ProductRead, status_code=status.HTTP_201_CREATED, tags=["ERP Reference Data"])
async def create_product(
    payload: ProductCreate,
    current_user: User = Depends(require_staff_user),
    session: AsyncSession = Depends(get_session),
) -> ProductRead:
    product = Product(**payload.model_dump())
    return ProductRead.model_validate(await _create_record(session, product, current_user, "products"))


@router.get("/products", response_model=list[ProductRead], tags=["ERP Reference Data"])
async def list_products(
    limit: int = 100,
    offset: int = 0,
    _: User = Depends(require_staff_user),
    session: AsyncSession = Depends(get_session),
) -> list[ProductRead]:
    rows = (await session.scalars(select(Product).order_by(Product.code).limit(limit).offset(offset))).all()
    return [ProductRead.model_validate(row) for row in rows]


@router.post("/suppliers", response_model=SupplierRead, status_code=status.HTTP_201_CREATED, tags=["ERP Reference Data"])
async def create_supplier(
    payload: SupplierCreate,
    current_user: User = Depends(require_staff_user),
    session: AsyncSession = Depends(get_session),
) -> SupplierRead:
    supplier = Supplier(**payload.model_dump())
    return SupplierRead.model_validate(await _create_record(session, supplier, current_user, "suppliers"))


@router.get("/suppliers", response_model=list[SupplierRead], tags=["ERP Reference Data"])
async def list_suppliers(
    limit: int = 100,
    offset: int = 0,
    _: User = Depends(require_staff_user),
    session: AsyncSession = Depends(get_session),
) -> list[SupplierRead]:
    rows = (await session.scalars(select(Supplier).order_by(Supplier.name).limit(limit).offset(offset))).all()
    return [SupplierRead.model_validate(row) for row in rows]


@router.post("/customers", response_model=CustomerRead, status_code=status.HTTP_201_CREATED, tags=["ERP Reference Data"])
async def create_customer(
    payload: CustomerCreate,
    current_user: User = Depends(require_staff_user),
    session: AsyncSession = Depends(get_session),
) -> CustomerRead:
    customer = Customer(**payload.model_dump())
    return CustomerRead.model_validate(await _create_record(session, customer, current_user, "customers"))


@router.get("/customers", response_model=list[CustomerRead], tags=["ERP Reference Data"])
async def list_customers(
    limit: int = 100,
    offset: int = 0,
    _: User = Depends(require_staff_user),
    session: AsyncSession = Depends(get_session),
) -> list[CustomerRead]:
    rows = (await session.scalars(select(Customer).order_by(Customer.business_name).limit(limit).offset(offset))).all()
    return [CustomerRead.model_validate(row) for row in rows]


@router.post("/inventory", response_model=InventoryRead, status_code=status.HTTP_201_CREATED, tags=["Inventory"])
async def create_inventory_item(
    payload: InventoryCreate,
    current_user: User = Depends(require_staff_user),
    session: AsyncSession = Depends(get_session),
) -> InventoryRead:
    inventory = Inventory(**payload.model_dump())
    return InventoryRead.model_validate(await _create_record(session, inventory, current_user, "inventory"))


@router.get("/inventory", response_model=list[InventoryRead], tags=["Inventory"])
async def list_inventory(
    limit: int = 100,
    offset: int = 0,
    _: User = Depends(require_staff_user),
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
    current_user: User = Depends(require_staff_user),
    session: AsyncSession = Depends(get_session),
) -> ProductionBatchRead:
    data = payload.model_dump(exclude={"raw_material_mix_log"})
    batch = ProductionBatch(
        **data,
        raw_material_mix_log=[line.model_dump(mode="json") for line in payload.raw_material_mix_log],
    )
    return ProductionBatchRead.model_validate(await _create_record(session, batch, current_user, "production_batches"))


@router.get("/production/batches", response_model=list[ProductionBatchRead], tags=["Production"])
async def list_production_batches(
    limit: int = 100,
    offset: int = 0,
    _: User = Depends(require_staff_user),
    session: AsyncSession = Depends(get_session),
) -> list[ProductionBatchRead]:
    rows = (
        await session.scalars(select(ProductionBatch).order_by(ProductionBatch.created_at.desc()).limit(limit).offset(offset))
    ).all()
    return [ProductionBatchRead.model_validate(row) for row in rows]


@router.post("/quality-tests", response_model=QualityTestRead, status_code=status.HTTP_201_CREATED, tags=["Quality"])
async def create_quality_test(
    payload: QualityTestCreate,
    current_user: User = Depends(require_staff_user),
    session: AsyncSession = Depends(get_session),
) -> QualityTestRead:
    quality_test = QualityTest(**payload.model_dump())
    return QualityTestRead.model_validate(await _create_record(session, quality_test, current_user, "quality_tests"))


@router.get("/quality-tests", response_model=list[QualityTestRead], tags=["Quality"])
async def list_quality_tests(
    limit: int = 100,
    offset: int = 0,
    _: User = Depends(require_staff_user),
    session: AsyncSession = Depends(get_session),
) -> list[QualityTestRead]:
    rows = (
        await session.scalars(select(QualityTest).order_by(QualityTest.test_date.desc()).limit(limit).offset(offset))
    ).all()
    return [QualityTestRead.model_validate(row) for row in rows]


@router.post("/expenses", response_model=ExpenseRead, status_code=status.HTTP_201_CREATED, tags=["Expenses"])
async def create_expense(
    payload: ExpenseCreate,
    current_user: User = Depends(require_staff_user),
    session: AsyncSession = Depends(get_session),
) -> ExpenseRead:
    expense = Expense(**payload.model_dump())
    return ExpenseRead.model_validate(await _create_record(session, expense, current_user, "expenses"))


@router.get("/expenses", response_model=list[ExpenseRead], tags=["Expenses"])
async def list_expenses(
    limit: int = 100,
    offset: int = 0,
    _: User = Depends(require_staff_user),
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
    current_user: User = Depends(require_staff_user),
    session: AsyncSession = Depends(get_session),
) -> CompetitorRecordRead:
    competitor = CompetitorRecord(**payload.model_dump())
    return CompetitorRecordRead.model_validate(await _create_record(session, competitor, current_user, "competitor_records"))


@router.get("/competitors", response_model=list[CompetitorRecordRead], tags=["Market Intelligence"])
async def list_competitor_records(
    limit: int = 100,
    offset: int = 0,
    _: User = Depends(require_staff_user),
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
    _: User = Depends(require_staff_user),
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
    _: User = Depends(require_staff_user),
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
    _: User = Depends(require_staff_user),
    session: AsyncSession = Depends(get_session),
) -> DispatchResponse:
    try:
        return await dispatch_sale(session, payload)
    except DomainError as error:
        raise_http_error(error)
