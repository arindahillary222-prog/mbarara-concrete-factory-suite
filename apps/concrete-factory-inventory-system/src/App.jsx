import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  Boxes,
  ClipboardList,
  Factory,
  FileDown,
  PackagePlus,
  RotateCcw,
  Truck,
} from "lucide-react";

const STORAGE_KEY = "mbarara-concrete-factory-inventory-system-v1";
const DEFAULT_MONTH = "2026-06";
const WORKING_DAYS_PER_MONTH = 26;

const inventoryItems = [
  {
    id: "cement-bags",
    name: "Cement bags",
    unit: "bags",
    openingQty: 2400,
    openingUnitCost: 38000,
    reorderLevel: 850,
    leadTimeDays: 5,
    safetyStockDays: 3,
  },
  {
    id: "stone-dust-tonnes",
    name: "Stone dust",
    unit: "tonnes",
    openingQty: 460,
    openingUnitCost: 72000,
    reorderLevel: 140,
    leadTimeDays: 4,
    safetyStockDays: 3,
  },
  {
    id: "sand-tonnes",
    name: "Sand",
    unit: "tonnes",
    openingQty: 390,
    openingUnitCost: 85000,
    reorderLevel: 120,
    leadTimeDays: 4,
    safetyStockDays: 3,
  },
  {
    id: "aggregates-tonnes",
    name: "Aggregates",
    unit: "tonnes",
    openingQty: 520,
    openingUnitCost: 98000,
    reorderLevel: 160,
    leadTimeDays: 4,
    safetyStockDays: 3,
  },
  {
    id: "diesel-litres",
    name: "Diesel",
    unit: "litres",
    openingQty: 3400,
    openingUnitCost: 5450,
    reorderLevel: 1200,
    leadTimeDays: 3,
    safetyStockDays: 2,
  },
  {
    id: "water-m3",
    name: "Water",
    unit: "m³",
    openingQty: 1800,
    openingUnitCost: 4200,
    reorderLevel: 650,
    leadTimeDays: 2,
    safetyStockDays: 2,
  },
  {
    id: "pallets",
    name: "Pallets",
    unit: "pallets",
    openingQty: 1250,
    openingUnitCost: 42000,
    reorderLevel: 350,
    leadTimeDays: 10,
    safetyStockDays: 5,
  },
  {
    id: "moulds",
    name: "Moulds",
    unit: "sets",
    openingQty: 34,
    openingUnitCost: 3200000,
    reorderLevel: 8,
    leadTimeDays: 45,
    safetyStockDays: 10,
  },
  {
    id: "spare-parts",
    name: "Spare parts",
    unit: "items",
    openingQty: 210,
    openingUnitCost: 185000,
    reorderLevel: 75,
    leadTimeDays: 14,
    safetyStockDays: 7,
  },
];

const seedTransactions = [
  receipt("2026-06-01", "cement-bags", 900, "Hima Cement distributor", "UBG 734K", 34_200_000),
  receipt("2026-06-02", "sand-tonnes", 120, "Mbarara Sand Supplies", "UAZ 903M", 10_200_000),
  receipt("2026-06-02", "aggregates-tonnes", 160, "Nyakayojo Quarry", "UBH 441P", 15_680_000),
  receipt("2026-06-03", "diesel-litres", 1800, "TotalEnergies Mbarara", "UBE 220L", 9_810_000),
  receipt("2026-06-04", "pallets", 180, "Western Pallet Works", "UBJ 612Q", 7_560_000),
  issue("2026-06-01", "cement-bags", 310, "Blocks and pavers line"),
  issue("2026-06-01", "stone-dust-tonnes", 42, "Blocks and pavers line"),
  issue("2026-06-01", "sand-tonnes", 36, "Blocks and pavers line"),
  issue("2026-06-02", "aggregates-tonnes", 58, "Kerbstone and channel production"),
  issue("2026-06-02", "water-m3", 95, "Curing and batching"),
  issue("2026-06-03", "diesel-litres", 430, "Loader and delivery fleet"),
  issue("2026-06-03", "pallets", 70, "Paver curing racks"),
  issue("2026-06-04", "cement-bags", 340, "Culverts and drainage channels"),
  issue("2026-06-04", "stone-dust-tonnes", 39, "Block machine line"),
  issue("2026-06-05", "spare-parts", 14, "Vibropress maintenance"),
  issue("2026-06-05", "moulds", 2, "Paver profile changeover"),
];

