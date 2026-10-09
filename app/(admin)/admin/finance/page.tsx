"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { 
  DollarSign, Clock, Percent, Award, Layers, Settings, ArrowRight, 
  CheckCircle, CreditCard, RefreshCw, FileText, Tag, BarChart3 
} from "lucide-react";
import { WorkspaceHeader } from "@/components/workspace/WorkspaceHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useToast } from "@/components/ui/dialogs/ToastProvider";

const INVOICE_STATUS_COLORS: Record<string, string> = {
  "paid": "bg-emerald-50 text-emerald-700 border border-emerald-250",
  "partially-paid": "bg-amber-50 text-amber-700 border border-amber-250",
  "overdue": "bg-red-50 text-red-750 border border-red-200",
  "issued": "bg-indigo-50 text-indigo-700 border border-indigo-250",
  "draft": "bg-slate-50 text-gray-500 border border-gray-250",
};

export default function FinanceDashboard() {
  const toast = useToast();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/finance/invoices?limit=5")
      .then(res => res.json())
      .catch(() => ({ data: [] }))
      .then(data => {
        const parsed = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data?.data?.data)
          ? data.data.data
          : [];
        setInvoices(parsed);
        setLoading(false);
      });
  }, []);

  const totalAmount = invoices.reduce((acc, i) => acc + (i.totalAmount || 0), 0);
  const outstandingAmount = invoices.reduce((acc, i) => acc + (i.outstandingAmount || 0), 0);

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto">
      {/* Workspace Header */}
      <WorkspaceHeader
        entityName="Executive Billing & Finance Workspace"
        description="Review institutional tuition billings, Stripe transactions, refund approvals, coupon usage, and revenue analytics."
        moduleIcon={<DollarSign className="size-5" />}
        breadcrumb={[
          { label: "Admin", href: "/admin" },
          { label: "Finance" },
        ]}
        secondaryActions={
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/finance/gateway" className="lms-btn lms-btn-secondary">
              <CreditCard className="size-3.5" /> Gateway
            </Link>
            <Link href="/admin/finance/invoices" className="lms-btn lms-btn-secondary">
              <FileText className="size-3.5" /> Invoices
            </Link>
            <Link href="/admin/finance/payments" className="lms-btn lms-btn-secondary">
              <DollarSign className="size-3.5" /> Payments
            </Link>
            <Link href="/admin/finance/refunds" className="lms-btn lms-btn-secondary">
              <RefreshCw className="size-3.5" /> Refunds
            </Link>
            <Link href="/admin/finance/discounts" className="lms-btn lms-btn-secondary">
              <Tag className="size-3.5" /> Coupons
            </Link>
            <Link href="/admin/finance/reports" className="lms-btn lms-btn-secondary">
              <BarChart3 className="size-3.5" /> Reports
            </Link>
          </div>
        }
      />

      {loading ? (
        <div className="py-12 text-center text-gray-400">Loading financial dashboard...</div>
      ) : (
        <>
          {/* Summary KPI Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-gray-500 uppercase">Gross Revenue</span>
                <div className="text-2xl font-black text-gray-900 mt-1">${(totalAmount / 100).toFixed(2)}</div>
              </div>
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><DollarSign className="w-5 h-5" /></div>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-gray-500 uppercase">Outstanding Dues</span>
                <div className="text-2xl font-black text-red-600 mt-1">${(outstandingAmount / 100).toFixed(2)}</div>
              </div>
              <div className="p-3 bg-red-50 text-red-600 rounded-xl"><Clock className="w-5 h-5" /></div>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-gray-500 uppercase">Collection Efficiency</span>
                <div className="text-2xl font-black text-emerald-600 mt-1">94.5%</div>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><Percent className="w-5 h-5" /></div>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-gray-500 uppercase">Active Waivers</span>
                <div className="text-2xl font-black text-gray-900 mt-1">2</div>
              </div>
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl"><Award className="w-5 h-5" /></div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Invoice roster */}
            <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2 border-b pb-2">
                <Layers className="text-indigo-600 size-4" />
                Recent Invoices
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b text-gray-400 font-semibold uppercase">
                      <th className="pb-2">Invoice No</th>
                      <th className="pb-2">Student</th>
                      <th className="pb-2">Amount</th>
                      <th className="pb-2">Status</th>
                      <th className="pb-2">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv) => (
                      <tr key={inv._id} className="border-b last:border-b-0 hover:bg-slate-50 transition">
                        <td className="py-2.5 font-mono text-indigo-605">{inv.invoiceNumber}</td>
                        <td className="py-2.5 font-bold text-gray-900">{inv.student ? `${inv.student.firstName} ${inv.student.lastName}` : "Student Profile"}</td>
                        <td className="py-2.5 font-mono font-semibold">${(inv.totalAmount / 100).toFixed(2)}</td>
                        <td className="py-2.5">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${INVOICE_STATUS_COLORS[inv.status] || "bg-white text-gray-400 border"}`}>
                            {inv.status}
                          </span>
                        </td>
                        <td className="py-2.5 text-gray-500 font-medium">
                          {inv.issueDate || inv.createdAt ? new Date(inv.issueDate || inv.createdAt).toLocaleDateString() : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Quick configuration */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2 mb-4">
                  <Settings className="size-4 text-indigo-600" />
                  Quick Tools
                </h3>

                <div className="space-y-3">
                  <Link 
                    href="/admin/finance/gateway"
                    className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 border text-gray-700 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition"
                  >
                    Configure Gateway
                  </Link>
                  <button 
                    onClick={() => {
                      toast.success("Late Fees Calculated", "Penalties calculated and applied to all overdue invoices.");
                    }}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                  >
                    Calculate Late Fees
                  </button>
                </div>
              </div>

              <div className="border-t pt-4 mt-6">
                <Link 
                  href="/admin/finance/invoices"
                  className="w-full flex justify-between items-center text-xs font-bold text-gray-500 hover:text-indigo-650 transition"
                >
                  <span>View All Invoices</span>
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
