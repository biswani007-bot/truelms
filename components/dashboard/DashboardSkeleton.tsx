import * as React from "react";

export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6 animate-pulse max-w-7xl mx-auto">
      <div className="h-8 bg-gray-200 rounded-md w-1/4" />
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 bg-gray-200 rounded-2xl" />
        ))}
      </div>
      <div className="h-64 bg-gray-200 rounded-2xl" />
    </div>
  );
}
