import * as React from "react";
import { cn } from "@/lib/utils";

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: string;
  size?: "sm" | "md";
  showDot?: boolean;
}

const STATUS_CONFIG: Record<
  string,
  { classes: string; dotColor: string; label?: string }
> = {
  // States
  draft:              { classes: "bg-slate-100 text-slate-600 border-slate-200",      dotColor: "bg-slate-400" },
  pending:            { classes: "bg-amber-50 text-amber-700 border-amber-200",       dotColor: "bg-amber-500" },
  "in review":        { classes: "bg-indigo-50 text-indigo-700 border-indigo-200",    dotColor: "bg-indigo-500" },
  "in-review":        { classes: "bg-indigo-50 text-indigo-700 border-indigo-200",    dotColor: "bg-indigo-500" },
  approved:           { classes: "bg-emerald-50 text-emerald-700 border-emerald-200", dotColor: "bg-emerald-500" },
  rejected:           { classes: "bg-red-50 text-red-700 border-red-200",             dotColor: "bg-red-500" },
  active:             { classes: "bg-emerald-50 text-emerald-700 border-emerald-200", dotColor: "bg-emerald-500" },
  inactive:           { classes: "bg-slate-100 text-slate-500 border-slate-200",      dotColor: "bg-slate-400" },
  published:          { classes: "bg-emerald-50 text-emerald-700 border-emerald-200", dotColor: "bg-emerald-500" },
  unpublished:        { classes: "bg-slate-100 text-slate-500 border-slate-200",      dotColor: "bg-slate-400" },
  archived:           { classes: "bg-slate-100 text-slate-500 border-slate-200",      dotColor: "bg-slate-400" },
  completed:          { classes: "bg-emerald-50 text-emerald-700 border-emerald-200", dotColor: "bg-emerald-500" },
  cancelled:          { classes: "bg-slate-100 text-slate-600 border-slate-200",      dotColor: "bg-slate-400" },
  failed:             { classes: "bg-red-50 text-red-700 border-red-200",             dotColor: "bg-red-500" },
  processing:         { classes: "bg-sky-50 text-sky-700 border-sky-200",             dotColor: "bg-sky-500" },
  success:            { classes: "bg-emerald-50 text-emerald-700 border-emerald-200", dotColor: "bg-emerald-500" },
  warning:            { classes: "bg-amber-50 text-amber-700 border-amber-200",       dotColor: "bg-amber-500" },
  info:               { classes: "bg-indigo-50 text-indigo-700 border-indigo-200",    dotColor: "bg-indigo-500" },
  paid:               { classes: "bg-emerald-50 text-emerald-700 border-emerald-200", dotColor: "bg-emerald-500" },
  unpaid:             { classes: "bg-amber-50 text-amber-700 border-amber-200",       dotColor: "bg-amber-500" },
  overdue:            { classes: "bg-red-50 text-red-700 border-red-200",             dotColor: "bg-red-500" },
  refunded:           { classes: "bg-violet-50 text-violet-700 border-violet-200",    dotColor: "bg-violet-500" },
  issued:             { classes: "bg-emerald-50 text-emerald-700 border-emerald-200", dotColor: "bg-emerald-500" },
  revoked:            { classes: "bg-red-50 text-red-700 border-red-200",             dotColor: "bg-red-500" },
  new:                { classes: "bg-sky-50 text-sky-700 border-sky-200",             dotColor: "bg-sky-500" },
  contacted:          { classes: "bg-indigo-50 text-indigo-700 border-indigo-200",    dotColor: "bg-indigo-500" },
  converted:          { classes: "bg-emerald-50 text-emerald-700 border-emerald-200", dotColor: "bg-emerald-500" },
  lost:               { classes: "bg-slate-100 text-slate-500 border-slate-200",      dotColor: "bg-slate-400" },
  "learning-started": { classes: "bg-indigo-50 text-indigo-700 border-indigo-200",    dotColor: "bg-indigo-500" },
  operational:        { classes: "bg-emerald-50 text-emerald-700 border-emerald-200", dotColor: "bg-emerald-500" },
  degraded:           { classes: "bg-amber-50 text-amber-700 border-amber-200",       dotColor: "bg-amber-500" },
  outage:             { classes: "bg-red-50 text-red-700 border-red-200",             dotColor: "bg-red-500" },
};

export function StatusBadge({
  status,
  size = "md",
  showDot = false,
  className,
  ...props
}: StatusBadgeProps) {
  const key = status.toLowerCase().trim();
  const config = STATUS_CONFIG[key] ?? {
    classes: "bg-slate-100 text-slate-500 border-slate-200",
    dotColor: "bg-slate-400",
  };

  const sizeClasses =
    size === "sm"
      ? "px-2 py-0.5 text-[10px]"
      : "px-2.5 py-0.5 text-[11px]";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-bold border",
        sizeClasses,
        config.classes,
        className
      )}
      {...props}
    >
      {showDot && (
        <span
          className={cn("w-1.5 h-1.5 rounded-full shrink-0", config.dotColor)}
        />
      )}
      {status}
    </span>
  );
}
