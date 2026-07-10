import { useEffect, useMemo, useState } from "react";
import { RotateCcw } from "lucide-react";
import { Panel } from "./components/common/Panel";
import { Shell, type AppTab } from "./components/layout/Shell";
import { initialState } from "./data/seedData";
import { computeErp } from "./lib/calculations";
import {
  applyDocumentLanguage,
  getDisplayLanguageCode,
  saveDisplayLanguageCode,
  type DisplayLanguageCode,
} from "./lib/localization";
import { useLocalStorageState } from "./lib/useLocalStorage";
import { DashboardModule } from "./modules/DashboardModule";
import { DatabaseModule } from "./modules/DatabaseModule";
import { ErpModule } from "./modules/ErpModule";
import { FinancialModule } from "./modules/FinancialModule";
import { InventoryModule } from "./modules/InventoryModule";
import { MarketIntelligenceModule } from "./modules/MarketIntelligenceModule";
import { ProductionModule } from "./modules/ProductionModule";
import { PublicWebsiteModule } from "./modules/PublicWebsiteModule";
import { QualityModule } from "./modules/QualityModule";
import { ReportPdfGenerator } from "./modules/ReportPdfGenerator";
import type { AppState } from "./types";

const storageKey = "mbarara-concrete-factory-platform-state-v4-conservative-diesel";
const publicAsset = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>("dashboard");
  const [displayLanguage, setDisplayLanguage] = useState<DisplayLanguageCode>(() => getDisplayLanguageCode());
  const [state, setState] = useLocalStorageState<AppState>(storageKey, initialState);
  const erp = useMemo(() => computeErp(state), [state]);

  useEffect(() => {
    applyDocumentLanguage(displayLanguage);
  }, [displayLanguage]);

  function handleDisplayLanguageChange(language: DisplayLanguageCode) {
    saveDisplayLanguageCode(language);
    setDisplayLanguage(language);
  }

  function resetSeedData() {
    setState(initialState);
    window.localStorage.removeItem(storageKey);
  }

  const tabContent: Record<AppTab, JSX.Element> = {
    website: <PublicWebsiteModule state={state} displayLanguage={displayLanguage} />,
    dashboard: <DashboardModule state={state} erp={erp} />,
    financials: <FinancialModule state={state} setState={setState} erp={erp} />,
    inventory: <InventoryModule state={state} setState={setState} erp={erp} />,
    production: <ProductionModule state={state} setState={setState} erp={erp} />,
    quality: <QualityModule state={state} setState={setState} erp={erp} />,
    erp: <ErpModule state={state} setState={setState} erp={erp} />,
    market: <MarketIntelligenceModule state={state} />,
    database: <DatabaseModule />,
    report: <ReportPdfGenerator state={state} erp={erp} />,
  };

  return (
    <Shell activeTab={activeTab} onTabChange={setActiveTab} displayLanguage={displayLanguage} onDisplayLanguageChange={handleDisplayLanguageChange}>
      {activeTab !== "website" && (
        <Panel
          title="Integrated Project Control"
          action={
            <div className="flex flex-wrap gap-2">
              <a
                href={publicAsset("Mbarara_Integrated_Concrete_Factory_Master_Report.pdf")}
                download
                className="inline-flex items-center rounded-md bg-factory-green px-3 py-2 text-xs font-semibold text-white hover:bg-[#276b4e]"
              >
                Download saved PDF
              </a>
              <a
                href={publicAsset("Mbarara_Integrated_Concrete_Factory_30_Minute_Explainer.mp4")}
                download
                className="inline-flex items-center rounded-md bg-factory-blue px-3 py-2 text-xs font-semibold text-white hover:bg-[#2f5f93]"
              >
                Download US 30-min video
              </a>
              <a
                href={publicAsset("Mbarara_Integrated_Concrete_Factory_US_English_Walkthrough.mp4")}
                download
                className="inline-flex items-center rounded-md bg-[#7c3f2e] px-3 py-2 text-xs font-semibold text-white hover:bg-[#653223]"
              >
                Download US walkthrough
              </a>
              <button
                type="button"
                onClick={resetSeedData}
                className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                <RotateCcw size={15} />
                Reset seed data
              </button>
            </div>
          }
        >
          <div className="grid gap-3 text-sm leading-6 text-slate-700 xl:grid-cols-3">
            <p>
              A modular React + TypeScript + Tailwind + Recharts platform for the Mbarara concrete products factory project.
              Records are local-storage first and structured for PostgreSQL integration.
            </p>
            <p>
              Core accounting records remain UGX. Visitor-facing money displays can switch to USD, GBP, EUR, CNY, INR, KES, or AED
              for easier reading, while unverified prices and machinery costs stay labelled as estimated or quotation required.
            </p>
            <p>
              Modules share one state model, so financials, inventory, production, quality control, ERP reporting, market
              intelligence, and PDF reporting stay connected.
            </p>
            <p>
              Current launch rule: Phase 1 is capped at UGX 130,000,000 and limited to essential blocks, standard pavers,
              kerbstones, starter inventory, basic QC, utilities, and working capital.
            </p>
            <p>
              Public sharing should use a permanent hosted site such as Netlify, not a temporary laptop tunnel. Narrated video
              downloads use the installed US English Windows voice.
            </p>
          </div>
        </Panel>
      )}
      {tabContent[activeTab]}
    </Shell>
  );
}
