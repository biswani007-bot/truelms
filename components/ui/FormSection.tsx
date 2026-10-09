import * as React from "react";
import { cn } from "@/lib/utils";

export interface FormSectionProps extends React.FormHTMLAttributes<HTMLFormElement> {
  title: string;
  description?: string;
  headerAction?: React.ReactNode;
}

export function FormSection({
  title,
  description,
  headerAction,
  children,
  className,
  ...props
}: FormSectionProps) {
  return (
    <form
      className={cn(
        "dashboard-card overflow-hidden",
        className
      )}
      {...props}
    >
      {/* Form Header */}
      <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between gap-4">
        <div>
          <h2 className="lms-section-title">{title}</h2>
          {description && (
            <p className="lms-caption mt-1 max-w-xl">{description}</p>
          )}
        </div>
        {headerAction && <div className="shrink-0">{headerAction}</div>}
      </div>

      {/* Form Body */}
      <div className="p-6 space-y-5">{children}</div>
    </form>
  );
}

export function FormGroup({
  children,
  cols = 2,
  className,
}: {
  children: React.ReactNode;
  cols?: 1 | 2 | 3;
  className?: string;
}) {
  const colClasses = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-3",
  };
  return (
    <div className={cn("grid gap-4", colClasses[cols], className)}>
      {children}
    </div>
  );
}

export function FormField({
  label,
  required,
  hint,
  error,
  children,
  className,
}: {
  label?: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <label className="lms-label text-slate-600">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      {children}
      {hint && !error && (
        <p className="text-xs text-slate-400 font-medium">{hint}</p>
      )}
      {error && (
        <p className="text-xs text-red-600 font-semibold">{error}</p>
      )}
    </div>
  );
}

export function FormDivider({ label }: { label?: string }) {
  if (label) {
    return (
      <div className="flex items-center gap-3 my-1">
        <div className="flex-1 h-px bg-slate-100" />
        <span className="lms-label">{label}</span>
        <div className="flex-1 h-px bg-slate-100" />
      </div>
    );
  }
  return <div className="h-px bg-slate-100 my-1" />;
}
