import type { ReactNode } from "react";
import {
  BarChart3,
  Boxes,
  ClipboardCheck,
  Database,
  Factory,
  FileText,
  FlaskConical,
  Landmark,
  PackageSearch,
  ReceiptText,
  ShieldCheck,
  ShoppingCart,
  Store,
} from "lucide-react";
import {
  displayLanguageOptions,
  exchangeRateNote,
  getDisplayLanguageConfig,
  languageCopy,
  type DisplayLanguageCode,
} from "../../lib/localization";

export type AppTab =
  | "website"
  | "dashboard"
  | "financials"
  | "inventory"
  | "production"
  | "quality"
  | "erp"
  | "market"
  | "database"
  | "software"
  | "report";

const navItems: { id: AppTab; label: string; icon: ReactNode }[] = [
  { id: "website", label: "Public Website", icon: <Store size={18} /> },
  { id: "dashboard", label: "Dashboard", icon: <BarChart3 size={18} /> },
  { id: "financials", label: "Financials", icon: <ReceiptText size={18} /> },
  { id: "inventory", label: "Inventory", icon: <Boxes size={18} /> },
  { id: "production", label: "Production", icon: <Factory size={18} /> },
  { id: "quality", label: "QC Lab", icon: <FlaskConical size={18} /> },
  { id: "erp", label: "ERP", icon: <ShoppingCart size={18} /> },
  { id: "market", label: "Market Intel", icon: <PackageSearch size={18} /> },
  { id: "database", label: "PostgreSQL", icon: <Database size={18} /> },
  { id: "software", label: "Software Core", icon: <ShieldCheck size={18} /> },
  { id: "report", label: "Master PDF", icon: <FileText size={18} /> },
];

export function Shell({
  activeTab,
  onTabChange,
  displayLanguage,
  onDisplayLanguageChange,
  children,
}: {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  displayLanguage: DisplayLanguageCode;
  onDisplayLanguageChange: (language: DisplayLanguageCode) => void;
  children: ReactNode;
}) {
  const copy = languageCopy[displayLanguage] ?? languageCopy.en;
  const selectedLanguage = getDisplayLanguageConfig(displayLanguage);

  return (
    <div className="min-h-screen max-w-full overflow-x-hidden bg-factory-paper">
      <div className="flex w-full max-w-full items-center justify-center gap-2 bg-amber-500 px-3 py-2 text-center text-sm font-bold tracking-wide text-slate-950 shadow-md">
        <span aria-hidden="true">🚚</span>
        <span className="min-w-0 leading-5">{copy.deliveryBanner}</span>
      </div>
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-3 py-4 sm:px-4 lg:px-6">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-factory-green">UGX-base integrated planning system</p>
            <h1 className="mt-1 break-words text-xl font-semibold tracking-normal text-factory-navy">
              Mbarara Integrated Concrete Products Factory
            </h1>
          </div>
          <div className="flex min-w-0 flex-wrap items-center justify-end gap-3">
            <div className="flex min-w-0 items-center gap-2 rounded-md bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700">
              <Landmark size={17} className="shrink-0" />
              Investor, Engineering, Financial & Expansion Master Report 2026-2035
            </div>
            <label className="grid min-w-[230px] gap-1 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm">
              <span>{copy.languageCurrency}</span>
              <select
                value={displayLanguage}
                onChange={(event) => onDisplayLanguageChange(event.target.value as DisplayLanguageCode)}
                className="w-full rounded-md border border-slate-300 bg-white px-2 py-2 text-sm font-bold text-slate-900"
              >
                {displayLanguageOptions.map((option) => (
                  <option key={option.code} value={option.code}>
                    {option.label} / {option.nativeLabel} - {option.currency}
                  </option>
                ))}
              </select>
            </label>
            <div className="max-w-sm rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold leading-5 text-slate-800">
              <p>{selectedLanguage.summary}</p>
              <p>{copy.baseAccounting}. {exchangeRateNote(displayLanguage)}.</p>
              <p>{copy.fxWarning}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-5 px-3 py-5 sm:px-4 lg:grid-cols-[minmax(0,250px)_minmax(0,1fr)] lg:px-6">
        <nav className="flex h-fit max-w-full flex-wrap gap-2 rounded-md border border-slate-200 bg-white p-2 shadow-sm lg:block">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onTabChange(item.id)}
              className={`mb-1 flex min-w-0 flex-1 items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-semibold sm:flex-none lg:w-full ${
                activeTab === item.id ? "bg-factory-navy text-white" : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              {item.icon}
              {copy.nav[item.id] ?? item.label}
            </button>
          ))}
        </nav>
        <main className="min-w-0 space-y-5">{children}</main>
      </div>
    </div>
  );
}
