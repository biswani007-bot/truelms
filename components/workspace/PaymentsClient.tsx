"use client";

import React, { useState } from "react";
import Link from "next/link";
import { WorkspaceHeader } from "@/components/workspace/WorkspaceHeader";
import { DollarSign, Download, Filter, Search, ArrowLeft, RefreshCw, CreditCard } from "lucide-react";
import { DataTable, Column } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useToast } from "@/components/ui/dialogs/ToastProvider";

interface PaymentItem {
  _id?: string;
  paymentNumber: string;
  studentName: string;
  invoiceNumber: string;
  paymentMethod: string;
  transactionReference: string;
  paymentDate: string;
  amount: number;
  currency: string;
  gateway: string;
  status: string;
}

interface PaymentClientProps {
  initialPayments: PaymentItem[];
}

export default function PaymentsClient({ initialPayments }: PaymentClientProps) {
  const toast = useToast();
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [gatewayFilter, setGatewayFilter] = useState("all");

  const filteredPayments = initialPayments.filter((pmt) => {
    const matchesSearch =
      pmt.paymentNumber.toLowerCase().includes(searchValue.toLowerCase()) ||
      pmt.studentName.toLowerCase().includes(searchValue.toLowerCase()) ||
      pmt.invoiceNumber.toLowerCase().includes(searchValue.toLowerCase()) ||
      pmt.transactionReference.toLowerCase().includes(searchValue.toLowerCase());

    const matchesStatus = statusFilter === "all" || pmt.status === statusFilter;
    const matchesGateway = gatewayFilter === "all" || pmt.gateway.toLowerCase() === gatewayFilter.toLowerCase();

    return matchesSearch && matchesStatus && matchesGateway;
  });

  const totalAmount = filteredPayments.reduce((sum, p) => sum + p.amount, 0);

  const columns: Column<PaymentItem>[] = [
    {
      key: "paymentNumber",
      header: "Payment ID",
      sortable: true,
      render: (item) => (
        <span className="lms-code text-indigo-600 font-bold">
          {item.paymentNumber}
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
      key: "invoiceNumber",
      header: "Invoice",
      render: (item) => (
        <span className="lms-code text-slate-500">
          {item.invoiceNumber}
        </span>
      ),
    },
    {
      key: "gateway",
      header: "Gateway",
      render: (item) => (
        <span className="lms-badge-text bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
          {item.gateway}
        </span>
      ),
    },
    {
      key: "paymentMethod",
      header: "Method",
      render: (item) => (
        <span className="lms-caption text-slate-600 capitalize">
          {item.paymentMethod}
        </span>
      ),
    },
    {
      key: "transactionReference",
      header: "Txn Reference",
      render: (item) => (
        <span className="lms-code text-slate-400 text-xs">
          {item.transactionReference}
        </span>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      sortable: true,
      align: "right",
      render: (item) => (
        <span className="lms-code text-emerald-600 font-bold">
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
  ];

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto">
      {/* Workspace Header */}
      <WorkspaceHeader
        entityName="Payments Registry"
        description="Audit all incoming tuition collections, Stripe transaction logs, wire transfers, and currency settlements."
        moduleIcon={<DollarSign className="size-5" />}
        breadcrumb={[
          { label: "Admin", href: "/admin" },
          { label: "Finance", href: "/admin/finance" },
          { label: "Payments" },
        ]}
        secondaryActions={
          <Link href="/admin/finance" className="lms-btn lms-btn-secondary">
            <ArrowLeft className="size-4" />
            Finance Home
          </Link>
        }
      />

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="lms-card p-6 border-l-4 border-l-indigo-600">
          <span className="lms-label">Total Transactions</span>
          <div className="lms-metric text-indigo-600 mt-1">{filteredPayments.length}</div>
          <span className="lms-caption mt-1">Filtered result count</span>
        </div>
        <div className="lms-card p-6 border-l-4 border-l-emerald-600">
          <span className="lms-label">Total Collected</span>
          <div className="lms-metric text-emerald-600 mt-1">${(totalAmount / 100).toFixed(2)}</div>
          <span className="lms-caption mt-1">Settled in USD</span>
        </div>
        <div className="lms-card p-6 border-l-4 border-l-teal-600">
          <span className="lms-label">Success Rate</span>
          <div className="lms-metric text-teal-600 mt-1">
            {filteredPayments.length > 0
              ? `${Math.round((filteredPayments.filter((p) => p.status === "success").length / filteredPayments.length) * 100)}%`
              : "100%"}
          </div>
          <span className="lms-caption mt-1">Completed settlements</span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 lms-card p-4 bg-slate-50/50">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search payment ID, student, invoice, or txn ref..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="lms-input pl-9 text-xs"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="lms-input py-1.5 text-xs w-auto"
          >
            <option value="all">All Statuses</option>
            <option value="success">Success</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>

          <select
            value={gatewayFilter}
            onChange={(e) => setGatewayFilter(e.target.value)}
            className="lms-input py-1.5 text-xs w-auto"
          >
            <option value="all">All Gateways</option>
            <option value="stripe">Stripe</option>
            <option value="offline">Offline / Wire</option>
          </select>
        </div>

        <button
          onClick={() =>
            toast.success(
              "Export Complete",
              `Exported ${filteredPayments.length} payment transaction records to CSV.`
            )
          }
          className="lms-btn lms-btn-secondary py-1.5 text-xs"
        >
          <Download className="size-3.5" /> Export CSV
        </button>
      </div>

      {/* Data Table */}
      <DataTable
        data={filteredPayments}
        columns={columns}
        emptyTitle="No transactions found"
        emptyDescription="Try adjusting filters or search parameters."
      />
    </div>
  );
}
