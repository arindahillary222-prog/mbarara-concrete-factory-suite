export function TextInput({
  label,
  value,
  onChange,
  type = "text",
  suffix,
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: string;
  suffix?: string;
}) {
  return (
    <label className="grid gap-1">
      <span className="text-xs font-medium text-slate-600">{label}</span>
      <div className="flex overflow-hidden rounded-md border border-slate-300 bg-white focus-within:border-factory-green focus-within:ring-2 focus-within:ring-factory-green/20">
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="min-w-0 flex-1 border-0 px-3 py-2 text-sm outline-none"
        />
        {suffix ? <span className="flex items-center border-l border-slate-200 bg-slate-50 px-2 text-xs font-semibold text-slate-500">{suffix}</span> : null}
      </div>
    </label>
  );
}

export function SelectInput({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-1">
      <span className="text-xs font-medium text-slate-600">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-factory-green focus:ring-2 focus:ring-factory-green/20"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
