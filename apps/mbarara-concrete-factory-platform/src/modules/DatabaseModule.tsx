import { DataTable } from "../components/common/DataTable";
import { Panel } from "../components/common/Panel";

const tables = [
  ["products", "Master product portfolio, pricing, mix ratios, and confidence labels."],
  ["suppliers", "Cement, quarry, diesel, water, spares, and logistics supplier master data."],
  ["customers", "Customer demand, type, buying power, payment reliability, and target products."],
  ["production_batches", "Daily production records with material consumption, machine hours, rejects, and curing."],
  ["inventory", "Current stock master data, reorder levels, unit costs, and daily consumption."],
  ["inventory_transactions", "Add-stock and issue-to-production records linked to suppliers and batches."],
  ["sales", "Customer invoices, product quantities, unit prices, delivery cost, paid amount, and balance."],
  ["expenses", "Payroll, utilities, maintenance, security, transport, and other operating costs."],
  ["quality_tests", "Batch-linked lab results for strength, absorption, density, dimensions, defects, and approval."],
  ["competitor_records", "Future market-intelligence extension for competitors and verification metadata."],
  ["users", "Owner, admin, manager, staff, and viewer accounts for protected ERP access."],
  ["audit_logs", "Immutable security and operational activity trail for accountability."],
];

const relationships = [
  ["sales.product_id", "products.product_id"],
  ["sales.customer_id", "customers.customer_id"],
  ["production_batches.product_id", "products.product_id"],
  ["quality_tests.production_batch_id", "production_batches.production_batch_id"],
  ["quality_tests.product_id", "products.product_id"],
  ["inventory.supplier_id", "suppliers.supplier_id"],
  ["inventory_transactions.inventory_id", "inventory.inventory_id"],
  ["inventory_transactions.production_batch_id", "production_batches.production_batch_id"],
  ["expenses.supplier_id", "suppliers.supplier_id"],
  ["audit_logs.actor_user_id", "users.id"],
];

export function DatabaseModule() {
  return (
    <>
      <Panel title="PostgreSQL Database Structure">
        <p className="mb-4 text-sm leading-6 text-slate-700">
          The SQL schema is included in the project at <span className="font-semibold text-factory-navy">src/db/postgres-schema.sql</span>. It uses UUID primary
          keys, UGX-only monetary fields, confidence enums, foreign keys, and indexes for ERP reporting.
        </p>
        <DataTable headers={["Table", "Purpose"]} rows={tables} />
      </Panel>

      <Panel title="ERP Integration Relationships">
        <DataTable headers={["From", "To"]} rows={relationships} />
      </Panel>

      <Panel title="Future Integration Notes">
        <div className="grid gap-3 text-sm leading-6 text-slate-700 xl:grid-cols-3">
          <p className="rounded-md bg-slate-50 p-3">
            Local storage state uses stable IDs that map cleanly to PostgreSQL primary keys during migration.
          </p>
          <p className="rounded-md bg-slate-50 p-3">
            Market intelligence is separated from core ERP tables so unverified data can be governed differently from accounting records.
          </p>
          <p className="rounded-md bg-slate-50 p-3">
            Quality tests are linked to production batches, allowing every saleable batch to carry certificate and approval history.
          </p>
        </div>
      </Panel>
    </>
  );
}