const colors = ["#2f7d5b", "#3b6ea8", "#b7842f", "#a44a3f", "#5e7380", "#6f5ea8", "#4f8f96", "#7a6b45"];

function receipt(date, itemId, quantity, supplierName, truckNumber, deliveryCost) {
  return {
    id: cryptoId(),
    type: "receipt",
    date,
    itemId,
    quantity,
    supplierName,
    truckNumber,
    deliveryCost,
    productionArea: "",
    notes: "",
  };
}

function issue(date, itemId, quantity, productionArea) {
  return {
    id: cryptoId(),
    type: "issue",
    date,
    itemId,
    quantity,
    supplierName: "",
    truckNumber: "",
    deliveryCost: 0,
    productionArea,
    notes: "",
  };
}

function cryptoId() {
  return `tx-${Math.random().toString(16).slice(2)}-${Date.now().toString(16)}`;
}

function formatUGX(value, compact = false) {
  const safe = Number.isFinite(value) ? value : 0;
  if (compact && Math.abs(safe) >= 1_000_000_000) return `UGX ${(safe / 1_000_000_000).toFixed(2)} bn`;
  if (compact && Math.abs(safe) >= 1_000_000) return `UGX ${(safe / 1_000_000).toFixed(1)} m`;
  return `UGX ${safe.toLocaleString("en-UG", { maximumFractionDigits: 0 })}`;
}

function formatQty(value, unit) {
  const decimals = unit === "sets" || unit === "items" || unit === "bags" || unit === "pallets" ? 0 : 1;
  return `${(Number.isFinite(value) ? value : 0).toLocaleString("en-UG", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })} ${unit}`;
}

function asNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function buildInventory(transactions, itemSettings) {
  return itemSettings.map((item) => {
    const itemTx = transactions.filter((tx) => tx.itemId === item.id);
    const receipts = itemTx.filter((tx) => tx.type === "receipt");
    const issues = itemTx.filter((tx) => tx.type === "issue");
    const receivedQty = receipts.reduce((sum, tx) => sum + tx.quantity, 0);
    const issuedQty = issues.reduce((sum, tx) => sum + tx.quantity, 0);
    const receiptCost = receipts.reduce((sum, tx) => sum + tx.deliveryCost, 0);
    const availableQty = item.openingQty + receivedQty;
    const availableCost = item.openingQty * item.openingUnitCost + receiptCost;
    const weightedUnitCost = availableQty > 0 ? availableCost / availableQty : item.openingUnitCost;
    const currentQty = Math.max(0, availableQty - issuedQty);
    const stockValue = currentQty * weightedUnitCost;
    const dailyConsumption = issuedQty / WORKING_DAYS_PER_MONTH;
    const daysRemaining = dailyConsumption > 0 ? currentQty / dailyConsumption : Infinity;
    const calculatedReorderLevel = dailyConsumption * (item.leadTimeDays + item.safetyStockDays);
    const activeReorderLevel = Math.max(item.reorderLevel, calculatedReorderLevel);
    const reorderQty = Math.max(0, activeReorderLevel * 1.6 - currentQty);
    const status =
      currentQty <= activeReorderLevel ? "Reorder" : daysRemaining <= item.leadTimeDays + item.safetyStockDays ? "Watch" : "OK";

    return {
      ...item,
      receipts,
      issues,
      receivedQty,
      issuedQty,
      receiptCost,
      currentQty,
      weightedUnitCost,
      stockValue,
      dailyConsumption,
      daysRemaining,
      calculatedReorderLevel,
      activeReorderLevel,
      reorderQty,
      status,
    };
  });
}

