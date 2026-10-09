import * as React from "react";

export interface QuickActionItem {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
  variant?: "primary" | "secondary";
}

export function QuickActions({ actions }: { actions: QuickActionItem[] }) {
  return (
    <div className="flex flex-wrap gap-3">
      {actions.map((act, idx) => (
        <button
          key={idx}
          onClick={act.onClick}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
            act.variant === "primary"
              ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
              : "bg-white border border-gray-250 text-gray-700 hover:bg-slate-50"
          }`}
        >
          {act.icon}
          {act.label}
        </button>
      ))}
    </div>
  );
}
