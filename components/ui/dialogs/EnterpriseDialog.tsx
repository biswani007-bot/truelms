"use client";

import React, { useEffect, useRef } from "react";
import { X, AlertTriangle, Info, CheckCircle2, ShieldAlert, Archive, Trash2, HelpCircle } from "lucide-react";
import { Portal } from "../portal";

export type DialogVariant = "info" | "success" | "warning" | "danger" | "archive" | "delete";

export interface EnterpriseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  description?: string | React.ReactNode;
  variant?: DialogVariant;
  icon?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void | Promise<void>;
  loading?: boolean;
  disabled?: boolean;
  children?: React.ReactNode;
  confirmVariant?: "primary" | "danger" | "success";
}

const VARIANT_CONFIGS: Record<
  DialogVariant,
  { iconBg: string; iconColor: string; defaultIcon: React.ReactNode; defaultConfirmVariant: "primary" | "danger" | "success" }
> = {
  info: {
    iconBg: "bg-indigo-50 border-indigo-100",
    iconColor: "text-indigo-600",
    defaultIcon: <Info className="size-5" />,
    defaultConfirmVariant: "primary",
  },
  success: {
    iconBg: "bg-emerald-50 border-emerald-100",
    iconColor: "text-emerald-600",
    defaultIcon: <CheckCircle2 className="size-5" />,
    defaultConfirmVariant: "success",
  },
  warning: {
    iconBg: "bg-amber-50 border-amber-100",
    iconColor: "text-amber-600",
    defaultIcon: <AlertTriangle className="size-5" />,
    defaultConfirmVariant: "primary",
  },
  danger: {
    iconBg: "bg-red-50 border-red-100",
    iconColor: "text-red-600",
    defaultIcon: <ShieldAlert className="size-5" />,
    defaultConfirmVariant: "danger",
  },
  archive: {
    iconBg: "bg-amber-50 border-amber-100",
    iconColor: "text-amber-700",
    defaultIcon: <Archive className="size-5" />,
    defaultConfirmVariant: "danger",
  },
  delete: {
    iconBg: "bg-red-50 border-red-100",
    iconColor: "text-red-600",
    defaultIcon: <Trash2 className="size-5" />,
    defaultConfirmVariant: "danger",
  },
};

export function EnterpriseDialog({
  isOpen,
  onClose,
  title,
  subtitle,
  description,
  variant = "info",
  icon,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  loading = false,
  disabled = false,
  children,
  confirmVariant,
}: EnterpriseDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const config = VARIANT_CONFIGS[variant];

  // Close on ESC
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen && !loading) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, loading, onClose]);

  // Lock body scroll when dialog is active
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const btnConfirmVariant = confirmVariant || config.defaultConfirmVariant;

  const btnClasses = {
    primary: "bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs shadow-indigo-200",
    danger: "bg-red-600 hover:bg-red-700 text-white shadow-xs shadow-red-200",
    success: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs shadow-emerald-200",
  };

  return (
    <Portal>
      <div
        aria-modal="true"
        role="dialog"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 animate-fade-in"
      >
        {/* Glass Backdrop */}
        <div
          onClick={() => {
            if (!loading) onClose();
          }}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        />

        {/* Dialog Surface */}
        <div
          ref={dialogRef}
          className="relative w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-[var(--lms-shadow-xl)] overflow-hidden z-10 animate-scale-in flex flex-col max-h-[calc(100vh-2.5rem)] sm:max-h-[calc(100vh-4rem)]"
        >
          {/* Header */}
          <div className="flex items-start justify-between p-5 sm:p-6 pb-4 border-b border-slate-100 gap-4 shrink-0">
            <div className="flex items-start gap-3.5 min-w-0">
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${config.iconBg} ${config.iconColor}`}>
                {icon || config.defaultIcon}
              </div>
              <div className="min-w-0">
                <h2 className="lms-card-title text-slate-900 truncate">{title}</h2>
                {subtitle && <p className="lms-caption mt-0.5 truncate">{subtitle}</p>}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors shrink-0"
              aria-label="Close dialog"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
            {description && (
              <div className="lms-body-sm text-slate-600 leading-relaxed">
                {description}
              </div>
            )}
            {children}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-5 sm:px-6 py-4 bg-slate-50/60 border-t border-slate-100 shrink-0">
            {cancelLabel && (
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 rounded-xl lms-button-text text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-100 transition-colors disabled:opacity-50"
              >
                {cancelLabel}
              </button>
            )}
            {onConfirm && (
              <button
                type="button"
                onClick={onConfirm}
                disabled={disabled || loading}
                className={`px-4 py-2 rounded-xl lms-button-text transition-colors flex items-center gap-2 disabled:opacity-50 ${btnClasses[btnConfirmVariant]}`}
              >
                {loading && (
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                {confirmLabel}
              </button>
            )}
          </div>
        </div>
      </div>
    </Portal>
  );
}

// ── Specialized Reusable Dialog Helpers ───────────────────────

export function ConfirmationDialog(props: Omit<EnterpriseDialogProps, "variant">) {
  return <EnterpriseDialog variant="info" {...props} />;
}

export function DeleteDialog(props: Omit<EnterpriseDialogProps, "variant">) {
  return <EnterpriseDialog variant="delete" confirmLabel={props.confirmLabel || "Delete Record"} {...props} />;
}

export function ArchiveDialog(props: Omit<EnterpriseDialogProps, "variant">) {
  return <EnterpriseDialog variant="archive" confirmLabel={props.confirmLabel || "Archive"} {...props} />;
}

export function ApprovalDialog(props: Omit<EnterpriseDialogProps, "variant">) {
  return <EnterpriseDialog variant="success" confirmLabel={props.confirmLabel || "Approve"} {...props} />;
}

export function ErrorDialog(props: Omit<EnterpriseDialogProps, "variant">) {
  return <EnterpriseDialog variant="danger" confirmLabel={props.confirmLabel || "Understand"} cancelLabel="" {...props} />;
}
