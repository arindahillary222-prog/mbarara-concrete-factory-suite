import { useState, type Dispatch, type FormEvent, type SetStateAction } from "react";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartCard } from "../components/common/ChartCard";
import { DataTable } from "../components/common/DataTable";
import { SelectInput, TextInput } from "../components/common/FormControls";
import { MetricCard } from "../components/common/MetricCard";
import { Panel } from "../components/common/Panel";
import { Tag } from "../components/common/Tag";
import type { AppState, ProductionBatch } from "../types";
import type { ErpComputed } from "../lib/calculations";
import { numberFormat } from "../lib/calculations";

export function ProductionModule({
  state,
  setState,
  erp,
}: {
  state: AppState;
  setState: Dispatch<SetStateAction<AppState>>;
  erp: ErpComputed;
}) {
  const [form, setForm] = useState({
    batchId: `BATCH-2026-${String(state.productionBatches.length + 1).padStart(3, "0")}`,
    date: "2026-06-06",
    productId: state.products[0]?.id ?? "",
    operator: "",
    quantityProduced: "",
    rejectedProducts: "",
    cementBagsUsed: "",
    stoneDustTonnesUsed: "",
    sandTonnesUsed: "",
    aggregateTonnesUsed: "",
    waterM3Used: "",
    machineHours: "",
    curingStartDate: "2026-06-06",
  });

  const selectedProduct = state.products.find((product) => product.id === form.productId);

  function saveBatch(event: FormEvent) {
    event.preventDefault();
    const row: ProductionBatch = {
      id: `pb-${Date.now()}`,
      batchId: form.batchId,
      date: form.date,
      productId: form.productId,
      operator: form.operator || "Factory operator",
      quantityProduced: Number(form.quantityProduced) || 0,
      rejectedProducts: Number(form.rejectedProducts) || 0,
      cementBagsUsed: Number(form.cementBagsUsed) || 0,
      stoneDustTonnesUsed: Number(form.stoneDustTonnesUsed) || 0,
      sandTonnesUsed: Number(form.sandTonnesUsed) || 0,
      aggregateTonnesUsed: Number(form.aggregateTonnesUsed) || 0,
      waterM3Used: Number(form.waterM3Used) || 0,
      machineHours: Number(form.machineHours) || 0,
      mixRatio: selectedProduct?.mixRatio ?? "Needs verification",
      curingStartDate: form.curingStartDate,
    };
    if (!row.quantityProduced) return;
    setState((current) => ({
      ...current,
      productionBatches: [row, ...current.productionBatches],
    }));
    setForm((current) => ({
      ...current,
      batchId: `BATCH-2026-${String(state.productionBatches.length + 2).padStart(3, "0")}`,
      quantityProduced: "",
      rejectedProducts: "",
      cementBagsUsed: "",
      stoneDustTonnesUsed: "",
      sandTonnesUsed: "",
      aggregateTonnesUsed: "",
      waterM3Used: "",
      machineHours: "",
    }));
  }

  return (
    <>
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total produced" value={numberFormat(erp.totalProduced)} tone="navy" />
        <MetricCard label="Rejected products" value={numberFormat(erp.rejectedProducts)} tone="clay" />
        <MetricCard label="Reject rate" value={`${(erp.rejectRate * 100).toFixed(1)}%`} tone={erp.rejectRate > 0.04 ? "amber" : "green"} />
        <MetricCard label="Production batches" value={String(state.productionBatches.length)} tone="blue" />
      </section>

      <Panel title="Record Production Batch">
        <form onSubmit={saveBatch} className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <TextInput label="Batch ID" value={form.batchId} onChange={(value) => setForm({ ...form, batchId: value })} />
          <TextInput label="Date" type="date" value={form.date} onChange={(value) => setForm({ ...form, date: value })} />
          <SelectInput
            label="Product type"
            value={form.productId}
            onChange={(value) => setForm({ ...form, productId: value })}
            options={state.products.map((product) => ({ value: product.id, label: product.name }))}
          />
          <TextInput label="Operator" value={form.operator} onChange={(value) => setForm({ ...form, operator: value })} />
          <TextInput label="Daily production" value={form.quantityProduced} onChange={(value) => setForm({ ...form, quantityProduced: value })} />
          <TextInput label="Rejected products" value={form.rejectedProducts} onChange={(value) => setForm({ ...form, rejectedProducts: value })} />
          <TextInput label="Machine hours" value={form.machineHours} onChange={(value) => setForm({ ...form, machineHours: value })} />
          <TextInput label="Curing start date" type="date" value={form.curingStartDate} onChange={(value) => setForm({ ...form, curingStartDate: value })} />
          <TextInput label="Cement bags" value={form.cementBagsUsed} onChange={(value) => setForm({ ...form, cementBagsUsed: value })} />
          <TextInput label="Stone dust tonnes" value={form.stoneDustTonnesUsed} onChange={(value) => setForm({ ...form, stoneDustTonnesUsed: value })} />
          <TextInput label="Sand tonnes" value={form.sandTonnesUsed} onChange={(value) => setForm({ ...form, sandTonnesUsed: value })} />
          <TextInput label="Aggregate tonnes" value={form.aggregateTonnesUsed} onChange={(value) => setForm({ ...form, aggregateTonnesUsed: value })} />
          <TextInput label="Water m3" value={form.waterM3Used} onChange={(value) => setForm({ ...form, waterM3Used: value })} />
          <div className="self-end rounded-md bg-slate-100 px-3 py-2 text-sm text-slate-700 xl:col-span-2">
            Mix ratio: <span className="font-semibold text-factory-navy">{selectedProduct?.mixRatio ?? "Needs verification"}</span>
          </div>
          <button type="submit" className="h-fit self-end rounded-md bg-factory-navy px-4 py-2 text-sm font-semibold text-white hover:bg-[#102638]">
            Save production batch
          </button>
        </form>
      </Panel>

      <section className="grid gap-5 2xl:grid-cols-2">
        <ChartCard title="Production Efficiency">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={erp.productionEfficiency} margin={{ top: 14, right: 16, left: 0, bottom: 12 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d8dee4" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="efficiency" name="Units per machine hour" stroke="#2f7d5b" strokeWidth={2} />
              <Line type="monotone" dataKey="rejected" name="Rejected products" stroke="#a44a3f" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Material Consumption by Batch">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={state.productionBatches} margin={{ top: 14, right: 16, left: 0, bottom: 12 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d8dee4" />
              <XAxis dataKey="batchId" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="cementBagsUsed" name="Cement bags" fill="#17324d" />
              <Bar dataKey="stoneDustTonnesUsed" name="Stone dust tonnes" fill="#b7842f" />
              <Bar dataKey="sandTonnesUsed" name="Sand tonnes" fill="#3b6ea8" />
              <Bar dataKey="aggregateTonnesUsed" name="Aggregate tonnes" fill="#2f7d5b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>

      <Panel title="Production Batch Register with QC Link">
        <DataTable
          headers={["Batch", "Date", "Product", "Operator", "Produced", "Rejected", "Efficiency", "Mix ratio", "QC status"]}
          rows={erp.production.map((batch) => [
            batch.batchId,
            batch.date,
            batch.productName,
            batch.operator,
            numberFormat(batch.quantityProduced),
            numberFormat(batch.rejectedProducts),
            `${numberFormat(batch.efficiency)} units/hr`,
            batch.mixRatio,
            batch.qcStatus === "Passed" ? <Tag tone="green">Passed</Tag> : batch.qcStatus === "Failed" ? <Tag tone="clay">Failed</Tag> : <Tag tone="amber">Hold</Tag>,
          ])}
        />
      </Panel>
    </>
  );
}
