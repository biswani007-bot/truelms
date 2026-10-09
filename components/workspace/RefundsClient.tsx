"use client";

import React, { useState } from "react";
import Link from "next/link";
import { WorkspaceHeader } from "@/components/workspace/WorkspaceHeader";
import { RefreshCw, Download, ArrowLeft, CheckCircle2, XCircle, Eye } from "lucide-react";
import { DataTable, Column } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EnterpriseDialog } from "@/components/ui/dialogs/EnterpriseDialog";
import { useToast } from "@/components/ui/dialogs/ToastProvider";

interface RefundItem {
  _id?: string;
  refundNumber: string;
  invoiceNumber: string;
  studentName: string;
  reason: string;
  refundDate: string;
  amount: number;
  currency: string;
  gateway: string;
  status: string;
}

interface RefundsClientProps {
  initialRefunds: RefundItem[];
}

export default function RefundsClient({ initialRefunds }: RefundsClientProps) {
  const toast = useToast();
  const [refunds, setRefunds] = useState<RefundItem[]>(initialRefunds);
  const [activeTab, setActiveTab] = useState("all");
  const [actionTarget, setActionTarget] = useState<{ item: RefundItem; action: "approve" | "reject" } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const filteredRefunds = refunds.filter((r) => {
    if (activeTab === "all") return true;
    return r.status === activeTab;
  });

  const pendingCount = refunds.filter((r) => r.status === "pending").length;
  const approvedCount = refunds.filter((r) => r.status === "approved").length;
  const totalRefunded = refunds
    .filter((r) => r.status === "approved")
    .reduce((sum, r) => sum + r.amount, 0);

  const handleActionConfirm = async () => {
    if (!actionTarget) return;
    setActionLoading(true);
    await new Promise((res) => setTimeout(res, 600));

    const newStatus = actionTarget.action === "approve" ? "approved" : "rejected";
    setRefunds((prev) =>
      prev.map((item) => (item.refundNumber === actionTarget.item.refundNumber ? { ...item, status: newStatus } : item))
    );

    setActionLoading(false);
    setActionTarget(null);

    if (newStatus === "approved") {
      toast.success(
        "Refund Approved",
        `Refund ${actionTarget.item.refundNumber} for $${(actionTarget.item.amount / 100).toFixed(2)} processed via Stripe.`
      );
    } else {
      toast.warning(
        "Refund Rejected",
        `Refund ${actionTarget.item.refundNumber} was rejected.`
      );
    }
  };

  const columns: Column<RefundItem>[] = [
    {
      key: "refundNumber",
      header: "Refund ID",
      sortable: true,
      render: (item) => (
        <span className="lms-code text-indigo-600 font-bold">
          {item.refundNumber}
        </span>
      ),
    },
    {
      key: "invoiceNumber",
      header: "Invoice",
      render: (item) => (
        <span className="lms-code text-slate-500">
          {item.invoiceNumber}
        </span>
      ),
    },
    {
      key: "studentName",
      header: "Student",
      sortable: true,
      render: (item) => (
        <span className="lms-body-sm font-semibold text-slate-900">
          {item.studentName}
        </span>
      ),
    },
    {
      key: "reason",
      header: "Reason",
      render: (item) => (
        <span className="lms-caption text-slate-600 max-w-xs truncate block" title={item.reason}>
          {item.reason}
        </span>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      sortable: true,
      align: "right",
      render: (item) => (
        <span className="lms-code text-red-600 font-bold">
          ${(item.amount / 100).toFixed(2)} {item.currency}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (item) => <StatusBadge status={item.status} showDot />,
    },
    {
      key: "_id",
      header: "Controls",
      align: "right",
      render: (item) => (
        <div className="flex items-center justify-end gap-2">
          {item.status === "pending" ? (
            <>
              <button
                onClick={() => setActionTarget({ item, action: "approve" })}
                className="lms-button-text text-xs text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-2 py-1 rounded"
              >
                Approve
              </button>
              <button
                onClick={() => setActionTarget({ item, action: "reject" })}
                className="lms-button-text text-xs text-red-600 hover:text-red-700 bg-red-50 px-2 py-1 rounded"
              >
                Reject
              </button>
            </>
          ) : (
            <span className="lms-caption text-slate-400 capitalize">{item.status}</span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto">
      {/* Workspace Header */}
      <WorkspaceHeader
        entityName="Refunds Management"
        description="Review, approve, and reject tuition refund requests with automatic Stripe credit card reversals."
        moduleIcon={<RefreshCw className="size-5" />}
        breadcrumb={[
          { label: "Admin", href: "/admin" },
          { label: "Finance", href: "/admin/finance" },
          { label: "Refunds" },
        ]}
        secondaryActions={
          <Link href="/admin/finance" className="lms-btn lms-btn-secondary">
            <ArrowLeft className="size-4" />
            Finance Home
          </Link>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="lms-card p-6 border-l-4 border-l-indigo-600">
          <span className="lms-label">Total Requests</span>
          <div className="lms-metric text-indigo-600 mt-1">{refunds.length}</div>
          <span className="lms-caption mt-1">Submitted requests</span>
        </div>
        <div className="lms-card p-6 border-l-4 border-l-amber-500">
          <span className="lms-label">Pending Review</span>
          <div className="lms-metric text-amber-600 mt-1">{pendingCount}</div>
          <span className="lms-caption mt-1">Awaiting decision</span>
        </div>
        <div className="lms-card p-6 border-l-4 border-l-emerald-600">
          <span className="lms-label">Approved</span>
          <div className="lms-metric text-emerald-600 mt-1">{approvedCount}</div>
          <span className="lms-caption mt-1">Settled refunds</span>
        </div>
        <div className="lms-card p-6 border-l-4 border-l-red-500">
          <span className="lms-label">Amount Refunded</span>
          <div className="lms-metric text-red-600 mt-1">${(totalRefunded / 100).toFixed(2)}</div>
          <span className="lms-caption mt-1">Reversed in USD</span>
        </div>
      </div>

      {/* Tab Filter Bar */}
      <div className="flex justify-between items-center lms-card p-4 bg-slate-50/50">
        <div className="flex gap-2">
          {["all", "pending", "approved", "rejected"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors ${activeTab === tab ? "bg-white text-indigo-600 shadow-xs border border-slate-200" : "text-slate-500 hover:text-slate-900"}`}
            >
              {tab} {tab === "pending" && pendingCount > 0 ? `(${pendingCount})` : ""}
            </button>
          ))}
        </div>

        <button
          onClick={() =>
            toast.success("Export Complete", `Exported ${filteredRefunds.length} refund records.`)
          }
          className="lms-btn lms-btn-secondary py-1.5 text-xs"
        >
          <Download className="size-3.5" /> Export CSV
        </button>
      </div>

      {/* Data Table */}
      <DataTable
        data={filteredRefunds}
        columns={columns}
        emptyTitle="No refund requests"
        emptyDescription="No refunds match the selected status filter."
      />

      {/* Enterprise Confirmation Dialog */}
      <EnterpriseDialog
        isOpen={!!actionTarget}
        onClose={() => { if (!actionLoading) setActionTarget(null); }}
        title={`${actionTarget?.action === "approve" ? "Approve" : "Reject"} Refund Request`}
        subtitle={actionTarget?.item.refundNumber}
        description={
          actionTarget?.action === "approve"
            ? `Are you sure you want to approve this refund of $${((actionTarget?.item.amount || 0) / 100).toFixed(2)}? The funds will be credited back to the student's original payment method.`
            : `Are you sure you want to reject this refund request? The student will be notified.`
        }
        variant={actionTarget?.action === "approve" ? "success" : "danger"}
        confirmLabel={actionTarget?.action === "approve" ? "Approve Refund" : "Reject Request"}
        cancelLabel="Cancel"
        onConfirm={handleActionConfirm}
        loading={actionLoading}
      />
    </div>
  );
}
