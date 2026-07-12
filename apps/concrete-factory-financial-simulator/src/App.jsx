import React, { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Calculator,
  Download,
  FileSpreadsheet,
  FileText,
  Gauge,
  RotateCcw,
  TrendingUp,
} from "lucide-react";

const STORAGE_KEY = "mbarara-concrete-factory-simulator-v1";
const MONTHLY_PROFIT_TARGET = 20_000_000;

const defaultAssumptions = {
  cementBagPrice: 38_000,
  stoneDustTonnePrice: 72_000,
  sandTonnePrice: 85_000,
  aggregateTonnePrice: 98_000,
  electricityKwhPrice: 780,
  waterM3Price: 4_200,
  dieselLitrePrice: 5_450,
  labourMonthlyCost: 24_000_000,
  transportTruckCost: 350_000,
  workingDays: 26,
  investedCapital: 34_100_000_000,
  monthlyVolumeGrowth: 1.5,
};

const defaultProducts = [
  {
    id: "six-inch-hollow-blocks",
    name: "6-inch hollow blocks",
    unit: "unit",
    dailyVolume: 4_300,
    sellingPrice: 2_600,
    cementBags: 0.019,
    stoneDustKg: 7.2,
    sandKg: 4.8,
    aggregateKg: 4.0,
    electricityKwh: 0.012,
    waterM3: 0.0011,
    dieselLitres: 0.0015,
    truckCapacity: 1_600,
  },
  {
    id: "eight-inch-hollow-blocks",
    name: "8-inch hollow blocks",
    unit: "unit",
    dailyVolume: 3_300,
    sellingPrice: 3_400,
    cementBags: 0.026,
    stoneDustKg: 9.0,
    sandKg: 6.0,
    aggregateKg: 6.0,
    electricityKwh: 0.015,
    waterM3: 0.0014,
    dieselLitres: 0.0018,
    truckCapacity: 1_150,
  },
  {
    id: "solid-blocks",
    name: "solid blocks",
    unit: "unit",
    dailyVolume: 2_100,
    sellingPrice: 3_800,
    cementBags: 0.031,
    stoneDustKg: 8.0,
    sandKg: 7.5,
    aggregateKg: 12.0,
    electricityKwh: 0.018,
    waterM3: 0.0018,
    dieselLitres: 0.002,
    truckCapacity: 900,
  },
  {
    id: "sixty-mm-pavers",
    name: "60 mm pavers",
    unit: "m²",
    dailyVolume: 780,
    sellingPrice: 43_000,
    cementBags: 0.28,
    stoneDustKg: 42.0,
    sandKg: 25.0,
    aggregateKg: 35.0,
    electricityKwh: 0.08,
    waterM3: 0.018,
    dieselLitres: 0.011,
    truckCapacity: 320,
  },
  {
    id: "eighty-mm-pavers",
    name: "80 mm pavers",
    unit: "m²",
    dailyVolume: 540,
    sellingPrice: 58_000,
    cementBags: 0.38,
    stoneDustKg: 56.0,
    sandKg: 30.0,
    aggregateKg: 48.0,
    electricityKwh: 0.11,
    waterM3: 0.024,
    dieselLitres: 0.014,
    truckCapacity: 240,
  },
  {
    id: "kerbstones",
    name: "kerbstones",
    unit: "unit",
    dailyVolume: 560,
    sellingPrice: 23_500,
    cementBags: 0.16,
    stoneDustKg: 35.0,
    sandKg: 20.0,
    aggregateKg: 50.0,
    electricityKwh: 0.075,
    waterM3: 0.012,
    dieselLitres: 0.012,
    truckCapacity: 260,
  },
  {
    id: "drainage-channels",
    name: "drainage channels",
    unit: "unit",
    dailyVolume: 95,
    sellingPrice: 115_000,
    cementBags: 0.8,
    stoneDustKg: 150.0,
    sandKg: 80.0,
    aggregateKg: 220.0,
    electricityKwh: 0.22,
    waterM3: 0.055,
    dieselLitres: 0.04,
    truckCapacity: 42,
  },
  {
    id: "culverts",
    name: "culverts",
    unit: "unit",
    dailyVolume: 25,
    sellingPrice: 420_000,
    cementBags: 3.2,
    stoneDustKg: 650.0,
    sandKg: 300.0,
    aggregateKg: 900.0,
    electricityKwh: 0.85,
    waterM3: 0.18,
    dieselLitres: 0.14,
    truckCapacity: 8,
  },
];

