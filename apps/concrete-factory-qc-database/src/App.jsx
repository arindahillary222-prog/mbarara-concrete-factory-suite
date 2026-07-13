import React, { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  BadgeCheck,
  ClipboardCheck,
  Database,
  FileText,
  FlaskConical,
  Printer,
  RotateCcw,
  Save,
  Search,
} from "lucide-react";

const STORAGE_KEY = "mbarara-concrete-factory-qc-database-v1";
const TODAY = "2026-06-06";

const productSpecs = {
  "6-inch hollow blocks": { minStrength: 5.0, maxAbsorption: 12, densityMin: 1600, dimensionTolerance: 3 },
  "8-inch hollow blocks": { minStrength: 7.5, maxAbsorption: 12, densityMin: 1650, dimensionTolerance: 3 },
  "solid blocks": { minStrength: 10.0, maxAbsorption: 10, densityMin: 1800, dimensionTolerance: 3 },
  "60 mm pavers": { minStrength: 35.0, maxAbsorption: 6, densityMin: 2100, dimensionTolerance: 2 },
  "80 mm pavers": { minStrength: 40.0, maxAbsorption: 6, densityMin: 2150, dimensionTolerance: 2 },
  kerbstones: { minStrength: 25.0, maxAbsorption: 8, densityMin: 2200, dimensionTolerance: 4 },
  "drainage channels": { minStrength: 25.0, maxAbsorption: 8, densityMin: 2200, dimensionTolerance: 5 },
  culverts: { minStrength: 30.0, maxAbsorption: 7, densityMin: 2250, dimensionTolerance: 5 },
};

const productTypes = Object.keys(productSpecs);

const operators = ["A. Tumusiime", "J. Kato", "M. Asiimwe", "P. Nuwagaba", "S. Akello"];

const seedBatches = [
  batch("MBR-QC-2026-0001", "2026-06-01", "6-inch hollow blocks", "A. Tumusiime", 310, 42, 36, 18, "1:5.8:2.9", "2026-06-01", 6.2, 9.1, 1710, 1.8, 2, "Minor corner chips on two samples"),
  batch("MBR-QC-2026-0002", "2026-06-01", "8-inch hollow blocks", "J. Kato", 280, 48, 34, 20, "1:5.2:2.6", "2026-06-01", 8.4, 8.7, 1760, 2.1, 0, "Clean finish"),
  batch("MBR-QC-2026-0003", "2026-06-02", "60 mm pavers", "M. Asiimwe", 240, 30, 22, 12, "1:2:3", "2026-06-02", 37.8, 4.9, 2185, 1.4, 1, "One surface scuff"),
  batch("MBR-QC-2026-0004", "2026-06-02", "80 mm pavers", "P. Nuwagaba", 260, 38, 24, 14, "1:1.8:2.7", "2026-06-02", 39.1, 5.8, 2160, 2.4, 3, "Edges rough on several samples"),
  batch("MBR-QC-2026-0005", "2026-06-03", "kerbstones", "S. Akello", 180, 22, 14, 9, "M25 design", "2026-06-03", 27.4, 6.4, 2240, 2.9, 0, "Approved for road-edge lot"),
  batch("MBR-QC-2026-0006", "2026-06-03", "drainage channels", "A. Tumusiime", 210, 28, 16, 10, "M25 design", "2026-06-03", 23.8, 7.2, 2190, 4.8, 4, "Honeycombing visible at one web"),
  batch("MBR-QC-2026-0007", "2026-06-04", "culverts", "J. Kato", 320, 55, 30, 17, "M30 design", "2026-06-04", 32.6, 5.9, 2290, 3.7, 1, "Good cage cover"),
  batch("MBR-QC-2026-0008", "2026-06-04", "solid blocks", "M. Asiimwe", 190, 28, 22, 11, "1:4.8:2.2", "2026-06-04", 11.2, 8.6, 1880, 2.0, 0, "Dense and square"),
  batch("MBR-QC-2026-0009", "2026-06-05", "6-inch hollow blocks", "P. Nuwagaba", 300, 41, 37, 19, "1:6:3", "2026-06-05", 4.7, 10.8, 1695, 2.5, 5, "Low early strength; hold lot"),
  batch("MBR-QC-2026-0010", "2026-06-05", "60 mm pavers", "S. Akello", 245, 29, 22, 12, "1:2:3", "2026-06-05", 38.9, 4.7, 2190, 1.2, 0, "Release after curing"),
  batch("MBR-QC-2026-0011", "2026-06-06", "8-inch hollow blocks", "A. Tumusiime", 285, 47, 35, 20, "1:5.4:2.6", "2026-06-06", 8.0, 9.2, 1750, 2.3, 1, "OK"),
  batch("MBR-QC-2026-0012", "2026-06-06", "80 mm pavers", "J. Kato", 268, 39, 25, 15, "1:1.8:2.7", "2026-06-06", 42.4, 5.2, 2180, 1.7, 0, "Strong result"),
];

