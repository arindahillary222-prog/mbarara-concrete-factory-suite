# Mbarara Concrete Factory Backend

FastAPI backend for the Mbarara Integrated Concrete Products Factory ERP and B2B contractor portal.

## Stack

- Python 3.12+
- FastAPI
- SQLAlchemy 2.x async ORM
- PostgreSQL with `asyncpg`
- UUIDv4 primary keys
- UGX-only financial values using `NUMERIC(15,2)`
- Pessimistic row locks for stock, credit, production finalisation, and dispatch workflows

## Files

- `app/models.py` - strict SQLAlchemy models and enums
- `app/schemas.py` - Pydantic request and response schemas
- `app/services.py` - transactional workflow logic
- `app/api.py` - API routes
- `migrations/001_initial_schema.sql` - PostgreSQL production schema

## Setup

```powershell
cd outputs/mbarara-concrete-factory-platform/backend
C:\Users\arind\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe -m venv .venv
.\\.venv\\Scripts\\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
```

Use Python 3.12 for this backend. The laptop's current default Python 3.14 is too new for the pinned production dependency set used here.

Create the database, then run:

```powershell
psql -U postgres -d mbarara_factory -f migrations/001_initial_schema.sql
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Health check:

```text
GET http://localhost:8000/health
```

API docs:

```text
http://localhost:8000/docs
```

## Local Stack Scripts

After the portable PostgreSQL runtime has been staged, start the database and API together:

```powershell
.\start-local-stack.ps1
```

Stop the local stack:

```powershell
.\stop-local-stack.ps1
```

The local PostgreSQL files live under:

```text
work/postgresql-portable
work/postgresql-data
```

## Core Workflows

`GET /api/v1/public/availability`

Only exposes products where production batches are `Released for Sale` and quality tests are `UNBS Approved` or `Internal Pass`.

`POST /api/v1/production/batches/{batch_id}/finalize`

Locks the batch and raw-material inventory rows, posts raw-material consumption from the JSONB mix log, deducts stock, and prevents duplicate posting.

`POST /api/v1/contractor/orders`

Locks the customer and product inventory rows, checks credit limit, creates an approved sale, and reserves stock so walk-in buyers cannot consume it.

`POST /api/v1/fulfillment/dispatch`

Locks sale, customer, and inventory rows, deducts physical and reserved stock, posts the customer balance, completes the sale, and emits an immutable fulfillment receipt.

## ERP Create/List Endpoints

The API also includes create/list routes for:

- products
- suppliers
- customers
- inventory
- production batches
- quality tests
- expenses
- competitor records

## Notes

The `competitor_records` table has no foreign keys to ledger tables. This keeps market intelligence isolated from financial and inventory reporting.

The backend includes one operational addition beyond the requested 10 core tables: `fulfillment_receipts`. It is required to satisfy the immutable dispatch receipt workflow.
