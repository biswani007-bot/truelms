import * as React from "react";
import { cn } from "@/lib/utils";

export type DashboardCardVariant =
  | "default"
  | "metric"
  | "analytics"
  | "insight"
  | "alert";

export interface DashboardCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  headerAction?: React.ReactNode;
  footer?: React.ReactNode;
  variant?: DashboardCardVariant;
  noPadding?: boolean;
}

const VARIANT_CLASSES: Record<DashboardCardVariant, string> = {
  default:   "dashboard-card",
  metric:    "dashboard-card hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200",
  analytics: "dashboard-card",
  insight:   "bg-indigo-50 border border-indigo-200/60 rounded-2xl",
  alert:     "bg-amber-50 border border-amber-200/60 rounded-2xl",
};

export function DashboardCard({
  title,
  subtitle,
  headerAction,
  footer,
  variant = "default",
  noPadding = false,
  children,
  className,
  ...props
}: DashboardCardProps) {
  return (
    <div
      className={cn(VARIANT_CLASSES[variant], className)}
      {...props}
    >
      {/* Header */}
      <div
        className={cn(
          "flex justify-between items-start",
          noPadding ? "px-6 pt-5 pb-4" : "px-6 pt-5 pb-0"
        )}
      >
        <div className="min-w-0 flex-1 pr-3">
          <h3 className="lms-card-title truncate">{title}</h3>
          {subtitle && (
            <p className="lms-caption mt-0.5 truncate">{subtitle}</p>
          )}
        </div>
        {headerAction && (
          <div className="shrink-0">{headerAction}</div>
        )}
      </div>

      {/* Content */}
      <div className={cn("flex-1", noPadding ? "" : "p-6 pt-4")}>
        {children}
      </div>

      {/* Footer */}
      {footer && (
        <div className="px-6 py-3.5 border-t border-slate-100">
          {footer}
        </div>
      )}
    </div>
  );
}
