import type { Dispatch, SetStateAction } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartCard } from "../components/common/ChartCard";
import { DataTable } from "../components/common/DataTable";
import { TextInput } from "../components/common/FormControls";
import { MetricCard } from "../components/common/MetricCard";
import { Panel } from "../components/common/Panel";
import type { AppState } from "../types";
import type { ErpComputed } from "../lib/calculations";
import { formatUGX, numberFormat } from "../lib/calculations";

export function FinancialModule({
  state,
  setState,
  erp,
}: {
  state: AppState;
  setState: Dispatch<SetStateAction<AppState>>;
  erp: ErpComputed;
}) {
  const assumptions = state.financialAssumptions;

  function updateAssumption(key: keyof typeof assumptions, value: string) {
    setState((current) => ({
      ...current,
      financialAssumptions: {
        ...current.financialAssumptions,
        [key]: Number(value) || 0,
      },
    }));
  }

  function updateProduct(productId: string, key: "plannedPriceUgx" | "targetDailyVolume", value: string) {
    setState((current) => ({
      ...current,
      products: current.products.map((product) => (product.id === productId ? { ...product, [key]: Number(value) || 0 } : product)),
    }));
  }

  return (
    <>
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Monthly revenue" value={formatUGX(erp.financials.revenueUgx, true)} tone="navy" />
        <MetricCard label="Gross profit" value={formatUGX(erp.financials.grossProfitUgx, true)} tone="green" />
        <MetricCard label="Net profit" value={formatUGX(erp.financials.netProfitUgx, true)} tone={erp.financials.targetReached ? "green" : "amber"} />
        <MetricCard label="ROI estimate" value={`${(erp.financials.roiEstimate * 100).toFixed(1)}%`} tone="blue" />
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Starter budget" value={formatUGX(erp.financials.starterBudgetUgx, true)} tone="navy" />
        <MetricCard label="Phase 1 startup cost" value={formatUGX(erp.financials.phaseOneStartupCostUgx, true)} tone="blue" />
        <MetricCard label="Budget buffer" value={formatUGX(erp.financials.budgetSurplusUgx, true)} tone={erp.financials.budgetFeasible ? "green" : "clay"} />
        <MetricCard label="Break-even revenue" value={formatUGX(erp.financials.breakEvenRevenueUgx, true)} tone="amber" />
      </section>

      <Panel title="Editable Financial Assumptions">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <TextInput label="Starter budget" value={assumptions.starterBudgetUgx} onChange={(value) => updateAssumption("starterBudgetUgx", value)} suffix="UGX" />
          <TextInput label="Phase 1 startup cost" value={assumptions.phaseOneStartupCostUgx} onChange={(value) => updateAssumption("phaseOneStartupCostUgx", value)} suffix="UGX" />
          <TextInput label="Cement price per 50 kg bag" value={assumptions.cementBagPriceUgx} onChange={(value) => updateAssumption("cementBagPriceUgx", value)} suffix="UGX" />
          <TextInput label="Stone dust price per tonne" value={assumptions.stoneDustTonnePriceUgx} onChange={(value) => updateAssumption("stoneDustTonnePriceUgx", value)} suffix="UGX" />
          <TextInput label="Sand price per tonne" value={assumptions.sandTonnePriceUgx} onChange={(value) => updateAssumption("sandTonnePriceUgx", value)} suffix="UGX" />
          <TextInput label="Aggregate price per tonne" value={assumptions.aggregateTonnePriceUgx} onChange={(value) => updateAssumption("aggregateTonnePriceUgx", value)} suffix="UGX" />
          <TextInput label="Electricity cost per kWh" value={assumptions.electricityCostPerKwhUgx} onChange={(value) => updateAssumption("electricityCostPerKwhUgx", value)} suffix="UGX" />
          <TextInput label="Water cost per m3" value={assumptions.waterCostPerM3Ugx} onChange={(value) => updateAssumption("waterCostPerM3Ugx", value)} suffix="UGX" />
          <TextInput label="Diesel price per litre" value={assumptions.dieselPricePerLitreUgx} onChange={(value) => updateAssumption("dieselPricePerLitreUgx", value)} suffix="UGX" />
          <TextInput label="Labour cost per month" value={assumptions.labourCostPerMonthUgx} onChange={(value) => updateAssumption("labourCostPerMonthUgx", value)} suffix="UGX" />
          <TextInput label="Transport cost per truck" value={assumptions.transportCostPerTruckUgx} onChange={(value) => updateAssumption("transportCostPerTruckUgx", value)} suffix="UGX" />
          <TextInput label="Working days per month" value={assumptions.workingDaysPerMonth} onChange={(value) => updateAssumption("workingDaysPerMonth", value)} />
          <TextInput label="Monthly profit target" value={assumptions.targetMonthlyProfitUgx} onChange={(value) => updateAssumption("targetMonthlyProfitUgx", value)} suffix="UGX" />
        </div>
      </Panel>

      <Panel title="Product Daily Volume and Selling Price">
        <div className="grid gap-3 xl:grid-cols-2">
          {state.products.map((product) => (
            <section key={product.id} className="rounded-md border border-slate-200 p-3">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-factory-navy">{product.name}</h3>
                <p className="text-xs text-slate-500">{product.confidenceLevel}</p>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <TextInput label="Daily production volume" value={product.targetDailyVolume} onChange={(value) => updateProduct(product.id, "targetDailyVolume", value)} />
                <TextInput label="Selling price per product" value={product.plannedPriceUgx} onChange={(value) => updateProduct(product.id, "plannedPriceUgx", value)} suffix="UGX" />
              </div>
            </section>
          ))}
        </div>
      </Panel>

      <section className="grid gap-5 2xl:grid-cols-2">
        <ChartCard title="Revenue by Product">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={erp.financials.productRevenue} margin={{ top: 14, right: 16, left: 0, bottom: 70 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d8dee4" />
              <XAxis dataKey="name" angle={-28} textAnchor="end" interval={0} height={88} tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(value) => `${Math.round(Number(value) / 1_000_000)}m`} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(value) => formatUGX(Number(value))} />
              <Bar dataKey="revenue" name="Revenue" fill="#3b6ea8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Profit by Product">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={erp.financials.productProfit} margin={{ top: 14, right: 16, left: 0, bottom: 70 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d8dee4" />
              <XAxis dataKey="name" angle={-28} textAnchor="end" interval={0} height={88} tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(value) => `${Math.round(Number(value) / 1_000_000)}m`} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(value) => formatUGX(Number(value))} />
              <Bar dataKey="profit" name="Profit" fill="#2f7d5b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Cost Breakdown">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={erp.financials.productCosts.slice(0, 8)} margin={{ top: 14, right: 16, left: 0, bottom: 70 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d8dee4" />
              <XAxis dataKey="productName" angle={-28} textAnchor="end" interval={0} height={88} tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(value) => formatUGX(Number(value))} />
              <Legend />
              <Bar dataKey="materialCost" name="Material" stackId="a" fill="#17324d" />
              <Bar dataKey="utilityCost" name="Utility" stackId="a" fill="#b7842f" />
              <Bar dataKey="labourPerUnit" name="Labour" stackId="a" fill="#2f7d5b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Monthly Profit Projection">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={erp.financials.monthlyProfitProjection} margin={{ top: 14, right: 16, left: 0, bottom: 12 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d8dee4" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(value) => `${Math.round(Number(value) / 1_000_000)}m`} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(value) => formatUGX(Number(value))} />
              <Legend />
              <Bar dataKey="revenue" name="Revenue" fill="#3b6ea8" />
              <Bar dataKey="netProfit" name="Net profit" fill="#2f7d5b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>

      <Panel title="Product Costing Table">
        <DataTable
          headers={["Product", "Unit cost", "Material", "Utility", "Labour", "Selling price", "Margin", "Margin %"]}
          rows={erp.financials.productCosts.map((row) => [
            row.productName,
            formatUGX(row.unitCostUgx),
            formatUGX(row.materialCost),
            formatUGX(row.utilityCost),
            formatUGX(row.labourPerUnit),
            formatUGX(row.plannedPriceUgx),
            formatUGX(row.marginUgx),
            `${numberFormat(row.marginPct * 100)}%`,
          ])}
        />
      </Panel>
    </>
  );
}
