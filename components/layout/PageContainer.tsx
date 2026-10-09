import * as React from "react";

export function PageContainer({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`p-6 max-w-7xl mx-auto space-y-6 ${className || ""}`}>
      {children}
    </div>
  );
}
