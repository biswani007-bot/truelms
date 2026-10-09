import * as React from "react";
import { FiRefreshCw, FiDownload } from "react-icons/fi";

export interface DashboardHeaderProps {
  title: string;
  description?: string;
  onRefresh?: () => void;
  onExport?: () => void;
  children?: React.ReactNode;
}

export function DashboardHeader({
  title,
  description,
  onRefresh,
  onExport,
  children
}: DashboardHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-gray-150">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">{title}</h1>
        {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {children}
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="p-2 border bg-white hover:bg-gray-50 rounded-lg text-gray-600 transition"
            title="Refresh Data"
          >
            <FiRefreshCw className="w-4 h-4" />
          </button>
        )}
        {onExport && (
          <button
            onClick={onExport}
            className="px-3 py-1.5 border bg-white hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-bold transition flex items-center gap-1.5"
          >
            <FiDownload /> Export
          </button>
        )}
      </div>
    </div>
  );
}
