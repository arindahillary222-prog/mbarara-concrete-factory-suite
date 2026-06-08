import type { ReactNode, RefObject } from "react";

export function ChartCard({
  title,
  children,
  chartRef,
}: {
  title: string;
  children: ReactNode;
  chartRef?: RefObject<HTMLDivElement>;
}) {
  return (
    <section ref={chartRef} className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-2 text-sm font-semibold text-factory-navy">{title}</h3>
      <div className="h-[300px]">{children}</div>
    </section>
  );
}
