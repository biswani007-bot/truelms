import * as React from "react";
import { FiInfo, FiAlertTriangle, FiCheckCircle } from "react-icons/fi";

export interface InsightCardProps {
  title: string;
  message: string;
  type?: "info" | "warning" | "success";
}

const TYPE_CONFIG = {
  info: { bg: "bg-indigo-50/60 border-indigo-150 text-indigo-900", icon: <FiInfo className="text-indigo-600 shrink-0 mt-0.5" /> },
  warning: { bg: "bg-amber-50/60 border-amber-150 text-amber-900", icon: <FiAlertTriangle className="text-amber-600 shrink-0 mt-0.5" /> },
  success: { bg: "bg-emerald-50/60 border-emerald-150 text-emerald-900", icon: <FiCheckCircle className="text-emerald-600 shrink-0 mt-0.5" /> }
};

export function InsightCard({ title, message, type = "info" }: InsightCardProps) {
  const config = TYPE_CONFIG[type] || TYPE_CONFIG.info;

  return (
    <div className={`p-4 rounded-xl border flex items-start gap-3 text-xs leading-relaxed ${config.bg}`}>
      {config.icon}
      <div>
        <div className="font-bold">{title}</div>
        <div className="mt-0.5 text-gray-600">{message}</div>
      </div>
    </div>
  );
}
