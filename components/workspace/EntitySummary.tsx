import * as React from "react";

export interface SummaryField {
  label: string;
  value: React.ReactNode;
}

export function EntitySummary({ fields }: { fields: SummaryField[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 border rounded-xl">
      {fields.map((f, idx) => (
        <div key={idx} className="space-y-1">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">{f.label}</div>
          <div className="text-sm font-bold text-gray-900 truncate">{f.value}</div>
        </div>
      ))}
    </div>
  );
}
