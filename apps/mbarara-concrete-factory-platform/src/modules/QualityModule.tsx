import { useState, type Dispatch, type FormEvent, type SetStateAction } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartCard } from "../components/common/ChartCard";
import { DataTable } from "../components/common/DataTable";
import { SelectInput, TextInput } from "../components/common/FormControls";
import { MetricCard } from "../components/common/MetricCard";
import { Panel } from "../components/common/Panel";
import { Tag } from "../components/common/Tag";
import type { AppState, QualityTest } from "../types";
import type { ErpComputed } from "../lib/calculations";
import { numberFormat, productName } from "../lib/calculations";

export function QualityModule({
  state,
  setState,
  erp,
}: {
  state: AppState;
  setState: Dispatch<SetStateAction<AppState>>;
  erp: ErpComputed;
}) {
  const [form, setForm] = useState({
    batchId: state.productionBatches[0]?.batchId ?? "",
    date: "2026-06-06",
    productId: state.productionBatches[0]?.productId ?? state.products[0]?.id ?? "",
    compressiveStrengthMpa: "",
    waterAbsorptionPct: "",
    densityKgM3: "",
    dimensionStatus: "Pass" as QualityTest["dimensionStatus"],
    visualDefects: "",
    approvalStatus: "Passed" as QualityTest["approvalStatus"],
    notes: "",
  });

  function updateBatch(batchId: string) {
    const batch = state.productionBatches.find((row) => row.batchId === batchId);
    setForm({ ...form, batchId, productId: batch?.productId ?? form.productId });
  }

  function saveTest(event: FormEvent) {
    event.preventDefault();
    const row: QualityTest = {
      id: `qt-${Date.now()}`,
      batchId: form.batchId,
      date: form.date,
      productId: form.productId,
      compressiveStrengthMpa: Number(form.compressiveStrengthMpa) || 0,
      waterAbsorptionPct: Number(form.waterAbsorptionPct) || 0,
      densityKgM3: Number(form.densityKgM3) || 0,
      dimensionStatus: form.dimensionStatus,
      visualDefects: Number(form.visualDefects) || 0,
      approvalStatus: form.approvalStatus,
      notes: form.notes || "QC record",
    };
    setState((current) => ({
      ...current,
      qualityTests: [row, ...current.qualityTests.filter((test) => test.batchId !== row.batchId)],
    }));
    setForm((current) => ({ ...current, compressiveStrengthMpa: "", waterAbsorptionPct: "", densityKgM3: "", visualDefects: "", notes: "" }));
  }

  const latestCertificate = state.qualityTests[0];
  const linkedBatch = state.productionBatches.find((batch) => batch.batchId === latestCertificate?.batchId);

  return (
    <>
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Passed batches" value={String(erp.quality.passed)} tone="green" />
        <MetricCard label="Failed batches" value={String(erp.quality.failed)} tone={erp.quality.failed ? "clay" : "green"} />
        <MetricCard label="Hold batches" value={String(erp.quality.hold)} tone="amber" />
        <MetricCard label="Rejection rate" value={`${(erp.quality.rejectionRate * 100).toFixed(1)}%`} tone={erp.quality.rejectionRate ? "clay" : "green"} />
      </section>

      <Panel title="Laboratory Test Entry">
        <form onSubmit={saveTest} className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <SelectInput
            label="Production batch"
            value={form.batchId}
            onChange={updateBatch}
            options={state.productionBatches.map((batch) => ({ value: batch.batchId, label: `${batch.batchId} - ${productName(state, batch.productId)}` }))}
          />
          <TextInput label="Test date" type="date" value={form.date} onChange={(value) => setForm({ ...form, date: value })} />
          <TextInput label="Compressive strength" value={form.compressiveStrengthMpa} onChange={(value) => setForm({ ...form, compressiveStrengthMpa: value })} suffix="MPa" />
          <TextInput label="Water absorption" value={form.waterAbsorptionPct} onChange={(value) => setForm({ ...form, waterAbsorptionPct: value })} suffix="%" />
          <TextInput label="Density" value={form.densityKgM3} onChange={(value) => setForm({ ...form, densityKgM3: value })} suffix="kg/m3" />
          <SelectInput
            label="Dimensions"
            value={form.dimensionStatus}
            onChange={(value) => setForm({ ...form, dimensionStatus: value as QualityTest["dimensionStatus"] })}
            options={[
              { value: "Pass", label: "Pass" },
              { value: "Fail", label: "Fail" },
            ]}
          />
          <TextInput label="Visual defects" value={form.visualDefects} onChange={(value) => setForm({ ...form, visualDefects: value })} />
          <SelectInput
            label="Approval status"
            value={form.approvalStatus}
            onChange={(value) => setForm({ ...form, approvalStatus: value as QualityTest["approvalStatus"] })}
            options={[
              { value: "Passed", label: "Passed" },
              { value: "Failed", label: "Failed" },
              { value: "Hold", label: "Hold" },
            ]}
          />
          <div className="xl:col-span-3">
            <TextInput label="Notes" value={form.notes} onChange={(value) => setForm({ ...form, notes: value })} />
          </div>
          <button type="submit" className="h-fit self-end rounded-md bg-factory-navy px-4 py-2 text-sm font-semibold text-white hover:bg-[#102638]">
            Save QC test
          </button>
        </form>
      </Panel>

      <section className="grid gap-5 2xl:grid-cols-2">
        <ChartCard title="Average Strength by Product">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={erp.quality.strengthByProduct} margin={{ top: 14, right: 16, left: 0, bottom: 70 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d8dee4" />
              <XAxis dataKey="name" angle={-28} textAnchor="end" interval={0} height={88} tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="strength" name="MPa" fill="#2f7d5b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Defect Trends">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={erp.quality.defectTrends} margin={{ top: 14, right: 16, left: 0, bottom: 12 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d8dee4" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="defects" name="Visual defects" stroke="#a44a3f" strokeWidth={2} />
              <Line type="monotone" dataKey="absorption" name="Water absorption %" stroke="#3b6ea8" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>

      <Panel title="QC Register">
        <DataTable
          headers={["Batch", "Date", "Product", "Strength", "Absorption", "Density", "Dimensions", "Defects", "Status", "Notes"]}
          rows={state.qualityTests.map((test) => [
            test.batchId,
            test.date,
            productName(state, test.productId),
            `${numberFormat(test.compressiveStrengthMpa)} MPa`,
            `${numberFormat(test.waterAbsorptionPct)}%`,
            `${numberFormat(test.densityKgM3)} kg/m3`,
            test.dimensionStatus,
            numberFormat(test.visualDefects),
            test.approvalStatus === "Passed" ? <Tag tone="green">Passed</Tag> : test.approvalStatus === "Failed" ? <Tag tone="clay">Failed</Tag> : <Tag tone="amber">Hold</Tag>,
            test.notes,
          ])}
        />
      </Panel>

      <Panel title="Printable Test Certificate">
        {latestCertificate ? (
          <article className="rounded-md border border-slate-300 bg-white p-5 text-sm leading-6">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-factory-green">Concrete Product Test Certificate</p>
                <h3 className="mt-1 text-lg font-semibold text-factory-navy">{latestCertificate.batchId}</h3>
              </div>
              <button type="button" onClick={() => window.print()} className="no-print rounded-md bg-factory-navy px-3 py-2 text-xs font-semibold text-white">
                Print certificate
              </button>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <p>
                <span className="font-semibold">Product:</span> {productName(state, latestCertificate.productId)}
              </p>
              <p>
                <span className="font-semibold">Production date:</span> {linkedBatch?.date ?? "Needs verification"}
              </p>
              <p>
                <span className="font-semibold">Operator:</span> {linkedBatch?.operator ?? "Needs verification"}
              </p>
              <p>
                <span className="font-semibold">Approval status:</span> {latestCertificate.approvalStatus}
              </p>
              <p>
                <span className="font-semibold">Compressive strength:</span> {numberFormat(latestCertificate.compressiveStrengthMpa)} MPa
              </p>
              <p>
                <span className="font-semibold">Water absorption:</span> {numberFormat(latestCertificate.waterAbsorptionPct)}%
              </p>
              <p>
                <span className="font-semibold">Density:</span> {numberFormat(latestCertificate.densityKgM3)} kg/m3
              </p>
              <p>
                <span className="font-semibold">Visual defects:</span> {numberFormat(latestCertificate.visualDefects)}
              </p>
            </div>
            <p className="mt-4 text-xs text-slate-500">Assumption: certificate format is operational and should be aligned with Uganda standards and laboratory accreditation before statutory use.</p>
          </article>
        ) : (
          <p className="text-sm text-slate-600">No test certificate available yet.</p>
        )}
      </Panel>
    </>
  );
}