function buildMonthlyReport(transactions, inventory, month) {
  const monthTx = transactions.filter((tx) => tx.date?.startsWith(month));
  return inventory.map((item) => {
    const receipts = monthTx.filter((tx) => tx.itemId === item.id && tx.type === "receipt");
    const issues = monthTx.filter((tx) => tx.itemId === item.id && tx.type === "issue");
    const receivedQty = receipts.reduce((sum, tx) => sum + tx.quantity, 0);
    const issuedQty = issues.reduce((sum, tx) => sum + tx.quantity, 0);
    const deliveryCost = receipts.reduce((sum, tx) => sum + tx.deliveryCost, 0);
    const usageValue = issuedQty * item.weightedUnitCost;
    return { ...item, monthReceivedQty: receivedQty, monthIssuedQty: issuedQty, monthDeliveryCost: deliveryCost, usageValue };
  });
}

function App() {
  const [itemSettings, setItemSettings] = useState(inventoryItems);
  const [transactions, setTransactions] = useState(seedTransactions);
  const [activeMonth, setActiveMonth] = useState(DEFAULT_MONTH);
  const [receiptForm, setReceiptForm] = useState({
    itemId: inventoryItems[0].id,
    date: "2026-06-06",
    quantity: "",
    supplierName: "",
    truckNumber: "",
    deliveryCost: "",
    notes: "",
  });
  const [issueForm, setIssueForm] = useState({
    itemId: inventoryItems[0].id,
    date: "2026-06-06",
    quantity: "",
    productionArea: "Blocks and pavers line",
    notes: "",
  });

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved);
      setItemSettings(
        inventoryItems.map((item) => ({
          ...item,
          ...(parsed.itemSettings || []).find((savedItem) => savedItem.id === item.id),
        }))
      );
      setTransactions(parsed.transactions?.length ? parsed.transactions : seedTransactions);
      setActiveMonth(parsed.activeMonth || DEFAULT_MONTH);
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ itemSettings, transactions, activeMonth }));
  }, [itemSettings, transactions, activeMonth]);

  const inventory = useMemo(() => buildInventory(transactions, itemSettings), [transactions, itemSettings]);
  const monthlyReport = useMemo(() => buildMonthlyReport(transactions, inventory, activeMonth), [transactions, inventory, activeMonth]);
  const totalStockValue = inventory.reduce((sum, item) => sum + item.stockValue, 0);
  const lowStockCount = inventory.filter((item) => item.status === "Reorder").length;
  const monthlyUsageValue = monthlyReport.reduce((sum, item) => sum + item.usageValue, 0);
  const totalDailyConsumptionValue = inventory.reduce((sum, item) => sum + item.dailyConsumption * item.weightedUnitCost, 0);
  const topConsumed = [...monthlyReport].sort((a, b) => b.usageValue - a.usageValue).slice(0, 5);

  const stockChart = inventory.map((item) => ({
    name: item.name,
    value: Math.round(item.stockValue),
    status: item.status,
  }));
  const consumptionChart = topConsumed.map((item) => ({
    name: item.name,
    quantity: item.monthIssuedQty,
    value: Math.round(item.usageValue),
  }));
  const daysChart = inventory.map((item) => ({
    name: item.name,
    days: Number.isFinite(item.daysRemaining) ? Number(item.daysRemaining.toFixed(1)) : 120,
  }));

  function addReceipt(event) {
    event.preventDefault();
    const quantity = asNumber(receiptForm.quantity);
    if (!quantity) return;
    setTransactions((current) => [
      {
        id: cryptoId(),
        type: "receipt",
        date: receiptForm.date,
        itemId: receiptForm.itemId,
        quantity,
        supplierName: receiptForm.supplierName || "Unspecified supplier",
        truckNumber: receiptForm.truckNumber || "Not recorded",
        deliveryCost: asNumber(receiptForm.deliveryCost),
        productionArea: "",
        notes: receiptForm.notes,
      },
      ...current,
    ]);
    setReceiptForm((current) => ({ ...current, quantity: "", deliveryCost: "", supplierName: "", truckNumber: "", notes: "" }));
  }

  function issueStock(event) {
    event.preventDefault();
    const quantity = asNumber(issueForm.quantity);
    if (!quantity) return;
    const item = inventory.find((entry) => entry.id === issueForm.itemId);
    const issueQty = Math.min(quantity, item?.currentQty ?? quantity);
    setTransactions((current) => [
      {
        id: cryptoId(),
        type: "issue",
        date: issueForm.date,
        itemId: issueForm.itemId,
        quantity: issueQty,
        supplierName: "",
        truckNumber: "",
        deliveryCost: 0,
        productionArea: issueForm.productionArea || "Production",
        notes: issueForm.notes,
      },
      ...current,
    ]);
    setIssueForm((current) => ({ ...current, quantity: "", notes: "" }));
  }

  function updateItemSetting(itemId, key, value) {
    setItemSettings((current) => current.map((item) => (item.id === itemId ? { ...item, [key]: asNumber(value) } : item)));
  }

  function resetSystem() {
    setItemSettings(inventoryItems);
    setTransactions(seedTransactions);
    setActiveMonth(DEFAULT_MONTH);
    window.localStorage.removeItem(STORAGE_KEY);
  }

  function exportMonthlyCsv() {
    const rows = [
      ["Mbarara Concrete Products Factory Inventory Report"],
      ["Month", activeMonth],
      ["Currency", "UGX only"],
      [],
      [
        "Material",
        "Current stock",
        "Unit",
        "Stock value",
        "Daily consumption",
        "Days remaining",
        "Monthly received",
        "Monthly issued",
        "Monthly usage value",
        "Reorder level",
        "Suggested reorder qty",
        "Status",
      ],
      ...monthlyReport.map((item) => [
        item.name,
        item.currentQty.toFixed(2),
        item.unit,
        Math.round(item.stockValue),
        item.dailyConsumption.toFixed(2),
        Number.isFinite(item.daysRemaining) ? item.daysRemaining.toFixed(1) : "No usage",
        item.monthReceivedQty.toFixed(2),
        item.monthIssuedQty.toFixed(2),
        Math.round(item.usageValue),
        item.activeReorderLevel.toFixed(2),
        item.reorderQty.toFixed(2),
        item.status,
      ]),
      [],
      ["Recent transactions"],
      ["Date", "Type", "Material", "Quantity", "Unit", "Supplier / production", "Truck", "Cost UGX", "Notes"],
      ...transactions.slice(0, 80).map((tx) => {
        const item = inventory.find((entry) => entry.id === tx.itemId);
        return [
          tx.date,
          tx.type,
          item?.name || tx.itemId,
          tx.quantity,
          item?.unit || "",
          tx.type === "receipt" ? tx.supplierName : tx.productionArea,
          tx.truckNumber,
          Math.round(tx.deliveryCost || 0),
          tx.notes,
        ];
      }),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    downloadBlob(csv, `mbarara-inventory-report-${activeMonth}.csv`, "text/csv;charset=utf-8;");
  }

  return (
    <div className="min-h-screen bg-[#eef2f4] text-ink">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1560px] flex-col gap-4 px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-md bg-factory-navy text-white">
              <Boxes size={23} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-factory-green">Mbarara, Uganda</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-normal text-factory-navy">
                Concrete Factory Inventory Management
              </h1>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={exportMonthlyCsv}
              className="inline-flex items-center gap-2 rounded-md bg-factory-green px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#286d50]"
            >
              <FileDown size={17} />
              Export monthly CSV
            </button>
            <button
              type="button"
              onClick={resetSystem}
              className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              <RotateCcw size={17} />
              Reset
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1560px] gap-5 px-5 py-5 xl:grid-cols-[430px_1fr]">
        <aside className="space-y-4">
          <StockForm title="Add Stock" icon={<PackagePlus size={18} />} onSubmit={addReceipt}>
            <SelectField label="Material" value={receiptForm.itemId} onChange={(value) => setReceiptForm({ ...receiptForm, itemId: value })} />
            <Field label="Date" type="date" value={receiptForm.date} onChange={(value) => setReceiptForm({ ...receiptForm, date: value })} />
            <Field label="Quantity received" value={receiptForm.quantity} onChange={(value) => setReceiptForm({ ...receiptForm, quantity: value })} />
            <Field
              label="Supplier name"
              value={receiptForm.supplierName}
              onChange={(value) => setReceiptForm({ ...receiptForm, supplierName: value })}
              type="text"
            />
            <Field
              label="Delivery truck number"
              value={receiptForm.truckNumber}
              onChange={(value) => setReceiptForm({ ...receiptForm, truckNumber: value })}
              type="text"
            />
            <Field
              label="Cost per delivery"
              value={receiptForm.deliveryCost}
              onChange={(value) => setReceiptForm({ ...receiptForm, deliveryCost: value })}
              suffix="UGX"
            />
            <Field
              label="Notes"
              value={receiptForm.notes}
              onChange={(value) => setReceiptForm({ ...receiptForm, notes: value })}
              type="text"
            />
          </StockForm>

          <StockForm title="Issue Stock to Production" icon={<Factory size={18} />} onSubmit={issueStock}>
            <SelectField label="Material" value={issueForm.itemId} onChange={(value) => setIssueForm({ ...issueForm, itemId: value })} />
            <Field label="Date" type="date" value={issueForm.date} onChange={(value) => setIssueForm({ ...issueForm, date: value })} />
            <Field label="Quantity issued" value={issueForm.quantity} onChange={(value) => setIssueForm({ ...issueForm, quantity: value })} />
            <Field
              label="Production area"
              value={issueForm.productionArea}
              onChange={(value) => setIssueForm({ ...issueForm, productionArea: value })}
              type="text"
            />
            <Field
              label="Issue notes"
              value={issueForm.notes}
              onChange={(value) => setIssueForm({ ...issueForm, notes: value })}
              type="text"
            />
          </StockForm>

          <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-factory-navy">
              <AlertTriangle size={18} />
              Low-stock Alerts
            </h2>
            <div className="mt-3 space-y-2">
              {inventory.filter((item) => item.status !== "OK").length ? (
                inventory
                  .filter((item) => item.status !== "OK")
                  .map((item) => (
                    <div key={item.id} className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-semibold text-factory-navy">{item.name}</span>
                        <span className="rounded bg-white px-2 py-1 text-xs font-bold text-factory-clay">{item.status}</span>
                      </div>
                      <p className="mt-1 text-xs text-slate-600">
                        {formatQty(item.currentQty, item.unit)} on hand, reorder at {formatQty(item.activeReorderLevel, item.unit)}.
                      </p>
                    </div>
                  ))
              ) : (
                <p className="text-sm text-slate-500">No low-stock alerts on current assumptions.</p>
              )}
            </div>
          </section>
        </aside>

        <section className="space-y-5">
          <div className="grid gap-3 lg:grid-cols-4">
            <MetricCard label="Current inventory value" value={formatUGX(totalStockValue, true)} tone="navy" />
            <MetricCard label="Monthly usage value" value={formatUGX(monthlyUsageValue, true)} tone="green" />
            <MetricCard label="Daily consumption value" value={formatUGX(totalDailyConsumptionValue, true)} tone="amber" />
            <MetricCard label="Low-stock alerts" value={String(lowStockCount)} tone={lowStockCount ? "clay" : "green"} />
          </div>

          <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-sm font-semibold text-factory-navy">Current Inventory</h2>
                <p className="text-xs text-slate-500">Weighted-average valuation, UGX only.</p>
              </div>
              <label className="grid gap-1 text-xs font-semibold text-slate-600">
                Monthly usage report
                <input
                  type="month"
                  value={activeMonth}
                  onChange={(event) => setActiveMonth(event.target.value)}
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm font-normal outline-none focus:border-factory-green focus:ring-2 focus:ring-factory-green/20"
                />
              </label>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-[1240px] w-full border-separate border-spacing-0 text-left text-sm">
                <thead>
                  <tr className="bg-factory-navy text-white">
                    <Th>Material</Th>
                    <Th>Current stock</Th>
                    <Th>Stock value</Th>
                    <Th>Daily consumption</Th>
                    <Th>Days remaining</Th>
                    <Th>Reorder level</Th>
                    <Th>Suggested reorder</Th>
                    <Th>Status</Th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.map((item, index) => (
                    <tr key={item.id} className={index % 2 ? "bg-white" : "bg-slate-50/70"}>
                      <Td>
                        <div className="font-semibold text-factory-navy">{item.name}</div>
                        <div className="text-xs text-slate-500">{item.unit}</div>
                      </Td>
                      <Td>{formatQty(item.currentQty, item.unit)}</Td>
                      <Td>{formatUGX(item.stockValue, true)}</Td>
                      <Td>{formatQty(item.dailyConsumption, item.unit)}/day</Td>
                      <Td>{Number.isFinite(item.daysRemaining) ? `${item.daysRemaining.toFixed(1)} days` : "No usage"}</Td>
                      <Td>
                        <EditableNumber value={item.reorderLevel} onChange={(value) => updateItemSetting(item.id, "reorderLevel", value)} />
                      </Td>
                      <Td>{formatQty(item.reorderQty, item.unit)}</Td>
                      <Td>
                        <StatusBadge status={item.status} />
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="grid gap-5 2xl:grid-cols-2">
            <ChartPanel title="Stock Value by Material">
              <ResponsiveContainer width="100%" height={305}>
                <BarChart data={stockChart} margin={{ top: 12, right: 16, left: 0, bottom: 48 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#d8dee4" />
                  <XAxis dataKey="name" angle={-28} textAnchor="end" interval={0} height={76} tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={(value) => `${Math.round(value / 1_000_000)}m`} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value) => formatUGX(value, true)} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {stockChart.map((entry, index) => (
                      <Cell key={entry.name} fill={entry.status === "Reorder" ? "#a44a3f" : colors[index % colors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartPanel>

            <ChartPanel title="Top Consumed Materials">
              <ResponsiveContainer width="100%" height={305}>
                <BarChart data={consumptionChart} margin={{ top: 12, right: 16, left: 0, bottom: 42 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#d8dee4" />
                  <XAxis dataKey="name" angle={-25} textAnchor="end" interval={0} height={70} tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={(value) => `${Math.round(value / 1_000_000)}m`} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value, name) => (name === "quantity" ? value.toLocaleString("en-UG") : formatUGX(value, true))} />
                  <Legend />
                  <Bar dataKey="value" name="Usage value" fill="#2f7d5b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartPanel>

            <ChartPanel title="Days of Stock Remaining">
              <ResponsiveContainer width="100%" height={305}>
                <BarChart data={daysChart} margin={{ top: 12, right: 16, left: 0, bottom: 48 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#d8dee4" />
                  <XAxis dataKey="name" angle={-28} textAnchor="end" interval={0} height={76} tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value) => `${value} days`} />
                  <Bar dataKey="days" fill="#3b6ea8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartPanel>

            <ChartPanel title="Inventory Value Mix">
              <ResponsiveContainer width="100%" height={305}>
                <PieChart>
                  <Pie data={stockChart} dataKey="value" nameKey="name" innerRadius={72} outerRadius={112} paddingAngle={2}>
                    {stockChart.map((entry, index) => (
                      <Cell key={entry.name} fill={colors[index % colors.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatUGX(value, true)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartPanel>
          </section>

          <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-factory-navy">
              <ClipboardList size={18} />
              Monthly Usage Report
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-[1120px] w-full border-separate border-spacing-0 text-left text-sm">
                <thead>
                  <tr className="bg-factory-green text-white">
                    <Th>Material</Th>
                    <Th>Received</Th>
                    <Th>Issued to production</Th>
                    <Th>Usage value</Th>
                    <Th>Delivery cost</Th>
                    <Th>Calculated reorder level</Th>
                    <Th>Lead time</Th>
                    <Th>Safety stock</Th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyReport.map((item, index) => (
                    <tr key={item.id} className={index % 2 ? "bg-white" : "bg-slate-50/70"}>
                      <Td>{item.name}</Td>
                      <Td>{formatQty(item.monthReceivedQty, item.unit)}</Td>
                      <Td>{formatQty(item.monthIssuedQty, item.unit)}</Td>
                      <Td>{formatUGX(item.usageValue, true)}</Td>
                      <Td>{formatUGX(item.monthDeliveryCost, true)}</Td>
                      <Td>{formatQty(item.calculatedReorderLevel, item.unit)}</Td>
                      <Td>
                        <EditableNumber value={item.leadTimeDays} onChange={(value) => updateItemSetting(item.id, "leadTimeDays", value)} />
                      </Td>
                      <Td>
                        <EditableNumber
                          value={item.safetyStockDays}
                          onChange={(value) => updateItemSetting(item.id, "safetyStockDays", value)}
                        />
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-factory-navy">
              <Truck size={18} />
              Recent Stock Movements
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-[1100px] w-full border-separate border-spacing-0 text-left text-sm">
                <thead>
                  <tr className="bg-factory-navy text-white">
                    <Th>Date</Th>
                    <Th>Type</Th>
                    <Th>Material</Th>
                    <Th>Quantity</Th>
                    <Th>Supplier / production</Th>
                    <Th>Truck</Th>
                    <Th>Cost</Th>
                    <Th>Notes</Th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.slice(0, 20).map((tx, index) => {
                    const item = inventory.find((entry) => entry.id === tx.itemId);
                    return (
                      <tr key={tx.id} className={index % 2 ? "bg-white" : "bg-slate-50/70"}>
                        <Td>{tx.date}</Td>
                        <Td>
                          <span className={tx.type === "receipt" ? "font-semibold text-factory-green" : "font-semibold text-factory-amber"}>
                            {tx.type === "receipt" ? "Add stock" : "Issue"}
                          </span>
                        </Td>
                        <Td>{item?.name}</Td>
                        <Td>{formatQty(tx.quantity, item?.unit || "")}</Td>
                        <Td>{tx.type === "receipt" ? tx.supplierName : tx.productionArea}</Td>
                        <Td>{tx.truckNumber || "-"}</Td>
                        <Td>{tx.type === "receipt" ? formatUGX(tx.deliveryCost) : "-"}</Td>
                        <Td>{tx.notes || "-"}</Td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </section>
      </main>
    </div>
  );
}

function StockForm({ title, icon, onSubmit, children }) {
  return (
    <form onSubmit={onSubmit} className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-factory-navy">
        {icon}
        {title}
      </h2>
      <div className="grid gap-3">{children}</div>
      <button
        type="submit"
        className="mt-4 w-full rounded-md bg-factory-navy px-3 py-2 text-sm font-semibold text-white hover:bg-[#102638]"
      >
        Save transaction
      </button>
    </form>
  );
}

function SelectField({ label, value, onChange }) {
  return (
    <label className="grid gap-1">
      <span className="text-xs font-medium text-slate-600">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-factory-green focus:ring-2 focus:ring-factory-green/20"
      >
        {inventoryItems.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name} ({item.unit})
          </option>
        ))}
      </select>
    </label>
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
        {suffix ? <span className="flex items-center border-l border-slate-200 bg-slate-50 px-2 text-xs font-semibold text-slate-500">{suffix}</span> : null}
      </div>
    </label>
  );
}

function EditableNumber({ value, onChange }) {
  return (
    <input
      type="number"
      value={Number.isFinite(value) ? Number(value.toFixed ? value.toFixed(2) : value) : 0}
      onChange={(event) => onChange(event.target.value)}
      className="w-24 rounded-md border border-slate-300 bg-white px-2 py-1.5 text-right text-sm outline-none focus:border-factory-green focus:ring-2 focus:ring-factory-green/20"
    />
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
    status === "OK"
      ? "bg-green-50 text-factory-green ring-green-200"
      : status === "Watch"
        ? "bg-amber-50 text-factory-amber ring-amber-200"
        : "bg-red-50 text-factory-clay ring-red-200";
  return <span className={`inline-flex rounded px-2 py-1 text-xs font-bold ring-1 ${cls}`}>{status}</span>;
}

function Th({ children }) {
  return <th className="border-b border-white/10 px-3 py-3 text-xs font-semibold">{children}</th>;
}

function Td({ children }) {
  return <td className="border-b border-slate-200 px-3 py-3 align-middle text-sm">{children}</td>;
}

function downloadBlob(content, fileName, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default App;
