import { AlertTriangle, CheckCircle2, Coins, PackageCheck } from "lucide-react";
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
import { ChartCard } from "../components/common/ChartCard";
import { DataTable } from "../components/common/DataTable";
import { MetricCard } from "../components/common/MetricCard";
import { Panel } from "../components/common/Panel";
import { deferredPhaseItems, phaseOneBudgetItems } from "../data/seedData";
import type { AppState } from "../types";
import type { ErpComputed } from "../lib/calculations";
import { formatUGX, numberFormat } from "../lib/calculations";

const colors = ["#17324d", "#2f7d5b", "#b7842f", "#a44a3f", "#3b6ea8", "#6b7280"];
const phaseOneBudgetTotal = phaseOneBudgetItems.reduce((sum, row) => sum + row.amountUgx, 0);
const essentialPhaseOneSpend = phaseOneBudgetItems
  .filter((row) => !row.item.toLowerCase().includes("buffer"))
  .reduce((sum, row) => sum + row.amountUgx, 0);

export function DashboardModule({ state, erp }: { state: AppState; erp: ErpComputed }) {
  const lowStock = erp.inventory.filter((item) => item.lowStock).length;
  const bestOpportunity = erp.market.opportunityRanking[0];

  return (
    <>
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Monthly revenue" value={formatUGX(erp.financials.revenueUgx, true)} tone="navy" icon={<Coins size={20} />} />
        <MetricCard
          label="Net profit"
          value={formatUGX(erp.financials.netProfitUgx, true)}
          tone={erp.financials.targetReached ? "green" : "amber"}
          icon={erp.financials.targetReached ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
        />
        <MetricCard label="Stock value" value={formatUGX(erp.stockValueUgx, true)} tone="blue" icon={<PackageCheck size={20} />} />
        <MetricCard label="Low-stock alerts" value={String(lowStock)} tone={lowStock ? "clay" : "green"} icon={<AlertTriangle size={20} />} />
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Starter budget" value={formatUGX(erp.financials.starterBudgetUgx, true)} tone="navy" icon={<Coins size={20} />} />
        <MetricCard label="Phase 1 essentials" value={formatUGX(erp.financials.phaseOneStartupCostUgx, true)} tone="blue" icon={<PackageCheck size={20} />} />
        <MetricCard
          label="Budget buffer"
          value={formatUGX(erp.financials.budgetSurplusUgx, true)}
          tone={erp.financials.budgetFeasible ? "green" : "clay"}
          icon={erp.financials.budgetFeasible ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
        />
        <MetricCard
          label="Budget status"
          value={erp.financials.budgetFeasible ? "Feasible" : "Over budget"}
          tone={erp.financials.budgetFeasible ? "green" : "clay"}
          icon={erp.financials.budgetFeasible ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
        />
      </section>

      <section className="grid gap-5 2xl:grid-cols-2">
        <ChartCard title="Monthly Profit Projection">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={erp.financials.monthlyProfitProjection} margin={{ top: 14, right: 20, left: 0, bottom: 12 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d8dee4" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(value) => `${Math.round(Number(value) / 1_000_000)}m`} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(value) => formatUGX(Number(value))} />
              <Legend />
              <Line type="monotone" dataKey="netProfit" name="Net profit" stroke="#2f7d5b" strokeWidth={2} />
              <Line type="monotone" dataKey="target" name="UGX 20m target" stroke="#a44a3f" strokeWidth={2} strokeDasharray="6 4" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Opportunity Score by Product">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={erp.market.opportunityRanking.slice(0, 8)} margin={{ top: 14, right: 20, left: 0, bottom: 70 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d8dee4" />
              <XAxis dataKey="productName" angle={-28} textAnchor="end" interval={0} height={88} tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="opportunityScore" name="Opportunity score" fill="#2f7d5b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Inventory Stock Value">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={erp.inventory.slice(0, 7)} margin={{ top: 14, right: 20, left: 0, bottom: 58 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d8dee4" />
              <XAxis dataKey="name" angle={-28} textAnchor="end" interval={0} height={78} tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(value) => `${Math.round(Number(value) / 1_000_000)}m`} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(value) => formatUGX(Number(value))} />
              <Bar dataKey="stockValueUgx" name="Stock value" fill="#3b6ea8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Threat Level Distribution">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={erp.market.threatDistribution} dataKey="value" nameKey="name" innerRadius={62} outerRadius={104} paddingAngle={2}>
                {erp.market.threatDistribution.map((entry, index) => (
                  <Cell key={entry.name} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel title="Investor Readout">
          <div className="space-y-3 text-sm leading-6 text-slate-700">
            <p>
              The model is now constrained to a UGX 130,000,000 Phase 1 launch. It commits{" "}
              <span className="font-semibold text-factory-navy">{formatUGX(essentialPhaseOneSpend)}</span> to essential equipment, starter moulds, site works,
              basic QC, raw materials, local sales, and working capital, while protecting a{" "}
              <span className="font-semibold text-factory-navy">{formatUGX(erp.financials.budgetSurplusUgx)}</span> cash buffer before expansion.
            </p>
            <p>
              The lean model currently indicates the UGX 20,000,000 monthly profit target is{" "}
              <span className="font-semibold text-factory-navy">{erp.financials.targetReached ? "reached" : "not yet reached"}</span> under the local
              seed assumptions. The best first commercial focus is{" "}
              <span className="font-semibold text-factory-navy">{bestOpportunity?.productName ?? "Needs verification"}</span>, subject to verified quotations.
            </p>
            <p>
              All market prices, competitor entries, and contact details marked as estimated or quotation required must be re-verified before investment
              decisions. The current dataset is structured for local operation first and PostgreSQL integration later.
            </p>
          </div>
        </Panel>

        <Panel title="Priority Product Launch Ranking">
          <DataTable
            headers={["Rank", "Product", "Score", "Signal"]}
            rows={erp.market.opportunityRanking.slice(0, 6).map((row, index) => [
              index + 1,
              row.productName,
              row.opportunityScore,
              row.opportunityScore >= 10 ? "Launch priority" : "Validate demand",
            ])}
          />
        </Panel>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <Panel title={`UGX 130M Phase 1 Budget Allocation (${formatUGX(phaseOneBudgetTotal)} Total)`}>
          <DataTable
            headers={["Essential item", "Amount", "Status"]}
            rows={phaseOneBudgetItems.map((row) => [row.item, formatUGX(row.amountUgx), row.status])}
          />
        </Panel>

        <Panel title="Deferred Until Cash Flow Improves">
          <DataTable headers={["Deferred item", "Reason"]} rows={deferredPhaseItems.map((item) => [item, "Phase 2/3 after verified orders and cash flow"])} />
        </Panel>
      </section>

      <Panel title="Current Data Confidence Snapshot">
        <DataTable
          headers={["Dataset", "Records", "Main Confidence"]}
          rows={[
            ["Products", state.products.length, "Estimated / Quotation Required"],
            ["Competitors", state.competitors.length, "Needs verification"],
            ["Market prices", state.marketPrices.length, "Estimated / Quotation Required"],
            ["Customers", state.customers.length, "Estimated"],
            ["QC tests", state.qualityTests.length, "Internal seed data"],
          ]}
        />
      </Panel>
    </>
  );
}
