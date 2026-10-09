import * as React from "react";
import { cn } from "@/lib/utils";
import { StatusBadge } from "../ui/StatusBadge";
import { ChevronRight } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface WorkspaceHeaderProps {
  entityName: string;
  status?: string;
  entityId?: string;
  createdDate?: string;
  owner?: string;
  moduleIcon?: React.ReactNode;
  breadcrumb?: BreadcrumbItem[];
  primaryAction?: React.ReactNode;
  secondaryActions?: React.ReactNode;
  description?: string;
  className?: string;
}

export function WorkspaceHeader({
  entityName,
  status,
  entityId,
  createdDate,
  owner,
  moduleIcon,
  breadcrumb,
  primaryAction,
  secondaryActions,
  description,
  className,
}: WorkspaceHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4",
        "pb-5 border-b border-slate-200/80",
        className
      )}
    >
      <div className="min-w-0 flex-1">
        {/* Breadcrumb */}
        {breadcrumb && breadcrumb.length > 0 && (
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-1 mb-2"
          >
            {breadcrumb.map((crumb, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && (
                  <ChevronRight className="size-3 text-slate-300 shrink-0" />
                )}
                {crumb.href ? (
                  <a
                    href={crumb.href}
                    className="text-xs font-medium text-slate-400 hover:text-slate-700 transition-colors"
                  >
                    {crumb.label}
                  </a>
                ) : (
                  <span className="text-xs font-semibold text-indigo-600">
                    {crumb.label}
                  </span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}

        {/* Title row */}
        <div className="flex items-center gap-3">
          {moduleIcon && (
            <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
              {moduleIcon}
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="lms-page-title truncate">{entityName}</h1>
              {status && <StatusBadge status={status} showDot />}
            </div>
            {/* Meta row */}
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              {entityId && (
                <span className="lms-code text-slate-400">ID: {entityId}</span>
              )}
              {createdDate && (
                <span className="lms-caption">Created: {createdDate}</span>
              )}
              {owner && (
                <span className="lms-caption">Owner: {owner}</span>
              )}
            </div>
          </div>
        </div>

        {description && (
          <p className="lms-caption mt-2 max-w-2xl">{description}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {secondaryActions}
        {primaryAction}
      </div>
    </div>
  );
}
