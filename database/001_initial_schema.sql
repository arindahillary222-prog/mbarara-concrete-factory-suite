CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$ BEGIN
  CREATE TYPE product_uom AS ENUM ('unit', 'm2', 'm3');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE supplier_supply_category AS ENUM ('cement', 'quarry', 'diesel', 'water', 'spares', 'logistics');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE customer_segment_type AS ENUM ('Cash Buyer', 'Contractor', 'Dealer', 'Institution');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE curing_status AS ENUM (
    'Molding',
    'Covered Wet Curing',
    'Controlled Chambers',
    'Ready for Testing',
    'Released for Sale',
    'Rejected'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE inventory_uom AS ENUM ('unit', 'm2', 'm3', 'bag', 'kg', 'tonne', 'litre');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE inventory_tx_type AS ENUM ('add-stock-supplier', 'issue-to-production', 'adjustment');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE sales_status AS ENUM ('Draft', 'Approved', 'Fulfilling', 'Out for Delivery', 'Completed', 'Cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE expense_category AS ENUM ('payroll', 'utilities', 'maintenance', 'security', 'transport', 'other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE quality_approval_state AS ENUM ('Pending Review', 'UNBS Approved', 'Internal Pass', 'Failed/Scrapped');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE competitor_profile_layer AS ENUM ('informal', 'regional', 'national', 'cement-linked', 'site-cast');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code varchar(32) NOT NULL UNIQUE,
  format_description text NOT NULL,
  uom product_uom NOT NULL,
  base_ex_works_price numeric(15,2) NOT NULL CHECK (base_ex_works_price >= 0),
  min_stock_threshold numeric(18,3) NOT NULL DEFAULT 0 CHECK (min_stock_threshold >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(200) NOT NULL,
  supply_category supplier_supply_category NOT NULL,
  contact_info jsonb NOT NULL DEFAULT '{}'::jsonb,
  active_status boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name varchar(200) NOT NULL,
  segment_type customer_segment_type NOT NULL,
  credit_limit numeric(15,2) NOT NULL DEFAULT 0 CHECK (credit_limit >= 0),
  current_balance numeric(15,2) NOT NULL DEFAULT 0 CHECK (current_balance >= 0),
  payment_reliability_score int NOT NULL DEFAULT 50 CHECK (payment_reliability_score BETWEEN 0 AND 100),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS production_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_number varchar(64) NOT NULL UNIQUE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  scheduled_qty numeric(18,3) NOT NULL CHECK (scheduled_qty >= 0),
  actual_yield_qty numeric(18,3) NULL CHECK (actual_yield_qty IS NULL OR actual_yield_qty >= 0),
  reject_qty numeric(18,3) NOT NULL DEFAULT 0 CHECK (reject_qty >= 0),
  machine_hours numeric(18,3) NOT NULL DEFAULT 0 CHECK (machine_hours >= 0),
  raw_material_mix_log jsonb NOT NULL DEFAULT '[]'::jsonb,
  curing_status curing_status NOT NULL DEFAULT 'Molding',
  finalized_at timestamptz NULL,
  materials_posted_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
  product_id uuid NULL REFERENCES products(id) ON DELETE RESTRICT,
  item_name varchar(160) NOT NULL,
  physical_stock_on_hand numeric(18,3) NOT NULL DEFAULT 0 CHECK (physical_stock_on_hand >= 0),
  reserved_stock numeric(18,3) NOT NULL DEFAULT 0 CHECK (reserved_stock >= 0),
  available_stock numeric(18,3) GENERATED ALWAYS AS (physical_stock_on_hand - reserved_stock) STORED,
  reorder_level numeric(18,3) NOT NULL DEFAULT 0 CHECK (reorder_level >= 0),
  unit_cost numeric(15,2) NOT NULL DEFAULT 0 CHECK (unit_cost >= 0),
  uom inventory_uom NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ck_inventory_reserved_not_above_physical CHECK (physical_stock_on_hand >= reserved_stock),
  CONSTRAINT uq_inventory_item_supplier_product UNIQUE (item_name, supplier_id, product_id)
);

CREATE TABLE IF NOT EXISTS inventory_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_id uuid NOT NULL REFERENCES inventory(id) ON DELETE RESTRICT,
  production_batch_id uuid NULL REFERENCES production_batches(id) ON DELETE RESTRICT,
  tx_type inventory_tx_type NOT NULL,
  quantity numeric(18,3) NOT NULL CHECK (quantity > 0),
  operator_id uuid NOT NULL,
  "timestamp" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  invoice_number varchar(64) NOT NULL UNIQUE,
  order_qty numeric(18,3) NOT NULL CHECK (order_qty > 0),
  unit_price numeric(15,2) NOT NULL CHECK (unit_price >= 0),
  delivery_cost numeric(15,2) NOT NULL DEFAULT 0 CHECK (delivery_cost >= 0),
  total_amount numeric(15,2) NOT NULL CHECK (total_amount >= 0),
  paid_amount numeric(15,2) NOT NULL DEFAULT 0 CHECK (paid_amount >= 0),
  balance_owed numeric(15,2) NOT NULL CHECK (balance_owed >= 0),
  status sales_status NOT NULL DEFAULT 'Draft',
  dispatched_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
  expense_category expense_category NOT NULL,
  amount numeric(15,2) NOT NULL CHECK (amount >= 0),
  description text NOT NULL,
  tracking_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS quality_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  production_batch_id uuid NOT NULL REFERENCES production_batches(id) ON DELETE RESTRICT,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  test_date date NOT NULL,
  compressive_strength_mpa numeric(10,3) NOT NULL CHECK (compressive_strength_mpa >= 0),
  absorption_rate numeric(10,3) NOT NULL CHECK (absorption_rate >= 0),
  dimensions_passed boolean NOT NULL,
  defects_count int NOT NULL DEFAULT 0 CHECK (defects_count >= 0),
  approval_state quality_approval_state NOT NULL DEFAULT 'Pending Review',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS competitor_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_name varchar(200) NOT NULL,
  profile_layer competitor_profile_layer NOT NULL,
  product_profile_code varchar(64) NOT NULL,
  direct_quote_price numeric(15,2) NULL CHECK (direct_quote_price IS NULL OR direct_quote_price >= 0),
  validation_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS fulfillment_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid NOT NULL REFERENCES sales(id) ON DELETE RESTRICT,
  inventory_id uuid NOT NULL REFERENCES inventory(id) ON DELETE RESTRICT,
  delivery_note_number varchar(80) NOT NULL UNIQUE,
  signed_by varchar(160) NOT NULL,
  dispatched_qty numeric(18,3) NOT NULL CHECK (dispatched_qty > 0),
  receipt_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_products_code ON products(code);
CREATE INDEX IF NOT EXISTS ix_suppliers_supply_category ON suppliers(supply_category);
CREATE INDEX IF NOT EXISTS ix_customers_segment_type ON customers(segment_type);
CREATE INDEX IF NOT EXISTS ix_production_batches_product_id ON production_batches(product_id);
CREATE INDEX IF NOT EXISTS ix_production_batches_status_product ON production_batches(curing_status, product_id);
CREATE INDEX IF NOT EXISTS ix_inventory_supplier_id ON inventory(supplier_id);
CREATE INDEX IF NOT EXISTS ix_inventory_product_id ON inventory(product_id);
CREATE INDEX IF NOT EXISTS ix_inventory_item_name ON inventory(item_name);
CREATE INDEX IF NOT EXISTS ix_inventory_transactions_inventory_id ON inventory_transactions(inventory_id);
CREATE INDEX IF NOT EXISTS ix_inventory_transactions_batch_id ON inventory_transactions(production_batch_id);
CREATE INDEX IF NOT EXISTS ix_inventory_transactions_timestamp ON inventory_transactions("timestamp");
CREATE INDEX IF NOT EXISTS ix_sales_product_id ON sales(product_id);
CREATE INDEX IF NOT EXISTS ix_sales_customer_id ON sales(customer_id);
CREATE INDEX IF NOT EXISTS ix_sales_status ON sales(status);
CREATE INDEX IF NOT EXISTS ix_expenses_supplier_id ON expenses(supplier_id);
CREATE INDEX IF NOT EXISTS ix_expenses_category ON expenses(expense_category);
CREATE INDEX IF NOT EXISTS ix_quality_tests_production_batch_id ON quality_tests(production_batch_id);
CREATE INDEX IF NOT EXISTS ix_quality_tests_product_id ON quality_tests(product_id);
CREATE INDEX IF NOT EXISTS ix_quality_tests_approval_state ON quality_tests(approval_state);
CREATE INDEX IF NOT EXISTS ix_competitor_records_profile_layer ON competitor_records(profile_layer);
CREATE INDEX IF NOT EXISTS ix_competitor_records_product_profile_code ON competitor_records(product_profile_code);
CREATE INDEX IF NOT EXISTS ix_fulfillment_receipts_sale_id ON fulfillment_receipts(sale_id);
CREATE INDEX IF NOT EXISTS ix_fulfillment_receipts_inventory_id ON fulfillment_receipts(inventory_id);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ DECLARE table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'products',
    'suppliers',
    'customers',
    'production_batches',
    'inventory',
    'sales',
    'expenses',
    'quality_tests',
    'competitor_records'
  ]
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%I_updated_at ON %I', table_name, table_name);
    EXECUTE format(
      'CREATE TRIGGER trg_%I_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION set_updated_at()',
      table_name,
      table_name
    );
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION block_fulfillment_receipt_mutation()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'fulfillment_receipts are immutable and cannot be updated or deleted';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_fulfillment_receipts_immutable_update ON fulfillment_receipts;
CREATE TRIGGER trg_fulfillment_receipts_immutable_update
BEFORE UPDATE ON fulfillment_receipts
FOR EACH ROW EXECUTE FUNCTION block_fulfillment_receipt_mutation();

DROP TRIGGER IF EXISTS trg_fulfillment_receipts_immutable_delete ON fulfillment_receipts;
CREATE TRIGGER trg_fulfillment_receipts_immutable_delete
BEFORE DELETE ON fulfillment_receipts
FOR EACH ROW EXECUTE FUNCTION block_fulfillment_receipt_mutation();

