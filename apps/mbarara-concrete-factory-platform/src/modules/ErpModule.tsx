import { useState, type Dispatch, type FormEvent, type SetStateAction } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartCard } from "../components/common/ChartCard";
import { DataTable } from "../components/common/DataTable";
import { SelectInput, TextInput } from "../components/common/FormControls";
import { MetricCard } from "../components/common/MetricCard";
import { Panel } from "../components/common/Panel";
import type { AppState, Expense, Sale } from "../types";
import type { ErpComputed } from "../lib/calculations";
import { formatUGX, numberFormat, productName, supplierName } from "../lib/calculations";

export function ErpModule({
  state,
  setState,
  erp,
}: {
  state: AppState;
  setState: Dispatch<SetStateAction<AppState>>;
  erp: ErpComputed;
}) {
  const [saleForm, setSaleForm] = useState({
    date: "2026-06-06",
    customerId: state.customers[0]?.id ?? "",
    productId: state.products[0]?.id ?? "",
    quantity: "",
    unitPriceUgx: String(state.products[0]?.plannedPriceUgx ?? 0),
    deliveryCostUgx: "",
    paidAmountUgx: "",
  });
  const [expenseForm, setExpenseForm] = useState({
    date: "2026-06-06",
    category: "Utilities" as Expense["category"],
    description: "",
    supplierId: state.suppliers[0]?.id ?? "",
    amountUgx: "",
    paidAmountUgx: "",
  });

  function selectProduct(productId: string) {
    const product = state.products.find((row) => row.id === productId);
    setSaleForm({ ...saleForm, productId, unitPriceUgx: String(product?.plannedPriceUgx ?? 0) });
  }

  function saveSale(event: FormEvent) {
    event.preventDefault();
    const row: Sale = {
      id: `sale-${Date.now()}`,
      date: saleForm.date,
      customerId: saleForm.customerId,
      productId: saleForm.productId,
      quantity: Number(saleForm.quantity) || 0,
      unitPriceUgx: Number(saleForm.unitPriceUgx) || 0,
      deliveryCostUgx: Number(saleForm.deliveryCostUgx) || 0,
      paidAmountUgx: Number(saleForm.paidAmountUgx) || 0,
    };
    if (!row.quantity) return;
    setState((current) => ({ ...current, sales: [row, ...current.sales] }));
    setSaleForm((current) => ({ ...current, quantity: "", deliveryCostUgx: "", paidAmountUgx: "" }));
  }

  function saveExpense(event: FormEvent) {
    event.preventDefault();
    const row: Expense = {
      id: `exp-${Date.now()}`,
      date: expenseForm.date,
      category: expenseForm.category,
      description: expenseForm.description || "Expense record",
      supplierId: expenseForm.supplierId,
      amountUgx: Number(expenseForm.amountUgx) || 0,
      paidAmountUgx: Number(expenseForm.paidAmountUgx) || 0,
    };
    if (!row.amountUgx) return;
    setState((current) => ({ ...current, expenses: [row, ...current.expenses] }));
    setExpenseForm((current) => ({ ...current, description: "", amountUgx: "", paidAmountUgx: "" }));
  }

  const inventoryUsage = erp.inventory.map((item) => ({ name: item.name, value: item.issued * item.unitCostUgx, quantity: item.issued }));

  return (
    <>
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Daily sales records" value={String(state.sales.length)} tone="navy" />
        <MetricCard label="Monthly profit" value={formatUGX(erp.financials.netProfitUgx, true)} tone={erp.financials.targetReached ? "green" : "amber"} />
        <MetricCard label="Inventory usage value" value={formatUGX(inventoryUsage.reduce((sum, row) => sum + row.value, 0), true)} tone="blue" />
        <MetricCard label="QC pass rate" value={`${state.qualityTests.length ? ((erp.quality.passed / state.qualityTests.length) * 100).toFixed(1) : "0.0"}%`} tone="green" />
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <Panel title="Sales Module">
          <form onSubmit={saveSale} className="grid gap-3 md:grid-cols-2">
            <TextInput label="Date" type="date" value={saleForm.date} onChange={(value) => setSaleForm({ ...saleForm, date: value })} />
            <SelectInput label="Customer name" value={saleForm.customerId} onChange={(value) => setSaleForm({ ...saleForm, customerId: value })} options={state.customers.map((customer) => ({ value: customer.id, label: customer.name }))} />
            <SelectInput label="Product" value={saleForm.productId} onChange={selectProduct} options={state.products.map((product) => ({ value: product.id, label: product.name }))} />
            <TextInput label="Quantity" value={saleForm.quantity} onChange={(value) => setSaleForm({ ...saleForm, quantity: value })} />
            <TextInput label="Unit price" value={saleForm.unitPriceUgx} onChange={(value) => setSaleForm({ ...saleForm, unitPriceUgx: value })} suffix="UGX" />
            <TextInput label="Delivery cost" value={saleForm.deliveryCostUgx} onChange={(value) => setSaleForm({ ...saleForm, deliveryCostUgx: value })} suffix="UGX" />
            <TextInput label="Paid amount" value={saleForm.paidAmountUgx} onChange={(value) => setSaleForm({ ...saleForm, paidAmountUgx: value })} suffix="UGX" />
            <button type="submit" className="h-fit self-end rounded-md bg-factory-navy px-4 py-2 text-sm font-semibold text-white hover:bg-[#102638]">
              Save sale
            </button>
          </form>
        </Panel>

        <Panel title="Expenses Module">
          <form onSubmit={saveExpense} className="grid gap-3 md:grid-cols-2">
            <TextInput label="Date" type="date" value={expenseForm.date} onChange={(value) => setExpenseForm({ ...expenseForm, date: value })} />
            <SelectInput
              label="Category"
              value={expenseForm.category}
              onChange={(value) => setExpenseForm({ ...expenseForm, category: value as Expense["category"] })}
              options={["Payroll", "Utilities", "Maintenance", "Security", "Rent", "Office", "Transport", "Other"].map((value) => ({ value, label: value }))}
            />
            <TextInput label="Description" value={expenseForm.description} onChange={(value) => setExpenseForm({ ...expenseForm, description: value })} />
            <SelectInput label="Supplier / payee" value={expenseForm.supplierId} onChange={(value) => setExpenseForm({ ...expenseForm, supplierId: value })} options={state.suppliers.map((supplier) => ({ value: supplier.id, label: supplier.name }))} />
            <TextInput label="Amount" value={expenseForm.amountUgx} onChange={(value) => setExpenseForm({ ...expenseForm, amountUgx: value })} suffix="UGX" />
            <TextInput label="Paid amount" value={expenseForm.paidAmountUgx} onChange={(value) => setExpenseForm({ ...expenseForm, paidAmountUgx: value })} suffix="UGX" />
            <button type="submit" className="h-fit self-end rounded-md bg-factory-navy px-4 py-2 text-sm font-semibold text-white hover:bg-[#102638]">
              Save expense
            </button>
          </form>
        </Panel>
      </section>

      <section className="grid gap-5 2xl:grid-cols-2">
        <ChartCard title="Daily Sales">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={erp.financials.salesRows} margin={{ top: 14, right: 16, left: 0, bottom: 58 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d8dee4" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(value) => `${Math.round(Number(value) / 1_000_000)}m`} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(value) => formatUGX(Number(value))} />
              <Bar dataKey="total" name="Sales total" fill="#3b6ea8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Inventory Usage">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={inventoryUsage} margin={{ top: 14, right: 16, left: 0, bottom: 58 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d8dee4" />
              <XAxis dataKey="name" angle={-28} textAnchor="end" interval={0} height={78} tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(value) => `${Math.round(Number(value) / 1_000_000)}m`} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(value, name) => (name === "quantity" ? numberFormat(Number(value)) : formatUGX(Number(value)))} />
              <Bar dataKey="value" name="Usage value" fill="#b7842f" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Production Efficiency">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={erp.productionEfficiency} margin={{ top: 14, right: 16, left: 0, bottom: 12 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d8dee4" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="efficiency" name="Units per hour" fill="#2f7d5b" />
              <Bar dataKey="rejected" name="Rejected" fill="#a44a3f" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <Panel title="Customer and Supplier Balances">
          <div className="grid gap-4 xl:grid-cols-2">
            <DataTable headers={["Customer", "Balance"]} rows={erp.customerBalances.map((row) => [row.name, formatUGX(row.balance)])} />
            <DataTable headers={["Supplier", "Balance"]} rows={erp.supplierBalances.map((row) => [row.name, formatUGX(row.balance)])} />
          </div>
        </Panel>
      </section>

      <Panel title="Sales Register">
        <DataTable
          headers={["Date", "Customer", "Product", "Quantity", "Unit price", "Delivery", "Paid", "Balance"]}
          rows={erp.financials.salesRows.map((sale) => [
            sale.date,
            sale.customerName,
            sale.productName,
            numberFormat(sale.quantity),
            formatUGX(sale.unitPriceUgx),
            formatUGX(sale.deliveryCostUgx),
            formatUGX(sale.paidAmountUgx),
            formatUGX(sale.balance),
          ])}
        />
      </Panel>

      <Panel title="Expense Register">
        <DataTable
          headers={["Date", "Category", "Description", "Supplier", "Amount", "Paid", "Balance"]}
          rows={erp.expenses.map((expense) => [
            expense.date,
            expense.category,
            expense.description,
            supplierName(state, expense.supplierId),
            formatUGX(expense.amountUgx),
            formatUGX(expense.paidAmountUgx),
            formatUGX(expense.balance),
          ])}
        />
      </Panel>

      <Panel title="Connected Production and QC Summary">
        <DataTable
          headers={["Batch", "Product", "Produced", "Rejected", "QC status", "Strength"]}
          rows={erp.production.map((batch) => [
            batch.batchId,
            productName(state, batch.productId),
            numberFormat(batch.quantityProduced),
            numberFormat(batch.rejectedProducts),
            batch.qcStatus,
            batch.compressiveStrengthMpa ? `${numberFormat(batch.compressiveStrengthMpa)} MPa` : "Pending",
          ])}
        />
      </Panel>
    </>
  );
}
