import type { ReactNode } from "react";

const tones = {
  navy: "bg-factory-navy text-white",
  green: "bg-factory-green text-white",
  amber: "bg-factory-amber text-white",
  clay: "bg-factory-clay text-white",
  blue: "bg-factory-blue text-white",
  white: "bg-white text-factory-ink border border-slate-200",
};

export function MetricCard({
  label,
  value,
  tone = "white",
  icon,
}: {
  label: string;
  value: string;
  tone?: keyof typeof tones;
  icon?: ReactNode;
}) {
  return (
    <section className={`${tones[tone]} rounded-md p-4 shadow-soft`}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] opacity-75">{label}</p>
        {icon ? <span className="shrink-0 opacity-80">{icon}</span> : null}
      </div>
      <p className="mt-4 text-2xl font-semibold tracking-normal">{value}</p>
    </section>
  );
}
