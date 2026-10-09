import * as React from "react";

export function WorkspaceSkeleton() {
  return (
    <div className="flex flex-col gap-6 animate-pulse max-w-7xl mx-auto p-4">
      <div className="h-8 bg-gray-200 rounded-md w-1/3" />
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 bg-gray-200 rounded-xl" />
        ))}
      </div>
      <div className="h-96 bg-gray-200 rounded-xl" />
    </div>
  );
}
