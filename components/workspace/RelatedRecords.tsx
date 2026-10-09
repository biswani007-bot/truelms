import * as React from "react";

export interface RelatedRecordsProps {
  title: string;
  count?: number;
  children: React.ReactNode;
}

export function RelatedRecords({ title, count, children }: RelatedRecordsProps) {
  return (
    <div className="bg-white border rounded-xl shadow-sm overflow-hidden space-y-2">
      <div className="p-4 border-b bg-gray-50 font-bold text-sm text-gray-900 flex justify-between items-center">
        <span>{title}</span>
        {count !== undefined && <span className="text-xs text-gray-400 font-semibold">{count} records</span>}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}
