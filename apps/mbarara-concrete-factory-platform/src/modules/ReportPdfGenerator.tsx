import { useRef, useState } from "react";
import jsPDF from "jspdf";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Download, FileText } from "lucide-react";
import { ChartCard } from "../components/common/ChartCard";
import { DataTable } from "../components/common/DataTable";
import { MetricCard } from "../components/common/MetricCard";
import { Panel } from "../components/common/Panel";
import { deferredPhaseItems, phaseOneBudgetItems, targetAreas } from "../data/seedData";
import type { AppState } from "../types";
import type { ErpComputed } from "../lib/calculations";
import { formatUGX, generateSwot, numberFormat, productName, supplierName } from "../lib/calculations";

type TocEntry = { title: string; page: number };
type PdfTableRow = Array<string | number>;

const reportTitle = "Mbarara Integrated Concrete Products Factory";
const reportSubtitle = "Investor, Engineering, Financial & Expansion Master Report 2026-2035";
const reportFilename = "Mbarara_Integrated_Concrete_Factory_Master_Report.pdf";
const phaseOneBudgetTotal = phaseOneBudgetItems.reduce((sum, row) => sum + row.amountUgx, 0);
const publicAsset = (path: string) => `${import.meta.env.BASE_URL}${path}`;

async function svgToPng(svg: SVGElement): Promise<string> {
  const clone = svg.cloneNode(true) as SVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  const bounds = svg.getBoundingClientRect();
  const width = Math.max(600, Math.round(bounds.width || Number(svg.getAttribute("width")) || 800));
  const height = Math.max(260, Math.round(bounds.height || Number(svg.getAttribute("height")) || 360));
  clone.setAttribute("width", String(width));
  clone.setAttribute("height", String(height));
  clone.insertAdjacentHTML("afterbegin", `<rect width="100%" height="100%" fill="#ffffff"></rect>`);
  const serialized = new XMLSerializer().serializeToString(clone);
  const encoded = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(serialized)}`;

  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = width * 2;
      canvas.height = height * 2;
      const context = canvas.getContext("2d");
      if (!context) {
        reject(new Error("Canvas context unavailable"));
        return;
      }
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/png"));
    };
    image.onerror = () => reject(new Error("Unable to render chart SVG"));
    image.src = encoded;
  });
}

async function captureChart(ref: React.RefObject<HTMLDivElement>) {
  const svg = ref.current?.querySelector("svg");
  if (!svg) return undefined;
  return svgToPng(svg);
}

export function ReportPdfGenerator({ state, erp }: { state: AppState; erp: ErpComputed }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const profitChartRef = useRef<HTMLDivElement>(null);
  const opportunityChartRef = useRef<HTMLDivElement>(null);
  const inventoryChartRef = useRef<HTMLDivElement>(null);
  const qualityChartRef = useRef<HTMLDivElement>(null);

  async function generatePdf() {
    setIsGenerating(true);
    try {
      const chartImages = {
        profit: await captureChart(profitChartRef),
        opportunity: await captureChart(opportunityChartRef),
        inventory: await captureChart(inventoryChartRef),
        quality: await captureChart(qualityChartRef),
      };

      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 18;
      const contentWidth = pageWidth - margin * 2;
      const bottom = pageHeight - 22;
      const toc: TocEntry[] = [];
      let y = margin;

      const setBody = () => {
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(9.3);
        pdf.setTextColor(45, 55, 72);
      };

      const addPage = () => {
        pdf.addPage();
        y = margin;
      };

      const ensureSpace = (height: number) => {
        if (y + height > bottom) addPage();
      };

      const line = () => {
        pdf.setDrawColor(210, 217, 226);
        pdf.line(margin, y, pageWidth - margin, y);
        y += 5;
      };

      const paragraph = (text: string) => {
        setBody();
        const lines = pdf.splitTextToSize(text, contentWidth);
        ensureSpace(lines.length * 4.6 + 4);
        pdf.text(lines, margin, y);
        y += lines.length * 4.6 + 4;
      };

      const heading = (title: string, level = 1) => {
        ensureSpace(level === 1 ? 18 : 12);
        if (level === 1) {
          toc.push({ title, page: pdf.getCurrentPageInfo().pageNumber });
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(15);
          pdf.setTextColor(23, 50, 77);
          pdf.text(title, margin, y);
          y += 8;
          line();
        } else {
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(11);
          pdf.setTextColor(23, 50, 77);
          pdf.text(title, margin, y);
          y += 6;
        }
      };

      const addTable = (headers: string[], rows: PdfTableRow[], widths?: number[]) => {
        const columnWidths = widths ?? headers.map(() => contentWidth / headers.length);
        const drawHeader = () => {
          ensureSpace(9);
          pdf.setFillColor(23, 50, 77);
          pdf.rect(margin, y - 5, contentWidth, 8, "F");
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(7.4);
          pdf.setTextColor(255, 255, 255);
          let x = margin + 2;
          headers.forEach((header, index) => {
            pdf.text(header, x, y);
            x += columnWidths[index];
          });
          y += 7;
        };
        drawHeader();
        rows.forEach((row, rowIndex) => {
          const wrapped = row.map((cell, index) => pdf.splitTextToSize(String(cell), Math.max(16, columnWidths[index] - 4)));
          const rowHeight = Math.max(7, ...wrapped.map((cell) => cell.length * 3.5 + 3));
          if (y + rowHeight > bottom) {
            addPage();
            drawHeader();
          }
          pdf.setFillColor(rowIndex % 2 ? 255 : 246, rowIndex % 2 ? 255 : 248, rowIndex % 2 ? 255 : 250);
          pdf.rect(margin, y - 4.5, contentWidth, rowHeight, "F");
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(7.1);
          pdf.setTextColor(45, 55, 72);
          let x = margin + 2;
          wrapped.forEach((cell, index) => {
            pdf.text(cell, x, y);
            x += columnWidths[index];
          });
          y += rowHeight;
        });
        y += 5;
      };

      const addChart = (title: string, image?: string) => {
        if (!image) return;
        heading(title, 2);
        ensureSpace(82);
        pdf.addImage(image, "PNG", margin, y, contentWidth, 72);
        y += 78;
      };

      const addMetricTable = () => {
        addTable(
          ["Metric", "Value"],
          [
            ["Starter budget ceiling", formatUGX(erp.financials.starterBudgetUgx)],
            ["Phase 1 essential startup cost", formatUGX(erp.financials.phaseOneStartupCostUgx)],
            ["Budget buffer", formatUGX(erp.financials.budgetSurplusUgx)],
            ["Budget feasibility status", erp.financials.budgetFeasible ? "Feasible within UGX 130,000,000 starter budget" : "Over budget"],
            ["Monthly revenue", formatUGX(erp.financials.revenueUgx)],
            ["Monthly material and production cost", formatUGX(erp.financials.materialAndProductionCostUgx)],
            ["Monthly expenses", formatUGX(erp.financials.expensesUgx)],
            ["Gross profit", formatUGX(erp.financials.grossProfitUgx)],
            ["Net profit", formatUGX(erp.financials.netProfitUgx)],
            ["Break-even revenue", formatUGX(erp.financials.breakEvenRevenueUgx)],
            ["ROI estimate", `${(erp.financials.roiEstimate * 100).toFixed(1)}%`],
            ["UGX 20,000,000 target reached", erp.financials.targetReached ? "Yes" : "No"],
          ],
          [86, 88],
        );
      };

      pdf.setFillColor(23, 50, 77);
      pdf.rect(0, 0, pageWidth, 58, "F");
      pdf.setTextColor(255, 255, 255);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(23);
      pdf.text(pdf.splitTextToSize(reportTitle, 170), margin, 28);
      pdf.setFontSize(13);
      pdf.text(pdf.splitTextToSize(reportSubtitle, 170), margin, 45);
      pdf.setTextColor(31, 41, 55);
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.text("Currency: UGX only", margin, 84);
      pdf.text("Starter launch budget: UGX 130,000,000; Phase 1 limited to essentials before expansion.", margin, 93, { maxWidth: contentWidth });
      pdf.text("Prepared for investor, engineering, financial, operational, and regional expansion planning.", margin, 107, { maxWidth: contentWidth });
      pdf.text("Data confidence: Verified / Estimated / Quotation Required / Needs verification.", margin, 121, { maxWidth: contentWidth });
      pdf.text("Disclaimer: market prices and competitor data must be re-verified before investment decisions.", margin, 135, { maxWidth: contentWidth });
      pdf.setDrawColor(47, 125, 91);
      pdf.setLineWidth(1.2);
      pdf.line(margin, 140, pageWidth - margin, 140);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12);
      pdf.text("Mbarara, Uganda | Planning horizon 2026-2035", margin, 153);

      pdf.addPage();
      const tocPage = pdf.getCurrentPageInfo().pageNumber;
      pdf.addPage();
      y = margin;

      heading("Executive Summary");
      paragraph(
        "This master report consolidates the financial simulator, inventory system, quality control database, ERP records, competitor intelligence, product costing, production planning, and risk register for the proposed Mbarara Integrated Concrete Products Factory.",
      );
      paragraph(
        `The project has been revised to start with a strict UGX 130,000,000 budget. Phase 1 commits ${formatUGX(
          phaseOneBudgetTotal,
        )} to essential machinery, starter moulds, site works, utilities, raw materials, basic laboratory controls, labour, local sales, and working capital. Larger expansion items are postponed until verified demand and cash flow support them.`,
      );
      paragraph(
        `Under the current estimated assumptions, the model produces monthly revenue of ${formatUGX(erp.financials.revenueUgx)} and net profit of ${formatUGX(
          erp.financials.netProfitUgx,
        )}. The UGX 20,000,000 monthly profit target is ${erp.financials.targetReached ? "currently reached" : "not yet reached"} and remains sensitive to cement cost, verified market prices, capacity utilization, delivery cost, and payment discipline.`,
      );
      addMetricTable();

      heading("UGX 130M Phase 1 Budget Feasibility");
      paragraph(
        "The launch plan deliberately avoids a full-scale concrete factory on day one. The funded scope is a lean production yard for 6-inch blocks, 8-inch blocks, solid blocks, 60 mm pavers, 80 mm pavers, and limited kerbstones. Ready-mix concrete, culverts, drainage channels, specialist pavers, owned delivery trucks, heavy lifting equipment, and additional production lines are deferred.",
      );
      addTable(
        ["Essential Phase 1 item", "Amount", "Status"],
        phaseOneBudgetItems.map((row) => [row.item, formatUGX(row.amountUgx), row.status]),
        [88, 34, 52],
      );
      addTable(
        ["Deferred expansion item", "Reason"],
        deferredPhaseItems.map((item) => [item, "Add only after verified orders, positive cash flow, and written supplier quotations."]),
        [78, 96],
      );

      heading("Market Analysis");
      paragraph(
        "The initial sales campaign should focus on Mbarara City and Western Uganda districts with active property development, institutional construction, roadworks, and hardware distribution. Customer demand records are estimates and should be upgraded through field visits, quotations, and phone verification.",
      );
      addTable(
        ["Target Area"],
        targetAreas.map((area) => [area]),
        [contentWidth],
      );
      addTable(
        ["Customer", "Type", "Location", "Likely products", "Demand", "Confidence"],
        state.customers.map((customer) => [
          customer.name,
          customer.customerType,
          customer.location,
          customer.likelyProductsNeeded.join(", "),
          numberFormat(customer.estimatedMonthlyDemand),
          customer.confidenceLevel,
        ]),
        [33, 28, 31, 46, 18, 18],
      );
      addChart("Figure: Product Opportunity Scores", chartImages.opportunity);

      heading("Competitor Analysis");
      paragraph(
        "Competitor entries are seeded for structured investigation. They must not be interpreted as verified unless their confidence status is upgraded after field research, quotation requests, phone calls, or documentary source checks.",
      );
      addTable(
        ["Competitor", "District", "Type", "Products", "Threat", "Confidence"],
        state.competitors.map((competitor) => [
          competitor.competitorName,
          competitor.district,
          competitor.businessType,
          competitor.productsOffered.join(", "),
          competitor.threatLevel,
          competitor.sourceMeta.confidenceLevel,
        ]),
        [33, 25, 31, 53, 16, 24],
      );
      heading("Competitor SWOT Generator Output", 2);
      state.competitors.slice(0, 4).forEach((competitor) => {
        const swot = generateSwot(competitor);
        addTable(
          [competitor.competitorName, "Generated Response"],
          [
            ["Strengths", swot.strengths],
            ["Weaknesses", swot.weaknesses],
            ["Opportunities", swot.opportunities],
            ["Threats", swot.threats],
            ["Recommended response", swot.recommendedResponse],
          ],
          [48, 126],
        );
      });

      heading("Product Portfolio");
      addTable(
        ["Product", "Category", "Unit", "Daily volume", "Planned price", "Confidence"],
        state.products.map((product) => [
          product.name,
          product.category,
          product.unit,
          numberFormat(product.targetDailyVolume),
          formatUGX(product.plannedPriceUgx),
          product.confidenceLevel,
        ]),
        [45, 24, 18, 24, 32, 31],
      );

      heading("Product Mix Ratios");
      addTable(
        ["Product", "Mix ratio", "Assumption label"],
        state.products.map((product) => [product.name, product.mixRatio, product.assumptionLabel]),
        [42, 45, 87],
      );

      heading("Raw Material Consumption");
      paragraph(
        "Raw material consumption is linked to inventory transactions and production batches. Current quantities, days remaining, and reorder levels are calculated locally and can later be moved to PostgreSQL inventory tables.",
      );
      addTable(
        ["Item", "Current qty", "Unit", "Stock value", "Days remaining", "Reorder level", "Supplier"],
        erp.inventory.map((item) => [
          item.name,
          numberFormat(item.currentQty),
          item.unit,
          formatUGX(item.stockValueUgx),
          item.daysRemaining > 900 ? "Non-consumable" : `${numberFormat(item.daysRemaining)} days`,
          numberFormat(item.reorderLevel),
          supplierName(state, item.supplierId),
        ]),
        [33, 22, 16, 27, 28, 22, 34],
      );
      addChart("Figure: Inventory Stock Value", chartImages.inventory);

      heading("Machinery Analysis");
      addTable(
        ["Option", "Suitable products", "Indicative role", "Data confidence"],
        [
          ["Semi-automatic block/paver machine with mixer and vibrator", "Blocks, 60 mm pavers, 80 mm pavers", "Essential Phase 1 production line sized for the UGX 130M budget.", "Quotation Required"],
          ["Starter mould set", "6-inch, 8-inch, solid blocks, standard pavers, kerbstones", "Buy only the moulds needed for the first sales campaign.", "Quotation Required"],
          ["Additional specialist moulds", "Grass pavers, cobblestones, drainage channels, culverts", "Deferred until demand is proven and cash flow supports mould expansion.", "Quotation Required"],
          ["Batching plant and transit mixer", "Ready-mix concrete", "Phase 3 expansion after core products generate repeatable profit.", "Quotation Required"],
        ],
        [38, 42, 70, 24],
      );

      heading("Factory Layout Summary");
      paragraph(
        "The factory should separate inbound raw materials, batching and mixing, block/paver forming, curing yards, finished goods dispatch, laboratory, stores, administration, and vehicle circulation. Layout assumptions require final land survey, drainage review, and authority approval.",
      );
      addTable(
        ["Zone", "Function", "Design note"],
        [
          ["Raw materials yard", "Cement, stone dust, sand, aggregates", "Keep truck turning radius and covered cement store separate."],
          ["Production bay", "Batching, mixing, moulding", "Place near curing yard to minimize handling damage."],
          ["Curing yard", "Wet curing and stacked curing", "Control dates, batch identity, and water access."],
          ["QC laboratory", "Testing and certificates", "Locate near production but isolated from dust where practical."],
          ["Dispatch area", "Finished goods loading", "Separate from inbound quarry deliveries for safer circulation."],
        ],
        [38, 50, 86],
      );

      heading("Utility Consumption");
      addTable(
        ["Utility", "Assumption", "Monthly cost driver", "Confidence"],
        [
          ["Electricity", `${formatUGX(state.financialAssumptions.electricityCostPerKwhUgx)} per kWh`, "Machine hours, mixer load, lighting", "Estimated"],
          ["Water", `${formatUGX(state.financialAssumptions.waterCostPerM3Ugx)} per m3`, "Mixing, curing, cleaning", "Estimated"],
          ["Diesel", `${formatUGX(state.financialAssumptions.dieselPricePerLitreUgx)} per litre`, "Forklift, loader, delivery and backup power", "Estimated"],
        ],
        [32, 44, 68, 30],
      );

      heading("Laboratory and Quality Control");
      paragraph(
        "Every production batch must be traceable through batch ID, product type, operator, material consumption, mix ratio, curing age, tests, and approval status. Certificates generated by the application are operational templates and should be aligned with applicable standards before external certification use.",
      );
      addTable(
        ["Batch", "Product", "Strength", "Absorption", "Density", "Dimensions", "Defects", "Status"],
        state.qualityTests.map((test) => [
          test.batchId,
          productName(state, test.productId),
          `${numberFormat(test.compressiveStrengthMpa)} MPa`,
          `${numberFormat(test.waterAbsorptionPct)}%`,
          `${numberFormat(test.densityKgM3)} kg/m3`,
          test.dimensionStatus,
          numberFormat(test.visualDefects),
          test.approvalStatus,
        ]),
        [27, 38, 22, 22, 25, 20, 18, 22],
      );
      addChart("Figure: Average Strength by Product", chartImages.quality);

      heading("Legal and Regulatory Roadmap");
      addTable(
        ["Office / process", "Purpose", "Timing"],
        [
          ["Mbarara City authority", "Planning, building, trading, and local approvals", "Pre-construction"],
          ["NEMA", "Environmental screening and mitigation plan", "Pre-construction"],
          ["Occupational safety office", "Worker safety compliance and inspections", "Before commissioning"],
          ["URA", "Tax registration, invoicing, and compliance", "Before trading"],
          ["UNBS / relevant standards review", "Product quality benchmarks and certification pathway", "Before market certification claims"],
          ["Water and electricity utility offices", "Service connection and metering", "Pre-commissioning"],
        ],
        [44, 84, 46],
      );

      heading("Financial Model");
      addMetricTable();
      addTable(
        ["Product", "Unit cost", "Price", "Margin", "Margin %", "Confidence"],
        erp.financials.productCosts.map((row) => {
          const product = state.products.find((item) => item.name === row.productName);
          return [
            row.productName,
            formatUGX(row.unitCostUgx),
            formatUGX(row.plannedPriceUgx),
            formatUGX(row.marginUgx),
            `${numberFormat(row.marginPct * 100)}%`,
            product?.confidenceLevel ?? "Estimated",
          ];
        }),
        [42, 28, 28, 28, 20, 28],
      );
      addChart("Figure: Monthly Profit Projection", chartImages.profit);

      heading("Risk Register");
      addTable(
        ["Risk", "Category", "Likelihood", "Impact", "Mitigation"],
        state.risks.map((risk) => [risk.risk, risk.category, risk.likelihood, risk.impact, risk.mitigation]),
        [56, 24, 22, 18, 54],
      );

      heading("Implementation Roadmap");
      addTable(
          ["Year", "Roadmap focus"],
          [
          ["2026", "Launch within UGX 130,000,000 using essential machine, starter moulds, basic site works, starter stock, permits, QC tools, and local sales."],
          ["2027", "Stabilize blocks, standard pavers, and kerbstones; formalize QC records and target Mbarara City and Rwampara contractors."],
          ["2028", "Add extra moulds only from retained earnings; test drainage channel demand through quotations before buying moulds."],
          ["2029", "Scale production capacity, add mould sets, and negotiate framework supply agreements."],
          ["2030", "Evaluate ready-mix feasibility and transit mixer economics only after verified demand and strong cash reserves."],
          ["2031", "Expand sales coverage to Ntungamo, Bushenyi, Ibanda, Kiruhura, Sheema, and Lyantonde."],
          ["2032", "Build regional stockist network and contractor credit scoring."],
          ["2033", "Introduce advanced precast products where municipal demand is verified."],
          ["2034", "Prepare East African expansion partnerships and logistics corridors."],
          ["2035", "Evaluate second factory or satellite yard based on verified profitability and demand."],
        ],
        [22, 152],
      );

      heading("East African Expansion Strategy");
      paragraph(
        "Expansion should follow proof of quality, repeatable monthly profit, and strong working capital controls in Western Uganda. The most realistic path is distribution-led: first deepen Western Uganda, then test border-proximate demand, and only then consider asset-heavy production expansion.",
      );
      addTable(
        ["Phase", "Market logic", "Action"],
        [
          ["Western Uganda consolidation", "Shortest delivery routes and strongest local relationships.", "Prioritize Mbarara City, Rwampara, Isingiro, Ntungamo, Bushenyi, Ibanda, Kiruhura, Sheema, Lyantonde, Kabale, and Rukungiri."],
          ["Border market testing", "Contractor and NGO demand may justify selective shipments.", "Use quotation-based sales before fixed depots."],
          ["Regional partnerships", "Lower capex than immediate new factory investment.", "Partner with hardware stores and contractors first."],
          ["Second production base", "Only after verified monthly profit and demand density.", "Trigger by multi-year contracts and stable raw material supply."],
        ],
        [38, 64, 72],
      );

      heading("Appendices");
      heading("Data Confidence and Assumption Labels", 2);
      addTable(
        ["Label", "Meaning"],
        [
          ["Verified", "Confirmed by reliable documentation, field check, invoice, or quotation."],
          ["Estimated", "Planning value based on model assumptions and prior project context."],
          ["Quotation Required", "Do not use for procurement or investment until supplier quotation is obtained."],
          ["Needs verification", "Seed record requiring field visit, phone check, website check, or documentary proof."],
          ["Assumption", "Model input that must be validated by quotations, laboratory tests, or site-specific engineering."],
        ],
        [42, 132],
      );
      heading("Disclaimer", 2);
      paragraph(
        "This report is a planning and investor-readiness document. It is not a substitute for engineering design, statutory approvals, audited financial statements, tax advice, legal advice, environmental approval, or binding supplier/customer quotations. Market prices, competitor records, GPS details, contacts, and capacity claims must be re-verified before investment decisions.",
      );

      pdf.setPage(tocPage);
      y = margin;
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(18);
      pdf.setTextColor(23, 50, 77);
      pdf.text("Table of Contents", margin, y);
      y += 11;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.setTextColor(45, 55, 72);
      toc.forEach((entry) => {
        const title = pdf.splitTextToSize(entry.title, 140)[0];
        pdf.text(title, margin, y);
        pdf.text(String(entry.page), pageWidth - margin, y, { align: "right" });
        y += 6;
      });

      const pages = pdf.getNumberOfPages();
      for (let page = 1; page <= pages; page += 1) {
        pdf.setPage(page);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(7.5);
        pdf.setTextColor(100, 116, 139);
        pdf.text(`${reportTitle} | UGX only`, margin, pageHeight - 10);
        pdf.text(`Page ${page} of ${pages}`, pageWidth - margin, pageHeight - 10, { align: "right" });
      }

      pdf.save(reportFilename);
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <>
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Report scope" value="18 chapters" tone="navy" icon={<FileText size={20} />} />
        <MetricCard label="Currency" value="UGX only" tone="green" />
        <MetricCard label="Starter budget" value={formatUGX(erp.financials.starterBudgetUgx, true)} tone="blue" />
        <MetricCard label="Budget buffer" value={formatUGX(erp.financials.budgetSurplusUgx, true)} tone={erp.financials.budgetFeasible ? "green" : "clay"} />
      </section>

      <Panel
        title="Download Master PDF"
        action={
          <div className="flex flex-wrap gap-2">
            <a
              href={publicAsset("Mbarara_Integrated_Concrete_Factory_Master_Report.pdf")}
              download
              className="inline-flex items-center gap-2 rounded-md bg-factory-navy px-4 py-2 text-sm font-semibold text-white hover:bg-[#102638]"
            >
              <Download size={17} />
              Download saved PDF
            </a>
            <button
              type="button"
              onClick={generatePdf}
              disabled={isGenerating}
              className="inline-flex items-center gap-2 rounded-md bg-factory-green px-4 py-2 text-sm font-semibold text-white hover:bg-[#276b4e] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Download size={17} />
              {isGenerating ? "Generating..." : "Generate latest PDF"}
            </button>
          </div>
        }
      >
        <div className="space-y-3 text-sm leading-6 text-slate-700">
          <p>
            Generates <span className="font-semibold text-factory-navy">{reportFilename}</span> using the current local data from financials, inventory,
            production, quality control, ERP, market intelligence, product costing, production planning, and risk records.
          </p>
          <p>
            The latest version is constrained to a UGX 130,000,000 starter launch and marks ready-mix, culverts, heavy precast, extra moulds, owned trucks,
            and major expansion as later-phase items.
          </p>
          <p>
            The generated document uses A4 portrait report formatting with chapters, paragraphs, tables, Recharts chart images, automatic page numbers,
            confidence labels, assumption labels, and investment disclaimer text.
          </p>
        </div>
      </Panel>

      <section className="grid gap-5 2xl:grid-cols-2">
        <ChartCard title="PDF Figure Source: Monthly Profit Projection" chartRef={profitChartRef}>
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

        <ChartCard title="PDF Figure Source: Opportunity Score by Product" chartRef={opportunityChartRef}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={erp.market.opportunityRanking.slice(0, 8)} margin={{ top: 14, right: 16, left: 0, bottom: 70 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d8dee4" />
              <XAxis dataKey="productName" angle={-28} textAnchor="end" interval={0} height={88} tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="opportunityScore" name="Opportunity score" fill="#2f7d5b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="PDF Figure Source: Inventory Stock Value" chartRef={inventoryChartRef}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={erp.inventory.slice(0, 7)} margin={{ top: 14, right: 16, left: 0, bottom: 58 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d8dee4" />
              <XAxis dataKey="name" angle={-28} textAnchor="end" interval={0} height={78} tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(value) => `${Math.round(Number(value) / 1_000_000)}m`} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(value) => formatUGX(Number(value))} />
              <Bar dataKey="stockValueUgx" name="Stock value" fill="#3b6ea8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="PDF Figure Source: Average Strength by Product" chartRef={qualityChartRef}>
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
      </section>

      <Panel title="PDF Chapter Checklist">
        <DataTable
          headers={["Chapter", "Included"]}
          rows={[
            ["Cover page and table of contents", "Yes"],
            ["Executive summary, UGX 130M budget feasibility, market analysis", "Yes"],
            ["Product portfolio, mix ratios, raw material consumption", "Yes"],
            ["Machinery, factory layout, utilities, QC laboratory", "Yes"],
            ["Legal roadmap, financial model, risk register", "Yes"],
            ["Implementation roadmap, East African expansion, appendices", "Yes"],
          ]}
        />
      </Panel>
    </>
  );
}
