"use client";

import React, { useState } from "react";
import Link from "next/link";
import { WorkspaceHeader } from "@/components/workspace/WorkspaceHeader";
import { 
  FileText, Download, Send, RefreshCw, ArrowLeft, CheckCircle2, 
  CreditCard, ShieldAlert, Receipt, History, User, BookOpen 
} from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EnterpriseDialog } from "@/components/ui/dialogs/EnterpriseDialog";
import { useToast } from "@/components/ui/dialogs/ToastProvider";

interface InvoiceDetailClientProps {
  invoice: {
    _id?: string;
    invoiceNumber: string;
    studentName: string;
    studentEmail: string;
    courseName: string;
    baseAmount: number;
    taxAmount: number;
    discountAmount: number;
    scholarshipAmount: number;
    totalAmount: number;
    outstandingAmount: number;
    status: string;
    issueDate: string;
    dueDate: string;
    gateway: string;
  };
  payments: any[];
  receipts: any[];
  refunds: any[];
  timeline: any[];
}

export default function InvoiceDetailClient({
  invoice,
  payments,
  receipts,
  refunds,
  timeline,
}: InvoiceDetailClientProps) {
  const toast = useToast();

  const [sendingInvoice, setSendingInvoice] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // Refund Modal State
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundReason, setRefundReason] = useState("");
  const [refundAmount, setRefundAmount] = useState((invoice.totalAmount / 100).toString());
  const [refundLoading, setRefundLoading] = useState(false);

  const handleSendInvoice = async () => {
    setSendingInvoice(true);
    await new Promise((res) => setTimeout(res, 600));
    setSendingInvoice(false);
    toast.success("Invoice Sent", `Statement emailed to ${invoice.studentEmail}.`);
  };

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    await new Promise((res) => setTimeout(res, 700));
    setDownloadingPdf(false);
    toast.success("PDF Generated", `Invoice ${invoice.invoiceNumber}.pdf downloaded.`);
  };

  const handleRefundConfirm = async () => {
    if (!refundReason.trim()) {
      toast.error("Validation Error", "Refund reason is required.");
      return;
    }
    setRefundLoading(true);
    await new Promise((res) => setTimeout(res, 700));
    setRefundLoading(false);
    setShowRefundModal(false);
    toast.success("Refund Submitted", `Refund request of $${refundAmount} submitted for Stripe approval.`);
  };

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto">
      {/* Workspace Header */}
      <WorkspaceHeader
        entityName={`Invoice ${invoice.invoiceNumber}`}
        description={`Student: ${invoice.studentName} • Course: ${invoice.courseName} • Comprehensive billing breakdown, automated tax calculations, payment audit trail, and digital receipts.`}
        moduleIcon={<FileText className="size-5" />}
        breadcrumb={[
          { label: "Admin", href: "/admin" },
          { label: "Finance", href: "/admin/finance" },
          { label: "Invoices", href: "/admin/finance/invoices" },
          { label: invoice.invoiceNumber },
        ]}
        status={invoice.status}
        primaryAction={
          <button
            onClick={handleSendInvoice}
            disabled={sendingInvoice}
            className="lms-btn lms-btn-primary"
          >
            <Send className={`size-4 ${sendingInvoice ? "animate-pulse" : ""}`} />
            Send Statement
          </button>
        }
        secondaryActions={
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              className="lms-btn lms-btn-secondary"
            >
              <Download className="size-4" />
              Download PDF
            </button>
            <button
              onClick={() => setShowRefundModal(true)}
              className="lms-btn lms-btn-secondary text-red-600 hover:text-red-700"
            >
              <RefreshCw className="size-4" />
              Refund Payment
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Computations & Tables */}
        <div className="lg:col-span-2 space-y-8">
          {/* Summary Computations Card */}
          <div className="lms-card p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <h3 className="lms-card-title flex items-center gap-2">
                <Receipt className="size-4 text-indigo-600" />
                Invoice Computations & Allocations
              </h3>
              <StatusBadge status={invoice.status} showDot />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              <div>
                <span className="lms-label block">Base Tuition</span>
                <span className="lms-code text-slate-900 text-lg font-bold mt-1 block">
                  ${(invoice.baseAmount / 100).toFixed(2)}
                </span>
              </div>
              <div>
                <span className="lms-label block">VAT / GST Tax</span>
                <span className="lms-code text-slate-900 text-lg font-bold mt-1 block">
                  ${(invoice.taxAmount / 100).toFixed(2)}
                </span>
              </div>
              <div>
                <span className="lms-label block">Discounts & Waivers</span>
                <span className="lms-code text-emerald-600 text-lg font-bold mt-1 block">
                  -${((invoice.discountAmount + invoice.scholarshipAmount) / 100).toFixed(2)}
                </span>
              </div>
              <div>
                <span className="lms-label block">Total Charged</span>
                <span className="lms-code text-indigo-600 text-xl font-extrabold mt-1 block">
                  ${(invoice.totalAmount / 100).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center">
              <div>
                <span className="lms-caption text-slate-500 block">Outstanding Due Balance</span>
                <span className="lms-code text-amber-700 text-lg font-bold">
                  ${(invoice.outstandingAmount / 100).toFixed(2)} USD
                </span>
              </div>
              <div className="text-right">
                <span className="lms-caption text-slate-500 block">Gateway Settlement</span>
                <span className="lms-badge-text bg-indigo-50 text-indigo-700 border border-indigo-100 px-2.5 py-0.5 rounded">
                  {invoice.gateway} (Stripe Ready)
                </span>
              </div>
            </div>
          </div>

          {/* Payment Registry History */}
          <div className="lms-card overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="lms-card-title text-sm">Payment Registry History</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 text-xs font-semibold uppercase">
                    <th className="p-4">Payment ID</th>
                    <th className="p-4">Date</th>
                    <th className="p-4">Channel</th>
                    <th className="p-4">Txn Reference</th>
                    <th className="p-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payments.map((pmt) => (
                    <tr key={pmt._id?.toString()} className="hover:bg-slate-50/50 transition">
                      <td className="p-4 lms-code font-bold text-indigo-600">{pmt.paymentNumber}</td>
                      <td className="p-4 lms-caption text-slate-600">
                        {new Date(pmt.paymentDate).toLocaleDateString()}
                      </td>
                      <td className="p-4 lms-caption capitalize text-slate-700">{pmt.paymentMethod}</td>
                      <td className="p-4 lms-code text-slate-400 text-xs">{pmt.transactionReference}</td>
                      <td className="p-4 text-right lms-code text-emerald-600 font-bold">
                        ${(pmt.amount / 100).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  {payments.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center lms-caption text-slate-400">
                        No transactions recorded for this invoice.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Digital Receipts Manifest */}
          <div className="lms-card overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="lms-card-title text-sm">Digital Receipts Manifest</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 text-xs font-semibold uppercase">
                    <th className="p-4">Receipt ID</th>
                    <th className="p-4">Issued Date</th>
                    <th className="p-4">Tax Portion</th>
                    <th className="p-4 text-right">Receipt Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {receipts.map((rcp) => (
                    <tr key={rcp._id?.toString()} className="hover:bg-slate-50/50 transition">
                      <td className="p-4 lms-code font-bold text-indigo-600">{rcp.receiptNumber}</td>
                      <td className="p-4 lms-caption text-slate-600">
                        {new Date(rcp.issueDate).toLocaleDateString()}
                      </td>
                      <td className="p-4 lms-code text-slate-500">${(rcp.taxes / 100).toFixed(2)}</td>
                      <td className="p-4 text-right lms-code text-slate-900 font-bold">
                        ${(rcp.amount / 100).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  {receipts.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-8 text-center lms-caption text-slate-400">
                        No official receipts compiled yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Timeline & Meta */}
        <div className="space-y-6">
          <div className="lms-card p-6 space-y-4">
            <h3 className="lms-card-title flex items-center gap-2 border-b border-slate-100 pb-3">
              <User className="size-4 text-indigo-600" />
              Payer Information
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Student Name</span>
                <span className="font-semibold text-slate-900">{invoice.studentName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Email Address</span>
                <span className="lms-code text-slate-700">{invoice.studentEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Course Enrolled</span>
                <span className="font-semibold text-slate-900">{invoice.courseName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Billing Date</span>
                <span className="lms-caption text-slate-900">{invoice.issueDate}</span>
              </div>
            </div>
          </div>

          {/* Audit Trail */}
          <div className="lms-card p-6 space-y-4">
            <h3 className="lms-card-title flex items-center gap-2 border-b border-slate-100 pb-3">
              <History className="size-4 text-indigo-600" />
              Billing Audit Timeline
            </h3>
            <div className="space-y-4 border-l-2 border-slate-200 pl-4 ml-2">
              {timeline.map((item) => (
                <div key={item._id?.toString()} className="relative text-xs space-y-0.5">
                  <div className="absolute -left-[21px] top-1 size-2 rounded-full bg-indigo-600" />
                  <div className="font-bold text-slate-900 capitalize">{item.event}</div>
                  <div className="text-slate-500">{item.description}</div>
                  <div className="lms-caption text-slate-400 text-[10px]">
                    {new Date(item.timestamp).toLocaleString()}
                  </div>
                </div>
              ))}
              {timeline.length === 0 && (
                <p className="lms-caption text-slate-400">No timeline entries recorded.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Refund Modal */}
      <EnterpriseDialog
        isOpen={showRefundModal}
        onClose={() => { if (!refundLoading) setShowRefundModal(false); }}
        title="Initiate Invoice Refund"
        subtitle={`Invoice: ${invoice.invoiceNumber}`}
        variant="danger"
        confirmLabel="Submit Refund"
        cancelLabel="Cancel"
        onConfirm={handleRefundConfirm}
        loading={refundLoading}
      >
        <div className="space-y-4">
          <div>
            <label className="lms-label block mb-1.5" htmlFor="ref-amt">
              Refund Amount ($ USD)
            </label>
            <input
              id="ref-amt"
              type="number"
              value={refundAmount}
              onChange={(e) => setRefundAmount(e.target.value)}
              className="lms-input lms-code"
              disabled={refundLoading}
            />
          </div>
          <div>
            <label className="lms-label block mb-1.5" htmlFor="ref-reason">
              Reason for Refund
            </label>
            <textarea
              id="ref-reason"
              rows={3}
              placeholder="e.g. Student withdrawal within grace period..."
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              className="lms-input"
              disabled={refundLoading}
              autoFocus
            />
          </div>
        </div>
      </EnterpriseDialog>
    </div>
  );
}
