import * as React from "react";
import { FiAlertCircle } from "react-icons/fi";

export function ErrorAnimation({ message = "An error occurred while processing." }: { message?: string }) {
  return (
    <div className="flex items-center gap-2 p-3 bg-red-50 text-red-800 border border-red-200 rounded-xl text-xs font-bold animate-in fade-in zoom-in duration-200">
      <FiAlertCircle className="text-red-600 w-4 h-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}
