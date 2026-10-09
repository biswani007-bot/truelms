import * as React from "react";
import { Spinner } from "../ui/spinner";

export function LoadingOverlay({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="fixed inset-0 bg-white/70 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-3">
      <Spinner className="h-8 w-8" />
      <span className="text-xs font-bold text-gray-700">{label}</span>
    </div>
  );
}