const chartColors = [
  "#2f7d5b",
  "#3b6ea8",
  "#bd8b32",
  "#a24b3d",
  "#5d7182",
  "#6f5ea8",
  "#4f8f96",
  "#7a6b45",
];

function formatUGX(value, compact = false) {
  const safe = Number.isFinite(value) ? value : 0;
  if (compact && Math.abs(safe) >= 1_000_000_000) {
    return `UGX ${(safe / 1_000_000_000).toFixed(2)} bn`;
  }
  if (compact && Math.abs(safe) >= 1_000_000) {
    return `UGX ${(safe / 1_000_000).toFixed(1)} m`;
  }
  return `UGX ${safe.toLocaleString("en-UG", { maximumFractionDigits: 0 })}`;
}

function formatNumber(value, decimals = 0) {
  const safe = Number.isFinite(value) ? value : 0;
  return safe.toLocaleString("en-UG", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function asNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function calculateProduct(product, assumptions, labourAllocation = 0) {
  const workingDays = Math.max(0, assumptions.workingDays);
  const monthlyUnits = product.dailyVolume * workingDays;
  const cementCost = product.cementBags * assumptions.cementBagPrice * monthlyUnits;
  const stoneDustCost = (product.stoneDustKg / 1000) * assumptions.stoneDustTonnePrice * monthlyUnits;
  const sandCost = (product.sandKg / 1000) * assumptions.sandTonnePrice * monthlyUnits;
  const aggregateCost = (product.aggregateKg / 1000) * assumptions.aggregateTonnePrice * monthlyUnits;
  const materialCost = cementCost + stoneDustCost + sandCost + aggregateCost;
  const electricityCost = product.electricityKwh * assumptions.electricityKwhPrice * monthlyUnits;
  const waterCost = product.waterM3 * assumptions.waterM3Price * monthlyUnits;
  const dieselCost = product.dieselLitres * assumptions.dieselLitrePrice * monthlyUnits;
  const utilityCost = electricityCost + waterCost + dieselCost;
  const truckCapacity = Math.max(1, product.truckCapacity);
  const truckLoads = Math.ceil(monthlyUnits / truckCapacity);
  const transportCost = truckLoads * assumptions.transportTruckCost;
  const revenue = monthlyUnits * product.sellingPrice;
  const variableCost = materialCost + utilityCost + transportCost;
  const unitMaterialCost = monthlyUnits ? materialCost / monthlyUnits : 0;
  const unitUtilityCost = monthlyUnits ? utilityCost / monthlyUnits : 0;
  const unitTransportCost = monthlyUnits ? transportCost / monthlyUnits : 0;
  const unitCostBeforeLabour = unitMaterialCost + unitUtilityCost + unitTransportCost;
  const totalCost = variableCost + labourAllocation;
  const unitCost = monthlyUnits ? totalCost / monthlyUnits : unitCostBeforeLabour;
  const grossProfit = revenue - variableCost;
  const netProfit = revenue - totalCost;

  return {
    ...product,
    monthlyUnits,
    cementCost,
    stoneDustCost,
    sandCost,
    aggregateCost,
    materialCost,
    electricityCost,
    waterCost,
    dieselCost,
    utilityCost,
    transportCost,
    truckLoads,
    revenue,
    variableCost,
    labourAllocation,
    totalCost,
    unitMaterialCost,
    unitUtilityCost,
    unitTransportCost,
    unitCost,
    unitCostBeforeLabour,
    grossProfit,
    netProfit,
    grossMargin: revenue ? grossProfit / revenue : 0,
    netMargin: revenue ? netProfit / revenue : 0,
  };
}

function buildModel(assumptions, products) {
  const firstPass = products.map((product) => calculateProduct(product, assumptions, 0));
  const totalRevenue = firstPass.reduce((sum, product) => sum + product.revenue, 0);
  const productsWithLabour = products.map((product) => {
    const revenue = product.dailyVolume * assumptions.workingDays * product.sellingPrice;
    const labourAllocation = totalRevenue ? assumptions.labourMonthlyCost * (revenue / totalRevenue) : 0;
    return calculateProduct(product, assumptions, labourAllocation);
  });

  const totals = productsWithLabour.reduce(
    (sum, product) => {
      sum.revenue += product.revenue;
      sum.materialCost += product.materialCost;
      sum.utilityCost += product.utilityCost;
      sum.transportCost += product.transportCost;
      sum.variableCost += product.variableCost;
      sum.grossProfit += product.grossProfit;
      sum.netProfit += product.netProfit;
      sum.monthlyUnits += product.monthlyUnits;
      return sum;
    },
    {
      revenue: 0,
      materialCost: 0,
      utilityCost: 0,
      transportCost: 0,
      variableCost: 0,
      grossProfit: 0,
      netProfit: 0,
      monthlyUnits: 0,
    }
  );

  totals.labourCost = assumptions.labourMonthlyCost;
  totals.netProfit = totals.grossProfit - totals.labourCost;
  totals.grossMargin = totals.revenue ? totals.grossProfit / totals.revenue : 0;
  totals.netMargin = totals.revenue ? totals.netProfit / totals.revenue : 0;
  totals.contributionMargin = totals.revenue ? (totals.revenue - totals.variableCost) / totals.revenue : 0;
  totals.breakEvenRevenue =
    totals.contributionMargin > 0 ? assumptions.labourMonthlyCost / totals.contributionMargin : Infinity;
  totals.breakEvenUtilization = totals.revenue ? totals.breakEvenRevenue / totals.revenue : 0;
  totals.breakEvenDays =
    totals.revenue && assumptions.workingDays
      ? totals.breakEvenRevenue / (totals.revenue / assumptions.workingDays)
      : 0;
  totals.roi = assumptions.investedCapital > 0 ? (totals.netProfit * 12) / assumptions.investedCapital : 0;
  totals.targetReached = totals.netProfit >= MONTHLY_PROFIT_TARGET;

  const growthRate = assumptions.monthlyVolumeGrowth / 100;
  const projection = Array.from({ length: 12 }, (_, index) => {
    const factor = Math.pow(1 + growthRate, index);
    const revenue = totals.revenue * factor;
    const variableCost = totals.variableCost * factor;
    const netProfit = revenue - variableCost - totals.labourCost;
    return {
      month: `M${index + 1}`,
      revenue,
      netProfit,
      target: MONTHLY_PROFIT_TARGET,
    };
  });

  return { products: productsWithLabour, totals, projection };
}

const inputGroups = [
  {
    title: "Material Prices",
    fields: [
      ["cementBagPrice", "Cement price per 50 kg bag", "UGX/bag"],
      ["stoneDustTonnePrice", "Stone dust price per tonne", "UGX/t"],
      ["sandTonnePrice", "Sand price per tonne", "UGX/t"],
      ["aggregateTonnePrice", "Aggregate price per tonne", "UGX/t"],
    ],
  },
  {
    title: "Utilities and Logistics",
    fields: [
      ["electricityKwhPrice", "Electricity cost per kWh", "UGX/kWh"],
      ["waterM3Price", "Water cost per m³", "UGX/m³"],
      ["dieselLitrePrice", "Diesel price per litre", "UGX/litre"],
      ["transportTruckCost", "Transport cost per truck", "UGX/truck"],
    ],
  },
  {
    title: "Operating Assumptions",
    fields: [
      ["labourMonthlyCost", "Labour cost per month", "UGX/month"],
      ["workingDays", "Working days per month", "days"],
      ["investedCapital", "Invested capital estimate", "UGX"],
      ["monthlyVolumeGrowth", "Monthly projection growth", "%"],
    ],
  },
];

function App() {
  const [assumptions, setAssumptions] = useState(defaultAssumptions);
  const [products, setProducts] = useState(defaultProducts);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved);
      setAssumptions({ ...defaultAssumptions, ...parsed.assumptions });
      setProducts(
        defaultProducts.map((product) => ({
          ...product,
          ...(parsed.products || []).find((item) => item.id === product.id),
        }))
      );
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ assumptions, products }));
  }, [assumptions, products]);

  const model = useMemo(() => buildModel(assumptions, products), [assumptions, products]);
  const productChartData = model.products.map((product) => ({
    name: product.name.replace(" hollow", ""),
    revenue: Math.round(product.revenue),
    profit: Math.round(product.netProfit),
    margin: product.netMargin,
  }));
  const costBreakdown = [
    { name: "Materials", value: model.totals.materialCost },
    { name: "Utilities", value: model.totals.utilityCost },
    { name: "Transport", value: model.totals.transportCost },
    { name: "Labour", value: model.totals.labourCost },
  ];

  function updateAssumption(key, value) {
    setAssumptions((current) => ({ ...current, [key]: asNumber(value) }));
  }

  function updateProduct(productId, key, value) {
    setProducts((current) =>
      current.map((product) => (product.id === productId ? { ...product, [key]: asNumber(value) } : product))
    );
  }

  function resetDefaults() {
    setAssumptions(defaultAssumptions);
    setProducts(defaultProducts);
    window.localStorage.removeItem(STORAGE_KEY);
  }

  function exportCsv() {
    const summaryRows = [
      ["Mbarara Concrete Factory Financial Simulator"],
      ["Currency", "UGX only"],
      ["Monthly revenue", Math.round(model.totals.revenue)],
      ["Monthly material cost", Math.round(model.totals.materialCost)],
      ["Monthly utility cost", Math.round(model.totals.utilityCost)],
      ["Monthly labour cost", Math.round(model.totals.labourCost)],
      ["Monthly transport cost", Math.round(model.totals.transportCost)],
      ["Gross profit", Math.round(model.totals.grossProfit)],
      ["Net profit", Math.round(model.totals.netProfit)],
      ["Break-even revenue", Math.round(model.totals.breakEvenRevenue)],
      ["ROI estimate", `${(model.totals.roi * 100).toFixed(2)}%`],
      ["UGX 20,000,000 monthly profit reached", model.totals.targetReached ? "Yes" : "No"],
      [],
    ];
    const productRows = [
      [
        "Product",
        "Monthly volume",
        "Selling price",
        "Unit cost",
        "Revenue",
        "Material cost",
        "Utility cost",
        "Transport cost",
        "Allocated labour",
        "Net profit",
      ],
      ...model.products.map((product) => [
        product.name,
        Math.round(product.monthlyUnits),
        Math.round(product.sellingPrice),
        Math.round(product.unitCost),
        Math.round(product.revenue),
        Math.round(product.materialCost),
        Math.round(product.utilityCost),
        Math.round(product.transportCost),
        Math.round(product.labourAllocation),
        Math.round(product.netProfit),
      ]),
    ];
    const csv = [...summaryRows, ...productRows]
      .map((row) => row.map((item) => `"${String(item ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");
    downloadBlob(csv, "mbarara-concrete-factory-simulator.csv", "text/csv;charset=utf-8;");
  }

  function exportPdf() {
    const pdf = createSimplePdf((addLine) => {
      addLine("Mbarara Concrete Factory Financial Simulator", 42, 15, 22);
      addLine("Currency: UGX only", 42, 9, 24);
      addLine("Summary", 42, 11, 16);
  
    const summary = [
      ["Monthly revenue", formatUGX(model.totals.revenue)],
      ["Monthly material cost", formatUGX(model.totals.materialCost)],
      ["Monthly utility cost", formatUGX(model.totals.utilityCost)],
      ["Monthly labour cost", formatUGX(model.totals.labourCost)],
      ["Monthly transport cost", formatUGX(model.totals.transportCost)],
      ["Gross profit", formatUGX(model.totals.grossProfit)],
      ["Net profit", formatUGX(model.totals.netProfit)],
      ["Break-even revenue", formatUGX(model.totals.breakEvenRevenue)],
      ["Break-even days", `${model.totals.breakEvenDays.toFixed(1)} days/month`],
      ["ROI estimate", `${(model.totals.roi * 100).toFixed(2)}% per year`],
      ["Target reached", model.totals.targetReached ? "Yes" : "No"],
    ];
      summary.forEach(([label, value]) => {
        addLine(label, 42, 8.5, 0);
        addLine(value, 305, 8.5, 13);
      });
  
      addLine("", 42, 8, 10);
      addLine("Product Results", 42, 11, 16);
      addLine("Product", 42, 7.5, 0);
      addLine("Revenue", 185, 7.5, 0);
      addLine("Unit cost", 280, 7.5, 0);
      addLine("Net profit", 365, 7.5, 0);
      addLine("Margin", 465, 7.5, 13);
      model.products.forEach((product) => {
        addLine(product.name, 42, 7.5, 0);
        addLine(formatUGX(product.revenue, true), 185, 7.5, 0);
        addLine(formatUGX(product.unitCost), 280, 7.5, 0);
        addLine(formatUGX(product.netProfit, true), 365, 7.5, 0);
        addLine(`${(product.netMargin * 100).toFixed(1)}%`, 465, 7.5, 13);
      });
    });
    downloadBlob(pdf, "mbarara-concrete-factory-simulator-summary.pdf", "application/pdf");
  }

  return (
    <div className="min-h-screen bg-[#eef2f4] text-ink">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1540px] flex-col gap-4 px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-md bg-factory-navy text-white">
              <Calculator size={23} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-factory-green">Mbarara, Uganda</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-normal text-factory-navy">
                Concrete Factory Financial Simulator
              </h1>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 no-print">
            <button
              type="button"
              onClick={exportCsv}
              className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-factory-navy shadow-sm hover:bg-slate-50"
            >
              <FileSpreadsheet size={17} />
              CSV export
            </button>
            <button
              type="button"
              onClick={exportPdf}
              className="inline-flex items-center gap-2 rounded-md bg-factory-green px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#286d50]"
            >
              <FileText size={17} />
              PDF summary export
            </button>
            <button
              type="button"
              onClick={resetDefaults}
              className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              <RotateCcw size={17} />
              Reset
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1540px] gap-5 px-5 py-5 xl:grid-cols-[410px_1fr]">
        <aside className="space-y-4">
          {inputGroups.map((group) => (
            <section key={group.title} className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-factory-navy">{group.title}</h2>
              <div className="mt-3 grid gap-3">
                {group.fields.map(([key, label, suffix]) => (
                  <label key={key} className="grid gap-1">
                    <span className="text-xs font-medium text-slate-600">{label}</span>
                    <div className="flex overflow-hidden rounded-md border border-slate-300 bg-white focus-within:border-factory-green focus-within:ring-2 focus-within:ring-factory-green/20">
                      <input
                        type="number"
                        value={assumptions[key]}
                        onChange={(event) => updateAssumption(key, event.target.value)}
                        className="min-w-0 flex-1 border-0 px-3 py-2 text-sm outline-none"
                      />
                      <span className="flex items-center border-l border-slate-200 bg-slate-50 px-2 text-[11px] font-semibold text-slate-500">
                        {suffix}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            </section>
          ))}
        </aside>

        <section className="space-y-5">
          <div className="grid gap-3 lg:grid-cols-4">
            <MetricCard
              label="Monthly revenue"
              value={formatUGX(model.totals.revenue, true)}
              tone="green"
              icon={<TrendingUp size={18} />}
            />
            <MetricCard label="Net profit" value={formatUGX(model.totals.netProfit, true)} tone="navy" icon={<Gauge size={18} />} />
            <MetricCard
              label="Break-even revenue"
              value={formatUGX(model.totals.breakEvenRevenue, true)}
              tone="amber"
              icon={<Calculator size={18} />}
            />
            <MetricCard
              label="UGX 20m/month target"
              value={model.totals.targetReached ? "Reached" : "Not reached"}
              detail={`${formatUGX(model.totals.netProfit - MONTHLY_PROFIT_TARGET, true)} variance`}
              tone={model.totals.targetReached ? "green" : "clay"}
              icon={<Download size={18} />}
            />
          </div>

          <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
            <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
              <SmallStat label="Material cost" value={formatUGX(model.totals.materialCost, true)} />
              <SmallStat label="Utility cost" value={formatUGX(model.totals.utilityCost, true)} />
              <SmallStat label="Labour cost" value={formatUGX(model.totals.labourCost, true)} />
              <SmallStat label="Gross profit" value={formatUGX(model.totals.grossProfit, true)} />
              <SmallStat label="ROI estimate" value={`${(model.totals.roi * 100).toFixed(1)}%/yr`} />
              <SmallStat label="Break-even days" value={`${model.totals.breakEvenDays.toFixed(1)}`} />
            </div>
          </section>

          <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-sm font-semibold text-factory-navy">Product Inputs and Cost Results</h2>
                <p className="text-xs text-slate-500">Daily production and selling prices are editable by product.</p>
              </div>
              <p className="text-xs font-semibold text-slate-500">Currency: UGX only</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-[1180px] w-full border-separate border-spacing-0 text-left text-sm">
                <thead>
                  <tr className="bg-factory-navy text-white">
                    <Th>Product</Th>
                    <Th>Daily volume</Th>
                    <Th>Selling price</Th>
                    <Th>Unit cost</Th>
                    <Th>Monthly revenue</Th>
                    <Th>Material cost</Th>
                    <Th>Utility cost</Th>
                    <Th>Gross profit</Th>
                    <Th>Net profit</Th>
                  </tr>
                </thead>
                <tbody>
                  {model.products.map((product, index) => (
                    <tr key={product.id} className={index % 2 ? "bg-white" : "bg-slate-50/70"}>
                      <Td>
                        <div className="font-semibold text-factory-navy">{product.name}</div>
                        <div className="text-xs text-slate-500">per {product.unit}</div>
                      </Td>
                      <Td>
                        <NumberInput
                          value={product.dailyVolume}
                          onChange={(value) => updateProduct(product.id, "dailyVolume", value)}
                        />
                      </Td>
                      <Td>
                        <NumberInput
                          value={product.sellingPrice}
                          onChange={(value) => updateProduct(product.id, "sellingPrice", value)}
                        />
                      </Td>
                      <Td>{formatUGX(product.unitCost)}</Td>
                      <Td>{formatUGX(product.revenue, true)}</Td>
                      <Td>{formatUGX(product.materialCost, true)}</Td>
                      <Td>{formatUGX(product.utilityCost, true)}</Td>
                      <Td>{formatUGX(product.grossProfit, true)}</Td>
                      <Td>
                        <span className={product.netProfit >= 0 ? "font-semibold text-factory-green" : "font-semibold text-factory-clay"}>
                          {formatUGX(product.netProfit, true)}
                        </span>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="grid gap-5 2xl:grid-cols-2">
            <ChartPanel title="Revenue by Product">
              <ResponsiveContainer width="100%" height={310}>
                <BarChart data={productChartData} margin={{ top: 12, right: 18, left: 0, bottom: 42 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#d8dee4" />
                  <XAxis dataKey="name" angle={-28} textAnchor="end" interval={0} height={70} tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={(value) => `${Math.round(value / 1_000_000)}m`} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value) => formatUGX(value, true)} />
                  <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                    {productChartData.map((_, index) => (
                      <Cell key={index} fill={chartColors[index % chartColors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartPanel>

            <ChartPanel title="Profit by Product">
              <ResponsiveContainer width="100%" height={310}>
                <ComposedChart data={productChartData} margin={{ top: 12, right: 18, left: 0, bottom: 42 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#d8dee4" />
                  <XAxis dataKey="name" angle={-28} textAnchor="end" interval={0} height={70} tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={(value) => `${Math.round(value / 1_000_000)}m`} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value, name) => (name === "margin" ? `${(value * 100).toFixed(1)}%` : formatUGX(value, true))} />
                  <Legend />
                  <Bar dataKey="profit" name="Net profit" fill="#2f7d5b" radius={[4, 4, 0, 0]} />
                  <Line dataKey="margin" name="Net margin" stroke="#bd8b32" strokeWidth={2} dot={false} yAxisId={0} />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartPanel>

            <ChartPanel title="Cost Breakdown">
              <ResponsiveContainer width="100%" height={310}>
                <PieChart>
                  <Pie
                    data={costBreakdown}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={70}
                    outerRadius={112}
                    paddingAngle={2}
                  >
                    {costBreakdown.map((_, index) => (
                      <Cell key={index} fill={chartColors[index % chartColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatUGX(value, true)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartPanel>

            <ChartPanel title="Monthly Profit Projection">
              <ResponsiveContainer width="100%" height={310}>
                <AreaChart data={model.projection} margin={{ top: 12, right: 18, left: 0, bottom: 8 }}>
                  <defs>
                    <linearGradient id="profitFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2f7d5b" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#2f7d5b" stopOpacity={0.04} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#d8dee4" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={(value) => `${Math.round(value / 1_000_000)}m`} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value) => formatUGX(value, true)} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="netProfit"
                    name="Net profit"
                    stroke="#2f7d5b"
                    fill="url(#profitFill)"
                    strokeWidth={2}
                  />
                  <Line dataKey="target" name="UGX 20m target" stroke="#a24b3d" strokeDasharray="6 4" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartPanel>
          </section>
        </section>
      </main>
    </div>
  );
}

function MetricCard({ label, value, detail, tone, icon }) {
  const tones = {
    green: "bg-factory-green text-white",
    navy: "bg-factory-navy text-white",
    amber: "bg-factory-amber text-white",
    clay: "bg-factory-clay text-white",
  };
  return (
    <section className={`${tones[tone]} rounded-md p-4 shadow-soft`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] opacity-80">{label}</p>
        <span className="rounded-md bg-white/15 p-2">{icon}</span>
      </div>
      <p className="mt-4 text-2xl font-semibold tracking-normal">{value}</p>
      {detail ? <p className="mt-1 text-xs opacity-80">{detail}</p> : null}
    </section>
  );
}

function SmallStat({ label, value }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-3">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-factory-navy">{value}</p>
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

function NumberInput({ value, onChange }) {
  return (
    <input
      type="number"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-32 rounded-md border border-slate-300 bg-white px-2 py-1.5 text-right text-sm outline-none focus:border-factory-green focus:ring-2 focus:ring-factory-green/20"
    />
  );
}

function Th({ children }) {
  return <th className="border-b border-factory-navy/20 px-3 py-3 text-xs font-semibold">{children}</th>;
}

function Td({ children }) {
  return <td className="border-b border-slate-200 px-3 py-3 align-middle text-sm">{children}</td>;
}

function downloadBlob(content, fileName, type) {
  const blob = content instanceof Blob ? content : new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function createSimplePdf(writeContent) {
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const pages = [[]];
  let y = 790;

  function addLine(text, x = 42, size = 9, leading = 13) {
    if (y < 48) {
      pages.push([]);
      y = 790;
    }
    const line = String(text || "").replace(/m²/g, "m2").replace(/m³/g, "m3");
    pages[pages.length - 1].push({ text: line, x, y, size });
    y -= leading;
  }

  writeContent(addLine);

  const objects = [];
  const addObject = (body) => {
    objects.push(body);
    return objects.length;
  };

  addObject("<< /Type /Catalog /Pages 2 0 R >>");
  const pageObjectIds = [];
  const contentObjectIds = [];
  const fontObjectId = 3 + pages.length * 2;

  pages.forEach((pageLines, index) => {
    const pageObjectId = 3 + index * 2;
    const contentObjectId = 4 + index * 2;
    pageObjectIds.push(pageObjectId);
    contentObjectIds.push(contentObjectId);
    const stream = pageLines
      .map(
        (line) =>
          `BT /F1 ${line.size} Tf ${line.x.toFixed(2)} ${line.y.toFixed(2)} Td (${escapePdfText(
            line.text
          )}) Tj ET`
      )
      .join("\n");
    addObject(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${fontObjectId} 0 R >> >> /Contents ${contentObjectId} 0 R >>`
    );
    addObject(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
  });

  objects.splice(
    1,
    0,
    `<< /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pages.length} >>`
  );
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((body, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  return new Blob([pdf], { type: "application/pdf" });
}

function escapePdfText(text) {
  return String(text)
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

export default App;
