"use client";

import React, { useState } from "react";
import Link from "next/link";
import { WorkspaceHeader } from "@/components/workspace/WorkspaceHeader";
import { Tag, Plus, Archive, Edit2, ArrowLeft } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EnterpriseDialog } from "@/components/ui/dialogs/EnterpriseDialog";
import { useToast } from "@/components/ui/dialogs/ToastProvider";

interface CouponItem {
  id: string;
  code: string;
  type: string;
  value: string;
  limits: string;
  usageCount: number;
  status: string;
}

export default function DiscountEngine() {
  const toast = useToast();
  const [coupons, setCoupons] = useState<CouponItem[]>([
    { id: "d1", code: "EARLYBIRD10", type: "Percentage", value: "10% Off", limits: "First 100 Students", usageCount: 42, status: "active" },
    { id: "d2", code: "SIBLING150", type: "Fixed Amount", value: "$150 Off", limits: "Verified Siblings", usageCount: 18, status: "active" },
    { id: "d3", code: "MERIT2026", type: "Percentage", value: "25% Off", limits: "Academic Honors", usageCount: 8, status: "active" },
  ]);

  // Create Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [newType, setNewType] = useState("Percentage");
  const [newValue, setNewValue] = useState("");
  const [createLoading, setCreateLoading] = useState(false);

  // Archive Modal State
  const [archiveTarget, setArchiveTarget] = useState<CouponItem | null>(null);
  const [archiveLoading, setArchiveLoading] = useState(false);

  const handleCreateConfirm = async () => {
    if (!newCode.trim() || !newValue.trim()) {
      toast.error("Validation Error", "Coupon code and reduction value are required.");
      return;
    }

    setCreateLoading(true);
    await new Promise((res) => setTimeout(res, 500));

    const created: CouponItem = {
      id: `d-${Date.now()}`,
      code: newCode.trim().toUpperCase(),
      type: newType,
      value: newValue.trim(),
      limits: "Unlimited Use",
      usageCount: 0,
      status: "active",
    };

    setCoupons((prev) => [created, ...prev]);
    setCreateLoading(false);
    setShowCreateModal(false);
    setNewCode("");
    setNewValue("");
    toast.success("Coupon Created", `Discount code "${created.code}" has been configured.`);
  };

  const handleArchiveConfirm = async () => {
    if (!archiveTarget) return;
    setArchiveLoading(true);
    await new Promise((res) => setTimeout(res, 500));

    setCoupons((prev) =>
      prev.map((c) => (c.id === archiveTarget.id ? { ...c, status: "archived" } : c))
    );

    setArchiveLoading(false);
    toast.warning("Coupon Archived", `Discount code "${archiveTarget.code}" has been archived.`);
    setArchiveTarget(null);
  };

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto">
      {/* Workspace Header */}
      <WorkspaceHeader
        entityName="Discount & Coupon Engine"
        description="Configure sibling discounts, promotional coupons, merit waivers, and track usage limits across checkout flows."
        moduleIcon={<Tag className="size-5" />}
        breadcrumb={[
          { label: "Admin", href: "/admin" },
          { label: "Finance", href: "/admin/finance" },
          { label: "Coupons" },
        ]}
        primaryAction={
          <button
            onClick={() => {
              setNewCode("");
              setNewValue("");
              setShowCreateModal(true);
            }}
            className="lms-btn lms-btn-primary"
          >
            <Plus className="size-4" />
            Create Coupon
          </button>
        }
        secondaryActions={
          <Link href="/admin/finance" className="lms-btn lms-btn-secondary">
            <ArrowLeft className="size-4" />
            Finance Home
          </Link>
        }
      />

      {/* Coupons Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {coupons.map((c) => (
          <div key={c.id} className="lms-card p-6 flex flex-col justify-between border-t-4 border-t-indigo-600">
            <div>
              <div className="flex justify-between items-start mb-3">
                <span className="lms-code text-base font-bold text-indigo-600 tracking-wide bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-lg">
                  {c.code}
                </span>
                <StatusBadge status={c.status} showDot />
              </div>
              <div className="lms-metric text-2xl text-slate-900 mt-2">{c.value}</div>
              <p className="lms-caption text-slate-500 mt-1">{c.type} Reduction</p>
              <div className="mt-4 space-y-1 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Usage Rule:</span>
                  <span className="font-semibold text-slate-900">{c.limits}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Times Claimed:</span>
                  <span className="lms-code font-bold text-slate-900">{c.usageCount} checkouts</span>
                </div>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="lms-caption text-slate-400">Stripe Promo Ready</span>
              {c.status === "active" && (
                <button
                  onClick={() => setArchiveTarget(c)}
                  className="lms-button-text text-xs text-red-600 hover:text-red-700 flex items-center gap-1"
                >
                  <Archive className="size-3.5" /> Archive
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Create Coupon Modal */}
      <EnterpriseDialog
        isOpen={showCreateModal}
        onClose={() => { if (!createLoading) setShowCreateModal(false); }}
        title="Create Promotional Coupon"
        subtitle="Stripe & Checkout Engine"
        variant="info"
        confirmLabel="Create Coupon"
        cancelLabel="Cancel"
        onConfirm={handleCreateConfirm}
        loading={createLoading}
      >
        <div className="space-y-4">
          <div>
            <label className="lms-label block mb-1.5" htmlFor="cpn-code">
              Coupon Code
            </label>
            <input
              id="cpn-code"
              type="text"
              placeholder="e.g. SUMMER2026"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
              className="lms-input lms-code uppercase"
              disabled={createLoading}
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="lms-label block mb-1.5" htmlFor="cpn-type">
                Discount Type
              </label>
              <select
                id="cpn-type"
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                className="lms-input"
                disabled={createLoading}
              >
                <option value="Percentage">Percentage (%)</option>
                <option value="Fixed Amount">Fixed Amount ($)</option>
              </select>
            </div>
            <div>
              <label className="lms-label block mb-1.5" htmlFor="cpn-val">
                Reduction Value
              </label>
              <input
                id="cpn-val"
                type="text"
                placeholder="e.g. 15% Off or $100 Off"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                className="lms-input"
                disabled={createLoading}
              />
            </div>
          </div>
        </div>
      </EnterpriseDialog>

      {/* Archive Confirmation Dialog */}
      <EnterpriseDialog
        isOpen={!!archiveTarget}
        onClose={() => { if (!archiveLoading) setArchiveTarget(null); }}
        title="Archive Promotional Coupon"
        subtitle={archiveTarget?.code}
        description="Are you sure you want to archive this coupon code? Archived coupons will be disabled from student checkouts and cannot be redeemed."
        variant="archive"
        confirmLabel="Archive Coupon"
        cancelLabel="Cancel"
        onConfirm={handleArchiveConfirm}
        loading={archiveLoading}
      />
    </div>
  );
}
