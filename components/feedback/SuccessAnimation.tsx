import * as React from "react";
import { FiCheckCircle } from "react-icons/fi";

export function SuccessAnimation({ message = "Operation completed successfully!" }: { message?: string }) {
  return (
    <div className="flex items-center gap-2 p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold animate-in fade-in zoom-in duration-200">
      <FiCheckCircle className="text-emerald-600 w-4 h-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}