function batch(
  batchId,
  date,
  productType,
  operator,
  cementUsed,
  stoneDustUsed,
  sandUsed,
  waterUsed,
  mixRatio,
  curingStartDate,
  compressiveStrength,
  waterAbsorption,
  density,
  dimensionDeviation,
  visualDefects,
  notes
) {
  return {
    id: batchId,
    batchId,
    date,
    productType,
    operator,
    cementUsed,
    stoneDustUsed,
    sandUsed,
    waterUsed,
    mixRatio,
    curingStartDate,
    compressiveStrength,
    waterAbsorption,
    density,
    dimensionDeviation,
    visualDefects,
    notes,
  };
}

const defaultForm = {
  batchId: nextBatchId(seedBatches),
  date: TODAY,
  productType: "6-inch hollow blocks",
  operator: operators[0],
  cementUsed: "",
  stoneDustUsed: "",
  sandUsed: "",
  waterUsed: "",
  mixRatio: "",
  curingStartDate: TODAY,
  compressiveStrength: "",
  waterAbsorption: "",
  density: "",
  dimensionDeviation: "",
  visualDefects: "",
  notes: "",
};

const chartColors = ["#2f7d5b", "#3b6ea8", "#b7842f", "#a44a3f", "#5d7182", "#6f5ea8", "#4f8f96", "#7a6b45"];

function asNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function daysBetween(start, end = TODAY) {
  const a = new Date(`${start}T00:00:00`);
  const b = new Date(`${end}T00:00:00`);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return 0;
  return Math.max(0, Math.floor((b - a) / 86_400_000));
}

function nextBatchId(batches) {
  const max = batches.reduce((highest, item) => {
    const found = /(\d+)$/.exec(item.batchId || "");
    return found ? Math.max(highest, Number(found[1])) : highest;
  }, 0);
  return `MBR-QC-2026-${String(max + 1).padStart(4, "0")}`;
}

function evaluateBatch(item) {
  const spec = productSpecs[item.productType] || productSpecs[productTypes[0]];
  const checks = {
    compressiveStrength: item.compressiveStrength >= spec.minStrength,
    waterAbsorption: item.waterAbsorption <= spec.maxAbsorption,
    density: item.density >= spec.densityMin,
    dimensions: item.dimensionDeviation <= spec.dimensionTolerance,
    visualDefects: item.visualDefects <= 2,
  };
  const failedChecks = Object.entries(checks)
    .filter(([, pass]) => !pass)
    .map(([name]) => name);
  const approvalStatus = failedChecks.length ? "Failed" : "Passed";
  const testResult = approvalStatus === "Passed" ? "Pass" : `Fail: ${failedChecks.join(", ")}`;
  return {
    ...item,
    spec,
    checks,
    failedChecks,
    approvalStatus,
    testResult,
    curingAge: daysBetween(item.curingStartDate),
  };
}

