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
  ShoppingCart,
  Store,
} from "lucide-react";

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
  { id: "report", label: "Master PDF", icon: <FileText size={18} /> },
];

export function Shell({
  activeTab,
  onTabChange,
  children,
}: {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen max-w-full overflow-x-hidden bg-factory-paper">
      <div className="flex w-full max-w-full items-center justify-center gap-2 bg-amber-500 px-3 py-2 text-center text-sm font-bold tracking-wide text-slate-950 shadow-md">
        <span aria-hidden="true">🚚</span>
        <span className="min-w-0 leading-5">
          FREE SITE DELIVERY | Complimentary Fleet Transportation Directly To Your Construction Site Across the Mbarara Region
          (On Qualifying Bulk Orders).
        </span>
      </div>
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-3 py-4 sm:px-4 lg:px-6">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-factory-green">UGX-only integrated planning system</p>
            <h1 className="mt-1 break-words text-xl font-semibold tracking-normal text-factory-navy">
              Mbarara Integrated Concrete Products Factory
            </h1>
          </div>
          <div className="flex min-w-0 items-center gap-2 rounded-md bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700">
            <Landmark size={17} className="shrink-0" />
            Investor, Engineering, Financial & Expansion Master Report 2026-2035
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-5 px-3 py-5 sm:px-4 lg:grid-cols-[minmax(0,250px)_minmax(0,1fr)] lg:px-6">
        <nav className="touch-scroll flex h-fit max-w-full gap-2 overflow-x-auto rounded-md border border-slate-200 bg-white p-2 shadow-sm lg:block">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onTabChange(item.id)}
              className={`mb-1 flex shrink-0 items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-semibold lg:w-full ${
                activeTab === item.id ? "bg-factory-navy text-white" : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
        <main className="min-w-0 space-y-5">{children}</main>
      </div>
    </div>
  );
}
