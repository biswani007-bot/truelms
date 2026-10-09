import * as React from "react";
import { cn } from "@/lib/utils";
import { SearchX, PackageOpen, ShieldOff, Inbox } from "lucide-react";

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  variant?: "default" | "search" | "error" | "permission";
  size?: "sm" | "md" | "lg";
}

const VARIANT_ICONS: Record<string, React.ReactNode> = {
  default:    <Inbox className="size-7 text-slate-400" />,
  search:     <SearchX className="size-7 text-slate-400" />,
  error:      <PackageOpen className="size-7 text-slate-400" />,
  permission: <ShieldOff className="size-7 text-slate-400" />,
};

const SIZE_CONFIG = {
  sm: { wrapper: "p-8",   icon: "w-12 h-12", title: "text-sm",  desc: "text-xs max-w-xs" },
  md: { wrapper: "p-12",  icon: "w-14 h-14", title: "text-sm",  desc: "text-xs max-w-sm" },
  lg: { wrapper: "p-16",  icon: "w-16 h-16", title: "text-base",desc: "text-sm max-w-md" },
};

export function EmptyState({
  title,
  description,
  icon,
  action,
  variant = "default",
  size = "md",
  className,
  ...props
}: EmptyStateProps) {
  const sizeConfig = SIZE_CONFIG[size];
  const displayIcon = icon ?? VARIANT_ICONS[variant];

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        "border border-dashed border-slate-200 rounded-2xl",
        "bg-slate-50/40",
        sizeConfig.wrapper,
        className
      )}
      {...props}
    >
      {displayIcon && (
        <div
          className={cn(
            "flex items-center justify-center rounded-2xl bg-slate-100/80 mb-4 shrink-0",
            sizeConfig.icon
          )}
        >
          {displayIcon}
        </div>
      )}
      <h3 className={cn("font-bold text-slate-800 mb-1.5", sizeConfig.title)}>
        {title}
      </h3>
      <p
        className={cn(
          "text-slate-500 leading-relaxed mb-4",
          sizeConfig.desc
        )}
      >
        {description}
      </p>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