function groupByProduct(batches) {
  return productTypes.map((product) => {
    const rows = batches.filter((batchItem) => batchItem.productType === product);
    const avgStrength = rows.length ? rows.reduce((sum, item) => sum + item.compressiveStrength, 0) / rows.length : 0;
    const failed = rows.filter((item) => item.approvalStatus === "Failed").length;
    return {
      product,
      count: rows.length,
      avgStrength,
      failed,
      passed: rows.length - failed,
      rejectionRate: rows.length ? failed / rows.length : 0,
    };
  });
}

function defectTrend(batches) {
  const byDate = new Map();
  batches.forEach((item) => {
    if (!byDate.has(item.date)) byDate.set(item.date, { date: item.date, defects: 0, failed: 0, batches: 0 });
    const row = byDate.get(item.date);
    row.defects += item.visualDefects;
    row.failed += item.approvalStatus === "Failed" ? 1 : 0;
    row.batches += 1;
  });
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}

function App() {
  const [batches, setBatches] = useState(seedBatches);
  const [form, setForm] = useState(defaultForm);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedBatchId, setSelectedBatchId] = useState(seedBatches[0].batchId);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved);
      if (parsed.batches?.length) {
        setBatches(parsed.batches);
        setSelectedBatchId(parsed.selectedBatchId || parsed.batches[0].batchId);
        setForm({ ...defaultForm, batchId: nextBatchId(parsed.batches) });
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ batches, selectedBatchId }));
  }, [batches, selectedBatchId]);

  const evaluated = useMemo(() => batches.map(evaluateBatch), [batches]);
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return evaluated
      .filter((item) => statusFilter === "All" || item.approvalStatus === statusFilter)
      .filter((item) => {
        if (!needle) return true;
        return [item.batchId, item.productType, item.operator, item.mixRatio, item.notes].some((field) =>
          String(field || "").toLowerCase().includes(needle)
        );
      })
      .sort((a, b) => b.date.localeCompare(a.date) || b.batchId.localeCompare(a.batchId));
  }, [evaluated, query, statusFilter]);

  const selectedBatch = evaluated.find((item) => item.batchId === selectedBatchId) || evaluated[0];
  const passed = evaluated.filter((item) => item.approvalStatus === "Passed").length;
  const failed = evaluated.filter((item) => item.approvalStatus === "Failed").length;
  const rejectionRate = evaluated.length ? failed / evaluated.length : 0;
  const avgStrength = evaluated.length ? evaluated.reduce((sum, item) => sum + item.compressiveStrength, 0) / evaluated.length : 0;
  const strengthByProduct = groupByProduct(evaluated);
  const trends = defectTrend(evaluated);
  const defectMix = [
    ["Compressive strength", "compressiveStrength"],
    ["Water absorption", "waterAbsorption"],
    ["Density", "density"],
    ["Dimensions", "dimensions"],
    ["Visual defects", "visualDefects"],
  ].map(([name, key]) => ({
    name,
    value: evaluated.filter((item) => item.failedChecks.includes(key)).length,
  }));

  function updateForm(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function saveBatch(event) {
    event.preventDefault();
    const newBatch = {
      id: form.batchId,
      batchId: form.batchId,
      date: form.date,
      productType: form.productType,
      operator: form.operator,
      cementUsed: asNumber(form.cementUsed),
      stoneDustUsed: asNumber(form.stoneDustUsed),
      sandUsed: asNumber(form.sandUsed),
      waterUsed: asNumber(form.waterUsed),
      mixRatio: form.mixRatio,
      curingStartDate: form.curingStartDate,
      compressiveStrength: asNumber(form.compressiveStrength),
      waterAbsorption: asNumber(form.waterAbsorption),
      density: asNumber(form.density),
      dimensionDeviation: asNumber(form.dimensionDeviation),
      visualDefects: asNumber(form.visualDefects),
      notes: form.notes,
    };
    const existing = batches.some((item) => item.batchId === newBatch.batchId);
    const next = existing ? batches.map((item) => (item.batchId === newBatch.batchId ? newBatch : item)) : [newBatch, ...batches];
    setBatches(next);
    setSelectedBatchId(newBatch.batchId);
    setForm({ ...defaultForm, batchId: nextBatchId(next), date: form.date, curingStartDate: form.date, productType: form.productType });
  }

  function loadBatchForEdit(batchItem) {
    setForm({
      batchId: batchItem.batchId,
      date: batchItem.date,
      productType: batchItem.productType,
      operator: batchItem.operator,
      cementUsed: batchItem.cementUsed,
      stoneDustUsed: batchItem.stoneDustUsed,
      sandUsed: batchItem.sandUsed,
      waterUsed: batchItem.waterUsed,
      mixRatio: batchItem.mixRatio,
      curingStartDate: batchItem.curingStartDate,
      compressiveStrength: batchItem.compressiveStrength,
      waterAbsorption: batchItem.waterAbsorption,
      density: batchItem.density,
      dimensionDeviation: batchItem.dimensionDeviation,
      visualDefects: batchItem.visualDefects,
      notes: batchItem.notes,
    });
    setSelectedBatchId(batchItem.batchId);
  }

  function resetDatabase() {
    setBatches(seedBatches);
    setSelectedBatchId(seedBatches[0].batchId);
    setForm({ ...defaultForm, batchId: nextBatchId(seedBatches) });
    window.localStorage.removeItem(STORAGE_KEY);
  }

  function printCertificate() {
    window.print();
  }

  return (
    <div className="min-h-screen bg-[#eef2f4] text-ink">
      <header className="border-b border-slate-200 bg-white no-print">
        <div className="mx-auto flex max-w-[1560px] flex-col gap-4 px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-md bg-factory-navy text-white">
              <Database size={23} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-factory-green">Concrete products factory</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-normal text-factory-navy">Quality Control Batch Database</h1>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={printCertificate}
              className="inline-flex items-center gap-2 rounded-md bg-factory-green px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#286d50]"
            >
              <Printer size={17} />
              Print certificate
            </button>
            <button
              type="button"
              onClick={resetDatabase}
              className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              <RotateCcw size={17} />
              Reset
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1560px] gap-5 px-5 py-5 xl:grid-cols-[430px_minmax(0,1fr)] no-print">
        <aside className="space-y-4">
          <form onSubmit={saveBatch} className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-factory-navy">
              <FlaskConical size={18} />
              Production Batch Record
            </h2>
            <div className="grid gap-3">
              <Field label="Batch ID" value={form.batchId} onChange={(value) => updateForm("batchId", value)} type="text" />
              <Field label="Date" value={form.date} onChange={(value) => updateForm("date", value)} type="date" />
              <SelectField label="Product type" value={form.productType} values={productTypes} onChange={(value) => updateForm("productType", value)} />
              <SelectField label="Operator" value={form.operator} values={operators} onChange={(value) => updateForm("operator", value)} />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Cement used" value={form.cementUsed} onChange={(value) => updateForm("cementUsed", value)} suffix="bags" />
                <Field label="Stone dust used" value={form.stoneDustUsed} onChange={(value) => updateForm("stoneDustUsed", value)} suffix="t" />
                <Field label="Sand used" value={form.sandUsed} onChange={(value) => updateForm("sandUsed", value)} suffix="t" />
                <Field label="Water used" value={form.waterUsed} onChange={(value) => updateForm("waterUsed", value)} suffix="m³" />
              </div>
              <Field label="Mix ratio" value={form.mixRatio} onChange={(value) => updateForm("mixRatio", value)} type="text" />
              <Field
                label="Curing start date"
                value={form.curingStartDate}
                onChange={(value) => updateForm("curingStartDate", value)}
                type="date"
              />
              <div className="grid grid-cols-2 gap-3">
                <Field
                  label="Compressive strength"
                  value={form.compressiveStrength}
                  onChange={(value) => updateForm("compressiveStrength", value)}
                  suffix="MPa"
                />
                <Field
                  label="Water absorption"
                  value={form.waterAbsorption}
                  onChange={(value) => updateForm("waterAbsorption", value)}
                  suffix="%"
                />
                <Field label="Density" value={form.density} onChange={(value) => updateForm("density", value)} suffix="kg/m³" />
                <Field
                  label="Dimension deviation"
                  value={form.dimensionDeviation}
                  onChange={(value) => updateForm("dimensionDeviation", value)}
                  suffix="mm"
                />
              </div>
              <Field label="Visual defects" value={form.visualDefects} onChange={(value) => updateForm("visualDefects", value)} suffix="count" />
              <Field label="Notes" value={form.notes} onChange={(value) => updateForm("notes", value)} type="text" />
            </div>
            <button
              type="submit"
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-factory-navy px-3 py-2 text-sm font-semibold text-white hover:bg-[#102638]"
            >
              <Save size={17} />
              Save batch
            </button>
          </form>

          <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-factory-navy">
              <AlertTriangle size={18} />
              Failed Batch Reasons
            </h2>
            <div className="space-y-2">
              {evaluated
                .filter((item) => item.approvalStatus === "Failed")
                .slice(0, 6)
                .map((item) => (
                  <button
                    type="button"
                    key={item.batchId}
                    onClick={() => setSelectedBatchId(item.batchId)}
                    className="w-full rounded-md border border-red-200 bg-red-50 px-3 py-2 text-left hover:bg-red-100"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-factory-navy">{item.batchId}</span>
                      <span className="text-xs font-bold text-factory-clay">{item.productType}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-600">{item.testResult}</p>
                  </button>
                ))}
            </div>
          </section>
        </aside>

        <section className="min-w-0 space-y-5">
          <div className="grid gap-3 lg:grid-cols-4">
            <MetricCard label="Passed batches" value={String(passed)} tone="green" />
            <MetricCard label="Failed batches" value={String(failed)} tone="clay" />
            <MetricCard label="Rejection rate" value={`${(rejectionRate * 100).toFixed(1)}%`} tone="amber" />
            <MetricCard label="Average strength" value={`${avgStrength.toFixed(1)} MPa`} tone="navy" />
          </div>

          <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-sm font-semibold text-factory-navy">Batch Database</h2>
                <p className="text-xs text-slate-500">Every production batch carries material usage, curing, lab test result and approval status.</p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <label className="flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2">
                  <Search size={15} className="text-slate-500" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search batch, product, operator"
                    className="w-64 border-0 text-sm outline-none"
                  />
                </label>
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-factory-green focus:ring-2 focus:ring-factory-green/20"
                >
                  <option>All</option>
                  <option>Passed</option>
                  <option>Failed</option>
                </select>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-[1260px] w-full border-separate border-spacing-0 text-left text-sm">
                <thead>
                  <tr className="bg-factory-navy text-white">
                    <Th>Batch ID</Th>
                    <Th>Date</Th>
                    <Th>Product</Th>
                    <Th>Operator</Th>
                    <Th>Mix ratio</Th>
                    <Th>Curing age</Th>
                    <Th>Strength</Th>
                    <Th>Absorption</Th>
                    <Th>Density</Th>
                    <Th>Dimensions</Th>
                    <Th>Defects</Th>
                    <Th>Status</Th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item, index) => (
                    <tr
                      key={item.batchId}
                      onClick={() => setSelectedBatchId(item.batchId)}
                      onDoubleClick={() => loadBatchForEdit(item)}
                      className={`${index % 2 ? "bg-white" : "bg-slate-50/70"} cursor-pointer hover:bg-green-50`}
                    >
                      <Td>
                        <button type="button" className="font-semibold text-factory-navy underline-offset-2 hover:underline">
                          {item.batchId}
                        </button>
                      </Td>
                      <Td>{item.date}</Td>
                      <Td>{item.productType}</Td>
                      <Td>{item.operator}</Td>
                      <Td>{item.mixRatio}</Td>
                      <Td>{item.curingAge} days</Td>
                      <Td className={item.checks.compressiveStrength ? "" : "font-semibold text-factory-clay"}>
                        {item.compressiveStrength.toFixed(1)} MPa
                      </Td>
                      <Td className={item.checks.waterAbsorption ? "" : "font-semibold text-factory-clay"}>
                        {item.waterAbsorption.toFixed(1)}%
                      </Td>
                      <Td className={item.checks.density ? "" : "font-semibold text-factory-clay"}>{item.density.toFixed(0)}</Td>
                      <Td className={item.checks.dimensions ? "" : "font-semibold text-factory-clay"}>
                        {item.dimensionDeviation.toFixed(1)} mm
                      </Td>
                      <Td className={item.checks.visualDefects ? "" : "font-semibold text-factory-clay"}>{item.visualDefects}</Td>
                      <Td>
                        <StatusBadge status={item.approvalStatus} />
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="grid gap-5 2xl:grid-cols-2">
            <ChartPanel title="Average Strength by Product">
              <ResponsiveContainer width="100%" height={305}>
                <BarChart data={strengthByProduct} margin={{ top: 12, right: 16, left: 0, bottom: 55 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#d8dee4" />
                  <XAxis dataKey="product" angle={-28} textAnchor="end" interval={0} height={86} tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value) => `${Number(value).toFixed(1)} MPa`} />
                  <Bar dataKey="avgStrength" name="Average strength" fill="#2f7d5b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartPanel>

            <ChartPanel title="Passed vs Failed Batches">
              <ResponsiveContainer width="100%" height={305}>
                <BarChart data={strengthByProduct} margin={{ top: 12, right: 16, left: 0, bottom: 55 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#d8dee4" />
                  <XAxis dataKey="product" angle={-28} textAnchor="end" interval={0} height={86} tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="passed" name="Passed" stackId="a" fill="#2f7d5b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="failed" name="Failed" stackId="a" fill="#a44a3f" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartPanel>

            <ChartPanel title="Defect Trends">
              <ResponsiveContainer width="100%" height={305}>
                <LineChart data={trends} margin={{ top: 12, right: 18, left: 0, bottom: 12 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#d8dee4" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="defects" name="Visual defects" stroke="#b7842f" strokeWidth={2} />
                  <Line type="monotone" dataKey="failed" name="Failed batches" stroke="#a44a3f" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </ChartPanel>

            <ChartPanel title="Failure Cause Mix">
              <ResponsiveContainer width="100%" height={305}>
                <PieChart>
                  <Pie data={defectMix} dataKey="value" nameKey="name" innerRadius={72} outerRadius={112} paddingAngle={2}>
                    {defectMix.map((entry, index) => (
                      <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartPanel>
          </section>

          {selectedBatch ? <CertificatePreview batch={selectedBatch} /> : null}
        </section>
      </main>

      {selectedBatch ? <PrintableCertificate batch={selectedBatch} /> : null}
    </div>
  );
}

function CertificatePreview({ batch }) {
  return (
    <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-factory-navy">
          <FileText size={18} />
          Printable Test Certificate Preview
        </h2>
        <StatusBadge status={batch.approvalStatus} />
      </div>
      <div className="grid gap-3 md:grid-cols-4">
        <SmallStat label="Batch ID" value={batch.batchId} />
        <SmallStat label="Product" value={batch.productType} />
        <SmallStat label="Strength" value={`${batch.compressiveStrength.toFixed(1)} MPa`} />
        <SmallStat label="Test result" value={batch.testResult} />
      </div>
    </section>
  );
}

function PrintableCertificate({ batch }) {
  const rows = [
    ["Batch ID", batch.batchId],
    ["Date", batch.date],
    ["Product type", batch.productType],
    ["Operator", batch.operator],
    ["Cement used", `${batch.cementUsed} bags`],
    ["Stone dust used", `${batch.stoneDustUsed} tonnes`],
    ["Sand used", `${batch.sandUsed} tonnes`],
    ["Water used", `${batch.waterUsed} m3`],
    ["Mix ratio", batch.mixRatio],
    ["Curing start date", batch.curingStartDate],
    ["Curing age", `${batch.curingAge} days`],
    ["Compressive strength", `${batch.compressiveStrength.toFixed(1)} MPa`],
    ["Water absorption", `${batch.waterAbsorption.toFixed(1)}%`],
    ["Density", `${batch.density.toFixed(0)} kg/m3`],
    ["Dimensions deviation", `${batch.dimensionDeviation.toFixed(1)} mm`],
    ["Visual defects", batch.visualDefects],
    ["Test result", batch.testResult],
    ["Approval status", batch.approvalStatus],
  ];
  return (
    <section id="certificate-print" className="hidden p-10 print:block">
      <div className="border-b-4 border-factory-navy pb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-factory-green">Concrete products factory quality control</p>
        <h1 className="mt-2 text-3xl font-bold text-factory-navy">Batch Test Certificate</h1>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="border-b border-slate-200 pb-2">
            <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
            <p className="mt-1 font-semibold text-ink">{value}</p>
          </div>
        ))}
      </div>
      <div className="mt-8 rounded-md border border-slate-300 p-4">
        <p className="text-xs font-semibold uppercase text-slate-500">Notes</p>
        <p className="mt-2 text-sm">{batch.notes || "No additional notes recorded."}</p>
      </div>
      <div className="mt-12 grid grid-cols-3 gap-8 text-sm">
        <div className="border-t border-slate-500 pt-2">QC technician</div>
        <div className="border-t border-slate-500 pt-2">Plant manager</div>
        <div className="border-t border-slate-500 pt-2">Date</div>
      </div>
    </section>
  );
}

function Field({ label, value, onChange, type = "number", suffix }) {
  return (
    <label className="grid gap-1">
      <span className="text-xs font-medium text-slate-600">{label}</span>
      <div className="flex overflow-hidden rounded-md border border-slate-300 bg-white focus-within:border-factory-green focus-within:ring-2 focus-within:ring-factory-green/20">
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="min-w-0 flex-1 border-0 px-3 py-2 text-sm outline-none"
        />
        {suffix ? (
          <span className="flex items-center border-l border-slate-200 bg-slate-50 px-2 text-xs font-semibold text-slate-500">{suffix}</span>
        ) : null}
      </div>
    </label>
  );
}

function SelectField({ label, value, values, onChange }) {
  return (
    <label className="grid gap-1">
      <span className="text-xs font-medium text-slate-600">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-factory-green focus:ring-2 focus:ring-factory-green/20"
      >
        {values.map((entry) => (
          <option key={entry} value={entry}>
            {entry}
          </option>
        ))}
      </select>
    </label>
  );
}

function MetricCard({ label, value, tone }) {
  const tones = {
    navy: "bg-factory-navy text-white",
    green: "bg-factory-green text-white",
    amber: "bg-factory-amber text-white",
    clay: "bg-factory-clay text-white",
  };
  return (
    <section className={`${tones[tone]} rounded-md p-4 shadow-soft`}>
      <p className="text-xs font-semibold uppercase tracking-[0.12em] opacity-80">{label}</p>
      <p className="mt-4 text-2xl font-semibold tracking-normal">{value}</p>
    </section>
  );
}

function SmallStat({ label, value }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-3">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-factory-navy">{value}</p>
    </div>
  );
}

function ChartPanel({ title, children }) {
  return (
    <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-2 text-sm font-semibold text-factory-navy">{title}</h2>
      {children}
    </section>
  );
}

function StatusBadge({ status }) {
  const cls =
    status === "Passed"
      ? "bg-green-50 text-factory-green ring-green-200"
      : "bg-red-50 text-factory-clay ring-red-200";
  const Icon = status === "Passed" ? BadgeCheck : AlertTriangle;
  return (
    <span className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-bold ring-1 ${cls}`}>
      <Icon size={13} />
      {status}
    </span>
  );
}

function Th({ children }) {
  return <th className="border-b border-white/10 px-3 py-3 text-xs font-semibold">{children}</th>;
}

function Td({ children, className = "" }) {
  return <td className={`border-b border-slate-200 px-3 py-3 align-middle text-sm ${className}`}>{children}</td>;
}

export default App;
