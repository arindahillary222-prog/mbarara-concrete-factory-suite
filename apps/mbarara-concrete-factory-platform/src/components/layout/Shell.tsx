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
    <div className="min-h-screen bg-factory-paper">
      <div className="bg-amber-500 text-slate-950 font-bold text-center py-2 text-sm tracking-wide shadow-md flex justify-center items-center gap-2">
        <span aria-hidden="true">🚚</span>
        <span>
          FREE SITE DELIVERY | Complimentary Fleet Transportation Directly To Your Construction Site Across the Mbarara Region
          (On Qualifying Bulk Orders).
        </span>
      </div>
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-4 px-4 py-4 lg:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-factory-green">UGX-only integrated planning system</p>
            <h1 className="mt-1 text-xl font-semibold tracking-normal text-factory-navy">
              Mbarara Integrated Concrete Products Factory
            </h1>
          </div>
          <div className="flex items-center gap-2 rounded-md bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700">
            <Landmark size={17} />
            Investor, Engineering, Financial & Expansion Master Report 2026-2035
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1600px] gap-5 px-4 py-5 lg:grid-cols-[250px_1fr] lg:px-6">
        <nav className="h-fit rounded-md border border-slate-200 bg-white p-2 shadow-sm">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onTabChange(item.id)}
              className={`mb-1 flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-semibold ${
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
