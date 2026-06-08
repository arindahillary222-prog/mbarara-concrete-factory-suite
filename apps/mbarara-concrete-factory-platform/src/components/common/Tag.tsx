export function Tag({
  children,
  tone = "slate",
}: {
  children: string;
  tone?: "slate" | "green" | "amber" | "clay" | "blue";
}) {
  const classes = {
    slate: "bg-slate-100 text-slate-700",
    green: "bg-green-100 text-green-800",
    amber: "bg-amber-100 text-amber-800",
    clay: "bg-red-100 text-red-800",
    blue: "bg-blue-100 text-blue-800",
  };
  return <span className={`${classes[tone]} inline-flex rounded px-2 py-1 text-xs font-semibold`}>{children}</span>;
}
