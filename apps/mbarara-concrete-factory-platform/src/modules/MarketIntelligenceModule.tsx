import { useState } from "react";
import jsPDF from "jspdf";
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
import { ChartCard } from "../components/common/ChartCard";
import { DataTable } from "../components/common/DataTable";
import { MetricCard } from "../components/common/MetricCard";
import { Panel } from "../components/common/Panel";
import { Tag } from "../components/common/Tag";
import { targetAreas } from "../data/seedData";
import { computeMarket, formatUGX, generateSwot, numberFormat } from "../lib/calculations";
import { downloadCsv } from "../lib/exporters";
import type { AppState } from "../types";

type MarketTab = "competitors" | "prices" | "customers" | "gaps" | "swot" | "dashboard" | "export";

const tabs: { id: MarketTab; label: string }[] = [
  { id: "competitors", label: "Competitors" },
  { id: "prices", label: "Prices" },
  { id: "customers", label: "Customers" },
  { id: "gaps", label: "Market Gaps" },
  { id: "swot", label: "SWOT" },
  { id: "dashboard", label: "Dashboard" },
  { id: "export", label: "Export" },
];

const colors = ["#17324d", "#2f7d5b", "#b7842f", "#a44a3f", "#3b6ea8", "#6b7280"];

export function MarketIntelligenceModule({ state }: { state: AppState }) {
  const [activeTab, setActiveTab] = useState<MarketTab>("dashboard");
  const market = computeMarket(state);
  const highThreat = state.competitors.filter((competitor) => competitor.threatLevel === "high").length;
  const topOpportunity = market.opportunityRanking[0];
  const quotationRequired = state.marketPrices.filter((price) => price.confidenceLevel === "quotation_required").length;

  function exportMarketSummaryPdf() {
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(15);
    pdf.text("Mbarara Integrated Concrete Products Factory", 16, 18);
    pdf.setFontSize(11);
    pdf.text("Market Intelligence Summary", 16, 26);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.text("Currency: UGX only. Data confidence: unverified market entries must be checked before investment decisions.", 16, 36, { maxWidth: 178 });
    let y = 50;
    pdf.setFont("helvetica", "bold");
    pdf.text("Top Opportunity Products", 16, y);
    y += 7;
    pdf.setFont("helvetica", "normal");
    market.opportunityRanking.slice(0, 8).forEach((row, index) => {
      pdf.text(`${index + 1}. ${row.productName}: score ${row.opportunityScore}`, 18, y);
      y += 6;
    });
    y += 5;
    pdf.setFont("helvetica", "bold");
    pdf.text("High-Threat Competitors", 16, y);
    y += 7;
    pdf.setFont("helvetica", "normal");
    state.competitors
      .filter((competitor) => competitor.threatLevel === "high")
      .forEach((competitor) => {
        pdf.text(`${competitor.competitorName} - ${competitor.district} - ${competitor.sourceMeta.confidenceLevel}`, 18, y);
        y += 6;
      });
    pdf.save("Mbarara_Market_Intelligence_Summary.pdf");
  }

  return (
    <>
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Competitors tracked" value={String(state.competitors.length)} tone="navy" />
        <MetricCard label="High-threat competitors" value={String(highThreat)} tone={highThreat ? "clay" : "green"} />
        <MetricCard label="Quotation required" value={String(quotationRequired)} tone="amber" />
        <MetricCard label="Best opportunity" value={topOpportunity?.productName ?? "Needs verification"} tone="green" />
      </section>

      <section className="rounded-md border border-slate-200 bg-white p-2 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-md px-3 py-2 text-sm font-semibold ${
                activeTab === tab.id ? "bg-factory-navy text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {activeTab === "competitors" ? (
        <Panel title="Competitor Database">
          <DataTable
            headers={["Competitor", "District", "Business type", "Products", "Capacity", "Machine", "Radius", "Threat", "Confidence", "Source", "Notes"]}
            rows={state.competitors.map((competitor) => [
              competitor.competitorName,
              competitor.district,
              competitor.businessType,
              competitor.productsOffered.join(", "),
              competitor.estimatedProductionCapacity,
              competitor.machineType,
              String(competitor.deliveryRadiusKm),
              competitor.threatLevel === "high" ? <Tag tone="clay">high</Tag> : competitor.threatLevel === "medium" ? <Tag tone="amber">medium</Tag> : <Tag tone="green">low</Tag>,
              competitor.sourceMeta.confidenceLevel,
              competitor.sourceMeta.sourceUrlOrContact,
              competitor.notes,
            ])}
          />
        </Panel>
      ) : null}

      {activeTab === "prices" ? (
        <Panel title="Product Price Intelligence">
          <DataTable
            headers={["Product", "Supplier", "Location", "Unit", "Price", "Delivery included", "Date checked", "Confidence", "Source"]}
            rows={state.marketPrices.map((price) => [
              price.productName,
              price.supplierName,
              price.location,
              price.unit,
              formatUGX(price.priceUgx),
              price.deliveryIncluded ? "Yes" : "No",
              price.dateChecked,
              price.confidenceLevel === "verified" ? <Tag tone="green">verified</Tag> : price.confidenceLevel === "estimated" ? <Tag tone="amber">estimated</Tag> : <Tag tone="clay">quotation required</Tag>,
              price.sourceMeta.sourceUrlOrContact,
            ])}
          />
        </Panel>
      ) : null}

      {activeTab === "customers" ? (
        <Panel title="Customer Demand Database">
          <DataTable
            headers={["Customer", "Type", "Location", "Products needed", "Monthly demand", "Buying power", "Payment reliability", "Decision maker", "Notes"]}
            rows={state.customers.map((customer) => [
              customer.name,
              customer.customerType,
              customer.location,
              customer.likelyProductsNeeded.join(", "),
              numberFormat(customer.estimatedMonthlyDemand),
              customer.buyingPower,
              customer.paymentReliability,
              customer.decisionMakerContact,
              customer.notes,
            ])}
          />
        </Panel>
      ) : null}

      {activeTab === "gaps" ? (
        <Panel title="Market Gap Analysis and Product Opportunity Ranking">
          <DataTable
            headers={["Rank", "Product", "Demand", "Competition", "Margin", "Logistics", "Strategic", "Opportunity score"]}
            rows={market.opportunityRanking.map((row, index) => [
              index + 1,
              row.productName,
              row.demandScore,
              row.competitionScore,
              row.marginScore,
              row.logisticsDifficulty,
              row.strategicValue,
              row.opportunityScore,
            ])}
          />
        </Panel>
      ) : null}

      {activeTab === "swot" ? (
        <section className="grid gap-5 xl:grid-cols-2">
          {state.competitors.map((competitor) => {
            const swot = generateSwot(competitor);
            return (
              <Panel key={competitor.competitorId} title={`${competitor.competitorName} SWOT`}>
                <DataTable
                  headers={["Area", "Generated content"]}
                  rows={[
                    ["Strengths", swot.strengths],
                    ["Weaknesses", swot.weaknesses],
                    ["Opportunities", swot.opportunities],
                    ["Threats", swot.threats],
                    ["Recommended response", swot.recommendedResponse],
                  ]}
                />
              </Panel>
            );
          })}
        </section>
      ) : null}

      {activeTab === "dashboard" ? (
        <>
          <section className="grid gap-5 2xl:grid-cols-2">
            <ChartCard title="Competitor Count by District">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={market.competitorCountByDistrict} margin={{ top: 14, right: 16, left: 0, bottom: 34 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#d8dee4" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" name="Competitors" fill="#17324d" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Average Market Price per Product">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={market.averageMarketPricePerProduct} margin={{ top: 14, right: 16, left: 0, bottom: 82 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#d8dee4" />
                  <XAxis dataKey="name" angle={-28} textAnchor="end" interval={0} height={98} tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value) => formatUGX(Number(value))} />
                  <Bar dataKey="price" name="Average price" fill="#3b6ea8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Threat Level Distribution">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={market.threatDistribution} dataKey="value" nameKey="name" innerRadius={62} outerRadius={104} paddingAngle={2}>
                    {market.threatDistribution.map((entry, index) => (
                      <Cell key={entry.name} fill={colors[index % colors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Price Comparison: Planned vs Competitor">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={market.priceComparison} margin={{ top: 14, right: 16, left: 0, bottom: 82 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#d8dee4" />
                  <XAxis dataKey="name" angle={-28} textAnchor="end" interval={0} height={98} tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value) => formatUGX(Number(value))} />
                  <Legend />
                  <Bar dataKey="planned" name="Our planned price" fill="#2f7d5b" />
                  <Bar dataKey="competitor" name="Competitor price" fill="#b7842f" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </section>

          <Panel title="Mbarara and Western Uganda Focus Areas">
            <div className="grid gap-2 md:grid-cols-3 xl:grid-cols-4">
              {targetAreas.map((area) => (
                <div key={area} className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
                  {area}
                </div>
              ))}
            </div>
          </Panel>
        </>
      ) : null}

      {activeTab === "export" ? (
        <Panel title="Export Market Intelligence Data">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <button type="button" className="rounded-md bg-factory-navy px-3 py-2 text-sm font-semibold text-white" onClick={() => downloadCsv("competitor_database.csv", state.competitors as unknown as Record<string, unknown>[])}>
              Competitor CSV
            </button>
            <button type="button" className="rounded-md bg-factory-navy px-3 py-2 text-sm font-semibold text-white" onClick={() => downloadCsv("market_price_intelligence.csv", state.marketPrices as unknown as Record<string, unknown>[])}>
              Market Price CSV
            </button>
            <button type="button" className="rounded-md bg-factory-navy px-3 py-2 text-sm font-semibold text-white" onClick={() => downloadCsv("customer_demand_database.csv", state.customers as unknown as Record<string, unknown>[])}>
              Customer CSV
            </button>
            <button type="button" className="rounded-md bg-factory-navy px-3 py-2 text-sm font-semibold text-white" onClick={() => downloadCsv("opportunity_ranking.csv", market.opportunityRanking as unknown as Record<string, unknown>[])}>
              Opportunity CSV
            </button>
            <button type="button" className="rounded-md bg-factory-green px-3 py-2 text-sm font-semibold text-white" onClick={exportMarketSummaryPdf}>
              PDF Summary
            </button>
          </div>
          <p className="mt-4 text-sm text-slate-600">
            Exported market records keep source tracking, confidence level, and verification status so future PostgreSQL imports can preserve data lineage.
          </p>
        </Panel>
      ) : null}
    </>
  );
}
