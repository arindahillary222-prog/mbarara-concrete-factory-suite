import { useState, type Dispatch, type FormEvent, type SetStateAction } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartCard } from "../components/common/ChartCard";
import { DataTable } from "../components/common/DataTable";
import { SelectInput, TextInput } from "../components/common/FormControls";
import { MetricCard } from "../components/common/MetricCard";
import { Panel } from "../components/common/Panel";
import { Tag } from "../components/common/Tag";
import type { AppState, InventoryTransaction } from "../types";
import type { ErpComputed } from "../lib/calculations";
import { formatUGX, numberFormat, supplierName } from "../lib/calculations";

export function InventoryModule({
  state,
  setState,
  erp,
}: {
  state: AppState;
  setState: Dispatch<SetStateAction<AppState>>;
  erp: ErpComputed;
}) {
  const [form, setForm] = useState({
    date: "2026-06-06",
    itemId: state.inventoryItems[0]?.id ?? "",
    type: "add" as InventoryTransaction["type"],
    quantity: "",
    supplierId: state.suppliers[0]?.id ?? "",
    batchId: state.productionBatches[0]?.batchId ?? "",
    deliveryTruckNumber: "",
    costUgx: "",
    notes: "",
  });

  function saveTransaction(event: FormEvent) {
    event.preventDefault();
    const row: InventoryTransaction = {
      id: `trx-${Date.now()}`,
      date: form.date,
      itemId: form.itemId,
      type: form.type,
      quantity: Number(form.quantity) || 0,
      supplierId: form.type === "add" ? form.supplierId : undefined,
      batchId: form.type === "issue" ? form.batchId : undefined,
      deliveryTruckNumber: form.deliveryTruckNumber || undefined,
      costUgx: Number(form.costUgx) || undefined,
      notes: form.notes || "Local record",
    };
    if (!row.quantity) return;
    setState((current) => ({
      ...current,
      inventoryTransactions: [row, ...current.inventoryTransactions],
    }));
    setForm((current) => ({ ...current, quantity: "", costUgx: "", notes: "", deliveryTruckNumber: "" }));
  }

  const stockValue = erp.inventory.reduce((sum, row) => sum + row.stockValueUgx, 0);
  const dailyConsumption = erp.inventory.reduce((sum, row) => sum + row.dailyConsumption * row.unitCostUgx, 0);
  const lowStock = erp.inventory.filter((row) => row.lowStock).length;
  const topConsumed = [...erp.inventory].sort((a, b) => b.issued - a.issued).slice(0, 6);

  return (
    <>
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Current stock value" value={formatUGX(stockValue, true)} tone="navy" />
        <MetricCard label="Daily consumption value" value={formatUGX(dailyConsumption, true)} tone="blue" />
        <MetricCard label="Low-stock alerts" value={String(lowStock)} tone={lowStock ? "clay" : "green"} />
        <MetricCard label="Tracked materials" value={String(erp.inventory.length)} tone="green" />
      </section>

      <Panel title="Add Stock or Issue Stock to Production">
        <form onSubmit={saveTransaction} className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <TextInput label="Date" type="date" value={form.date} onChange={(value) => setForm({ ...form, date: value })} />
          <SelectInput
            label="Inventory item"
            value={form.itemId}
            onChange={(value) => setForm({ ...form, itemId: value })}
            options={state.inventoryItems.map((item) => ({ value: item.id, label: `${item.name} (${item.unit})` }))}
          />
          <SelectInput
            label="Transaction type"
            value={form.type}
            onChange={(value) => setForm({ ...form, type: value as InventoryTransaction["type"] })}
            options={[
              { value: "add", label: "Add stock" },
              { value: "issue", label: "Issue to production" },
            ]}
          />
          <TextInput label="Quantity" value={form.quantity} onChange={(value) => setForm({ ...form, quantity: value })} />
          <SelectInput
            label="Supplier"
            value={form.supplierId}
            onChange={(value) => setForm({ ...form, supplierId: value })}
            options={state.suppliers.map((supplier) => ({ value: supplier.id, label: supplier.name }))}
          />
          <SelectInput
            label="Production batch"
            value={form.batchId}
            onChange={(value) => setForm({ ...form, batchId: value })}
            options={state.productionBatches.map((batch) => ({ value: batch.batchId, label: batch.batchId }))}
          />
          <TextInput label="Delivery truck number" value={form.deliveryTruckNumber} onChange={(value) => setForm({ ...form, deliveryTruckNumber: value })} />
          <TextInput label="Cost per delivery" value={form.costUgx} onChange={(value) => setForm({ ...form, costUgx: value })} suffix="UGX" />
          <div className="xl:col-span-3">
            <TextInput label="Notes" value={form.notes} onChange={(value) => setForm({ ...form, notes: value })} />
          </div>
          <button type="submit" className="h-fit self-end rounded-md bg-factory-navy px-4 py-2 text-sm font-semibold text-white hover:bg-[#102638]">
            Save inventory record
          </button>
        </form>
      </Panel>

      <section className="grid gap-5 2xl:grid-cols-2">
        <ChartCard title="Top Consumed Materials">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topConsumed} margin={{ top: 14, right: 16, left: 0, bottom: 58 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d8dee4" />
              <XAxis dataKey="name" angle={-28} textAnchor="end" interval={0} height={78} tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="issued" name="Issued" fill="#2f7d5b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Days of Stock Remaining">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={erp.inventory} margin={{ top: 14, right: 16, left: 0, bottom: 58 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d8dee4" />
              <XAxis dataKey="name" angle={-28} textAnchor="end" interval={0} height={78} tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(value) => `${numberFormat(Number(value))} days`} />
              <Bar dataKey="daysRemaining" name="Days remaining" fill="#b7842f" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>

      <Panel title="Current Inventory Dashboard">
        <DataTable
          headers={["Item", "Current inventory", "Stock value", "Daily consumption", "Days remaining", "Reorder level", "Supplier", "Status"]}
          rows={erp.inventory.map((item) => [
            item.name,
            `${numberFormat(item.currentQty)} ${item.unit}`,
            formatUGX(item.stockValueUgx),
            `${numberFormat(item.dailyConsumption)} ${item.unit}`,
            item.daysRemaining > 900 ? "Non-consumable" : `${numberFormat(item.daysRemaining)} days`,
            `${numberFormat(item.reorderLevel)} ${item.unit}`,
            supplierName(state, item.supplierId),
            item.lowStock ? <Tag tone="clay">Low stock</Tag> : <Tag tone="green">OK</Tag>,
          ])}
        />
      </Panel>

      <Panel title="Monthly Usage Report">
        <DataTable
          headers={["Date", "Type", "Item", "Quantity", "Supplier", "Truck", "Batch", "Cost", "Notes"]}
          rows={state.inventoryTransactions.map((transaction) => {
            const item = state.inventoryItems.find((row) => row.id === transaction.itemId);
            return [
              transaction.date,
              transaction.type,
              item?.name ?? transaction.itemId,
              `${numberFormat(transaction.quantity)} ${item?.unit ?? ""}`,
              supplierName(state, transaction.supplierId),
              transaction.deliveryTruckNumber ?? "-",
              transaction.batchId ?? "-",
              formatUGX(transaction.costUgx ?? 0),
              transaction.notes,
            ];
          })}
        />
      </Panel>
    </>
  );
}
