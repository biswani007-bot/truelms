import * as React from "react";

export interface MetricCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  icon?: React.ReactNode;
  color?: "indigo" | "emerald" | "amber" | "red" | "teal" | "slate";
}

const COLOR_STYLES = {
  indigo: { val: "text-indigo-600", bg: "bg-indigo-50 text-indigo-600" },
  emerald: { val: "text-emerald-600", bg: "bg-emerald-50 text-emerald-600" },
  amber: { val: "text-amber-700", bg: "bg-amber-50 text-amber-600" },
  red: { val: "text-red-600", bg: "bg-red-50 text-red-600" },
  teal: { val: "text-teal-600", bg: "bg-teal-50 text-teal-600" },
  slate: { val: "text-gray-900", bg: "bg-slate-100 text-gray-600" }
};

export function MetricCard({
  label,
  value,
  subValue,
  icon,
  color = "indigo"
}: MetricCardProps) {
  const styles = COLOR_STYLES[color] || COLOR_STYLES.indigo;

  return (
    <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm flex items-center justify-between">
      <div>
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</span>
        <div className={`text-2xl font-black mt-1 ${styles.val}`}>{value}</div>
        {subValue && <div className="text-[11px] text-gray-400 mt-1 font-medium">{subValue}</div>}
      </div>
      {icon && <div className={`p-3 rounded-xl ${styles.bg}`}>{icon}</div>}
    </div>
  );
}

export function MetricGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {children}
    </div>
  );
}
