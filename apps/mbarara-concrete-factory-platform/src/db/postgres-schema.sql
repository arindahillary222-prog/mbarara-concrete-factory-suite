-- Mbarara Integrated Concrete Products Factory
-- PostgreSQL schema designed for future ERP integration.
-- Currency fields are UGX-only and stored as numeric(18,2).

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE confidence_level AS ENUM ('Verified', 'Estimated', 'Quotation Required', 'Needs verification');
CREATE TYPE verification_status AS ENUM ('Verified', 'Pending', 'Needs field check');
CREATE TYPE approval_status AS ENUM ('Passed', 'Failed', 'Hold');
CREATE TYPE inventory_transaction_type AS ENUM ('add', 'issue');

CREATE TABLE products (
  product_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_code text UNIQUE NOT NULL,
  product_name text NOT NULL,
  category text NOT NULL CHECK (category IN ('blocks', 'pavers', 'precast', 'ready-mix')),
  unit text NOT NULL CHECK (unit IN ('piece', 'linear metre', 'm3')),
  planned_price_ugx numeric(18,2) NOT NULL CHECK (planned_price_ugx >= 0),
  target_daily_volume numeric(18,3) NOT NULL DEFAULT 0,
  mix_ratio text NOT NULL,
  data_confidence confidence_level NOT NULL DEFAULT 'Estimated',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE suppliers (
  supplier_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_code text UNIQUE NOT NULL,
  supplier_name text NOT NULL,
  category text NOT NULL,
  district text NOT NULL,
  phone text,
  opening_balance_ugx numeric(18,2) NOT NULL DEFAULT 0,
  data_confidence confidence_level NOT NULL DEFAULT 'Needs verification',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE customers (
  customer_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_code text UNIQUE NOT NULL,
  customer_name text NOT NULL,
  customer_type text NOT NULL,
  location text NOT NULL,
  likely_products_needed jsonb NOT NULL DEFAULT '[]'::jsonb,
  estimated_monthly_demand numeric(18,3) NOT NULL DEFAULT 0,
  buying_power text CHECK (buying_power IN ('low', 'medium', 'high')),
  payment_reliability text CHECK (payment_reliability IN ('low', 'medium', 'high')),
  decision_maker_contact text,
  notes text,
  data_confidence confidence_level NOT NULL DEFAULT 'Estimated',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE production_batches (
  production_batch_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_code text UNIQUE NOT NULL,
  production_date date NOT NULL,
  product_id uuid NOT NULL REFERENCES products(product_id),
  operator_name text NOT NULL,
  quantity_produced numeric(18,3) NOT NULL CHECK (quantity_produced >= 0),
  rejected_products numeric(18,3) NOT NULL DEFAULT 0 CHECK (rejected_products >= 0),
  cement_bags_used numeric(18,3) NOT NULL DEFAULT 0,
  stone_dust_tonnes_used numeric(18,3) NOT NULL DEFAULT 0,
  sand_tonnes_used numeric(18,3) NOT NULL DEFAULT 0,
  aggregate_tonnes_used numeric(18,3) NOT NULL DEFAULT 0,
  water_m3_used numeric(18,3) NOT NULL DEFAULT 0,
  machine_hours numeric(18,3) NOT NULL DEFAULT 0,
  mix_ratio text NOT NULL,
  curing_start_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE inventory (
  inventory_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_code text UNIQUE NOT NULL,
  item_name text NOT NULL,
  unit text NOT NULL,
  supplier_id uuid REFERENCES suppliers(supplier_id),
  opening_qty numeric(18,3) NOT NULL DEFAULT 0,
  current_qty numeric(18,3) NOT NULL DEFAULT 0,
  unit_cost_ugx numeric(18,2) NOT NULL DEFAULT 0,
  reorder_level numeric(18,3) NOT NULL DEFAULT 0,
  daily_consumption numeric(18,3) NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE inventory_transactions (
  inventory_transaction_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_date date NOT NULL,
  inventory_id uuid NOT NULL REFERENCES inventory(inventory_id),
  transaction_type inventory_transaction_type NOT NULL,
  quantity numeric(18,3) NOT NULL CHECK (quantity > 0),
  supplier_id uuid REFERENCES suppliers(supplier_id),
  production_batch_id uuid REFERENCES production_batches(production_batch_id),
  delivery_truck_number text,
  cost_ugx numeric(18,2) DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE sales (
  sale_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_number text UNIQUE NOT NULL,
  sale_date date NOT NULL,
  customer_id uuid NOT NULL REFERENCES customers(customer_id),
  product_id uuid NOT NULL REFERENCES products(product_id),
  quantity numeric(18,3) NOT NULL CHECK (quantity > 0),
  unit_price_ugx numeric(18,2) NOT NULL CHECK (unit_price_ugx >= 0),
  delivery_cost_ugx numeric(18,2) NOT NULL DEFAULT 0,
  paid_amount_ugx numeric(18,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE expenses (
  expense_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_date date NOT NULL,
  category text NOT NULL,
  description text NOT NULL,
  supplier_id uuid REFERENCES suppliers(supplier_id),
  amount_ugx numeric(18,2) NOT NULL CHECK (amount_ugx >= 0),
  paid_amount_ugx numeric(18,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE quality_tests (
  quality_test_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_number text UNIQUE NOT NULL,
  production_batch_id uuid NOT NULL REFERENCES production_batches(production_batch_id),
  test_date date NOT NULL,
  product_id uuid NOT NULL REFERENCES products(product_id),
  compressive_strength_mpa numeric(18,3) NOT NULL DEFAULT 0,
  water_absorption_pct numeric(18,3) NOT NULL DEFAULT 0,
  density_kg_m3 numeric(18,3) NOT NULL DEFAULT 0,
  dimension_status text NOT NULL CHECK (dimension_status IN ('Pass', 'Fail')),
  visual_defects numeric(18,3) NOT NULL DEFAULT 0,
  approval_status approval_status NOT NULL DEFAULT 'Hold',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Market intelligence extension tables are intentionally separated so the core ERP can operate without them.
CREATE TABLE competitor_records (
  competitor_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_code text UNIQUE NOT NULL,
  competitor_name text NOT NULL,
  location text NOT NULL,
  district text NOT NULL,
  region text NOT NULL,
  gps_coordinates text,
  business_type text NOT NULL,
  products_offered jsonb NOT NULL DEFAULT '[]'::jsonb,
  estimated_product_prices jsonb NOT NULL DEFAULT '{}'::jsonb,
  estimated_production_capacity text,
  machine_type text,
  delivery_radius_km numeric(18,2),
  phone_contact text,
  website_social_link text,
  strengths text,
  weaknesses text,
  threat_level text NOT NULL CHECK (threat_level IN ('low', 'medium', 'high')),
  notes text,
  last_updated_date date NOT NULL DEFAULT current_date,
  source_url text,
  source_type text,
  confidence_level confidence_level NOT NULL DEFAULT 'Needs verification',
  verification_status verification_status NOT NULL DEFAULT 'Needs field check',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_sales_customer_date ON sales(customer_id, sale_date);
CREATE INDEX idx_sales_product_date ON sales(product_id, sale_date);
CREATE INDEX idx_inventory_transactions_item_date ON inventory_transactions(inventory_id, transaction_date);
CREATE INDEX idx_quality_tests_batch ON quality_tests(production_batch_id);
CREATE INDEX idx_production_batches_product_date ON production_batches(product_id, production_date);
