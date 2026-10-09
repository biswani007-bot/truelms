"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParentChild } from "@/components/parent/parent-child-context";
import {
  CreditCard,
  Receipt,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  X,
  FileText,
  DollarSign,
  Download,
  Printer,
  Sparkles,
  Building,
  Smartphone,
  ChevronRight,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface InvoicePayment {
  id: string;
  paymentNumber: string;
  paymentDate: string;
  amount: number;
  paymentMethod: string;
  transactionReference: string;
  status: string;
  receipt?: {
    id: string;
    receiptNumber: string;
    issueDate: string;
    amount: number;
    taxes: number;
  } | null;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  baseAmount: number;
  taxAmount: number;
  discountAmount: number;
  scholarshipAmount: number;
  totalAmount: number;
  amountPaid: number;
  amountDue: number;
  status: string;
  courseName: string;
  courseCode: string;
  items?: InvoiceItem[];
  payments?: InvoicePayment[];
}

interface PaymentRecord {
  id: string;
  paymentNumber: string;
  paymentDate: string;
  amount: number;
  paymentMethod: string;
  transactionReference: string;
  status: string;
  receipt?: {
    id: string;
    receiptNumber: string;
    issueDate: string;
    amount: number;
    taxes: number;
  } | null;
}

interface ReceiptRecord {
  id: string;
  receiptNumber: string;
  invoiceId: string;
  paymentId: string;
  issueDate: string;
  amount: number;
  taxes: number;
}

interface ReceiptDetail {
  id: string;
  receiptNumber: string;
  issueDate: string;
  amount: number;
  taxes: number;
  invoice: {
    id: string;
    invoiceNumber: string;
    totalAmount: number;
    status: string;
    courseName: string;
    courseCode: string;
  };
  payment?: {
    id: string;
    paymentNumber: string;
    paymentDate: string;
    paymentMethod: string;
    transactionReference: string;
    status: string;
  } | null;
  student: {
    id: string;
    studentCode: string;
    firstName: string;
    lastName: string;
  };
  parent: {
    id?: string;
    name: string;
    email?: string;
  };
}

export default function ParentFinancePage() {
  const { selectedChild } = useParentChild();
  const [data, setData] = useState<{
    overview?: { totalInvoiced: number; totalPaid: number; totalDue: number };
    invoices?: Invoice[];
    payments?: PaymentRecord[];
    receipts?: ReceiptRecord[];
  } | null>(null);

  const [loading, setLoading] = useState<boolean>(true);

  // Invoice Detail state
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [loadingInvoiceDetail, setLoadingInvoiceDetail] = useState<boolean>(false);
  const [invoiceDetailError, setInvoiceDetailError] = useState<string | null>(null);

  // Payment state
  const [isPaying, setIsPaying] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>("credit-card");
  const [paymentResult, setPaymentResult] = useState<any>(null);
  const [payError, setPayError] = useState<string | null>(null);

  // Stripe Checkout return verification state
  const [returnVerification, setReturnVerification] = useState<{
    status: "verifying" | "success" | "pending" | "cancelled" | null;
    message: string;
  }>({ status: null, message: "" });

  // Receipt modal state
  const [activeReceipt, setActiveReceipt] = useState<ReceiptDetail | null>(null);
  const [loadingReceipt, setLoadingReceipt] = useState<boolean>(false);
  const [downloadingPdf, setDownloadingPdf] = useState<boolean>(false);

  const studentId = selectedChild?.studentId;

  // Reset modals on child change
  useEffect(() => {
    setSelectedInvoice(null);
    setActiveReceipt(null);
    setPaymentResult(null);
    setPayError(null);
  }, [studentId]);

  const fetchFinance = useCallback(async () => {
    if (!studentId) return [];
    try {
      setLoading(true);
      const res = await fetch(`/api/parent/children/${studentId}/invoices`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load tuition and billing statements");
      const json = await res.json();
      const invoices = (json.data || []).map((i: any) => ({
        id: i.invoiceId,
        invoiceNumber: i.number,
        issueDate: i.issueDate,
        dueDate: i.dueDate,
        baseAmount: i.baseAmount || 0,
        taxAmount: i.taxAmount || 0,
        discountAmount: i.discountAmount || 0,
        scholarshipAmount: i.scholarshipAmount || 0,
        totalAmount: i.totalAmount || 0,
        amountPaid: Math.max(0, (i.totalAmount || 0) - (i.outstandingAmount || 0)),
        amountDue: i.outstandingAmount || 0,
        status: i.status,
        courseName: "Program Fee", // Optional
        courseCode: ""
      }));

      const totalInvoiced = invoices.reduce((acc: number, i: any) => acc + (i.totalAmount || 0), 0);
      const totalDue = invoices.reduce((acc: number, i: any) => acc + (i.amountDue || 0), 0);
      const totalPaid = totalInvoiced - totalDue;

      setData({
        overview: { totalInvoiced, totalPaid, totalDue },
        invoices: invoices,
        payments: [],
        receipts: []
      });
      return invoices;
    } catch (err) {
      console.error("Error loading finance:", err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    fetchFinance();
  }, [fetchFinance]);

  // Handle Stripe checkout return status with bounded verification polling (Phase 17 & 26)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get("payment");
    const returnedInvoiceId = urlParams.get("invoiceId");

    if (paymentStatus === "cancelled") {
      setReturnVerification({
        status: "cancelled",
        message: "Payment checkout was cancelled. Your invoice remains open and you may authorize payment whenever ready.",
      });
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (paymentStatus === "success" && studentId) {
      setReturnVerification({
        status: "verifying",
        message: "Verifying payment confirmation with server. Please wait a moment...",
      });
      window.history.replaceState({}, document.title, window.location.pathname);

      let attempts = 0;
      const maxAttempts = 5;
      const interval = setInterval(async () => {
        attempts++;
        const currentInvoices = await fetchFinance();
        const target = currentInvoices.find((inv: any) => inv.id === returnedInvoiceId);

        if (target && target.status === "paid") {
          clearInterval(interval);
          setReturnVerification({
            status: "success",
            message: `Payment verified successfully! Invoice #${target.invoiceNumber} is fully settled and learning access is active.`,
          });
        } else if (attempts >= maxAttempts) {
          clearInterval(interval);
          setReturnVerification({
            status: "pending",
            message: "Payment received by provider and is currently settling. Your statement will update automatically once verified.",
          });
        }
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [studentId, fetchFinance]);

  // Open authoritative Invoice Detail
  const handleOpenInvoiceDetail = async (invoiceSummary: Invoice) => {
    if (!studentId) return;
    setSelectedInvoice(invoiceSummary);
    setInvoiceDetailError(null);
    setLoadingInvoiceDetail(true);

    try {
      const res = await fetch(
        `/api/parent/children/${studentId}/finance/invoices/${invoiceSummary.id}`,
        { credentials: "include" }
      );
      if (!res.ok) {
        throw new Error("Failed to load full invoice details from server.");
      }
      const json = await res.json();
      setSelectedInvoice(json.data);
    } catch (err: any) {
      setInvoiceDetailError(err.message || "Could not fetch full invoice details.");
    } finally {
      setLoadingInvoiceDetail(false);
    }
  };

  // Open authoritative Receipt Detail
  const handleOpenReceiptDetail = async (receiptId: string) => {
    if (!studentId) return;
    setLoadingReceipt(true);
    try {
      const res = await fetch(
        `/api/parent/children/${studentId}/finance/receipts/${receiptId}`,
        { credentials: "include" }
      );
      if (!res.ok) throw new Error("Failed to load receipt voucher details.");
      const json = await res.json();
      setActiveReceipt(json.data);
    } catch (err: any) {
      alert(err.message || "Failed to load receipt.");
    } finally {
      setLoadingReceipt(false);
    }
  };

  // Download official Receipt PDF
  const handleDownloadReceiptPdf = async (receiptId: string, receiptNumber: string) => {
    if (!studentId) return;
    setDownloadingPdf(true);
    try {
      const res = await fetch(
        `/api/parent/children/${studentId}/finance/receipts/${receiptId}/download`,
        { credentials: "include" }
      );
      if (!res.ok) throw new Error("Failed to generate receipt PDF");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Receipt-${receiptNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message || "Failed to download receipt PDF.");
    } finally {
      setDownloadingPdf(false);
    }
  };

  // Download official Invoice PDF
  const handleDownloadInvoicePdf = async (invoiceId: string, invoiceNumber: string) => {
    if (!studentId) return;
    setDownloadingPdf(true);
    try {
      const res = await fetch(
        `/api/parent/children/${studentId}/finance/invoices/${invoiceId}/download`,
        { credentials: "include" }
      );
      if (!res.ok) throw new Error("Failed to generate invoice PDF");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Invoice-${invoiceNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message || "Failed to download invoice PDF.");
    } finally {
      setDownloadingPdf(false);
    }
  };

  // Process customer payment
  const handlePayNow = async (invoice: Invoice) => {
    if (!selectedChild?.studentId) return;
    try {
      setIsPaying(true);
      setPayError(null);

      // Online Gateway / Card methods: initiate Stripe Checkout session
      if (["credit-card", "debit-card", "upi", "online-gateway"].includes(paymentMethod)) {
        try {
          const successUrl = `${window.location.origin}/parent/finance?payment=success&invoiceId=${invoice.id}`;
          const cancelUrl = `${window.location.origin}/parent/finance?payment=cancelled&invoiceId=${invoice.id}`;

          const checkoutRes = await fetch("/api/finance/stripe/create-checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              invoiceId: invoice.id,
              studentId: selectedChild.studentId,
              successUrl,
              cancelUrl,
            }),
          });

          const checkoutJson = await checkoutRes.json();
          if (checkoutRes.ok && checkoutJson.success && checkoutJson.data?.url) {
            window.location.href = checkoutJson.data.url;
            return;
          }
          if (!checkoutRes.ok && checkoutJson.message && !checkoutJson.message.includes("not configured")) {
            throw new Error(checkoutJson.message || "Failed to initialize payment gateway");
          }
        } catch (checkoutErr: any) {
          if (!checkoutErr.message?.includes("not configured")) {
            console.warn("Stripe Checkout notice:", checkoutErr.message);
          }
        }
      }

      // Fallback or direct parent finance payment route
      const res = await fetch(`/api/parent/children/${selectedChild.studentId}/finance/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          invoiceId: invoice.id,
          amount: invoice.amountDue,
          paymentMethod,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || json.error || "Payment transaction could not be completed");
      }

      setPaymentResult(json.data);
      setSelectedInvoice(null);
      // Authoritatively refresh backend financial state
      await fetchFinance();
    } catch (err: any) {
      setPayError(err.message || "Failed to process payment. Please try again.");
    } finally {
      setIsPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-28 bg-slate-200/60 rounded-3xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-slate-200/60 rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-slate-200/60 rounded-3xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Return Verification Alert Banner */}
      {returnVerification.status && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between text-xs md:text-sm font-semibold transition ${
            returnVerification.status === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : returnVerification.status === "verifying"
              ? "bg-blue-50 border-blue-200 text-blue-800"
              : returnVerification.status === "pending"
              ? "bg-amber-50 border-amber-200 text-amber-800"
              : "bg-slate-50 border-slate-200 text-slate-700"
          }`}
        >
          <div className="flex items-center gap-3">
            {returnVerification.status === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />}
            {returnVerification.status === "verifying" && <RefreshCw className="w-5 h-5 text-blue-600 animate-spin flex-shrink-0" />}
            {returnVerification.status === "pending" && <Clock className="w-5 h-5 text-amber-600 flex-shrink-0" />}
            {returnVerification.status === "cancelled" && <AlertCircle className="w-5 h-5 text-slate-500 flex-shrink-0" />}
            <span>{returnVerification.message}</span>
          </div>
          <button
            onClick={() => setReturnVerification({ status: null, message: "" })}
            className="p-1 hover:bg-black/5 rounded-lg text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            Tuition & Fee Statements
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Billing statements, payment reconciliation, and tax receipts for {selectedChild?.firstName}.
          </p>
        </div>

        <button
          onClick={fetchFinance}
          className="self-start sm:self-auto flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Invoiced</p>
          <p className="text-2xl md:text-3xl font-black text-slate-900 mt-1.5">
            ${data?.overview?.totalInvoiced ?? 0}
          </p>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">Billed tuition and cohorts</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
          <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Total Paid</p>
          <p className="text-2xl md:text-3xl font-black text-emerald-600 mt-1.5">
            ${data?.overview?.totalPaid ?? 0}
          </p>
          <p className="text-[11px] text-emerald-700/80 mt-1 font-medium">Recorded settlement</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
          <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">Balance Remaining</p>
          <p className="text-2xl md:text-3xl font-black text-amber-600 mt-1.5">
            ${data?.overview?.totalDue ?? 0}
          </p>
          <p className="text-[11px] text-amber-700/80 mt-1 font-medium">Outstanding balance</p>
        </div>
      </div>

      {/* Invoices List */}
      <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Invoices & Statements</h2>
            <p className="text-xs text-slate-400 mt-0.5">Program fees, due dates, and settlement status</p>
          </div>
          <span className="text-xs font-bold bg-slate-100 text-slate-600 px-3 py-1 rounded-full">
            {data?.invoices?.length ?? 0} Issued
          </span>
        </div>

        {data?.invoices && data.invoices.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {data.invoices.map((inv) => {
              const outstanding = Number(inv.amountDue ?? 0);
              const isPaid = inv.status === "paid" || outstanding <= 0;
              return (
                <div
                  key={inv.id}
                  className="p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/60 transition"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 ${
                        isPaid ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                      }`}
                    >
                      <Receipt className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900">{inv.invoiceNumber}</h3>
                        <span
                          className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider border ${
                            isPaid
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          {inv.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 font-medium mt-0.5">{inv.courseName}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-slate-400 font-medium">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" /> Due:{" "}
                          {new Date(inv.dueDate).toLocaleDateString()}
                        </span>
                        {inv.items && inv.items.length > 0 && (
                          <span>• {inv.items.length} itemized fee(s)</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 self-end md:self-auto">
                    <div className="text-right">
                      <span className="text-sm font-extrabold text-slate-900 block">${inv.totalAmount}</span>
                      <span className="text-xs text-slate-400">
                        {isPaid ? "Fully Paid" : `Due: $${outstanding}`}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenInvoiceDetail(inv)}
                        className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>View Details</span>
                      </button>

                      {!isPaid && (
                        <button
                          onClick={() => handleOpenInvoiceDetail(inv)}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm shadow-emerald-600/20 flex items-center gap-1.5"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Pay Now</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-14 text-center text-xs text-slate-400">
            No invoices issued for this student.
          </div>
        )}
      </div>

      {/* Receipts & Payment History Section */}
      {data?.payments && data.payments.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Payment Receipts &amp; History</h2>
              <p className="text-xs text-slate-400 mt-0.5">Official transaction vouchers and payment records</p>
            </div>
            <span className="text-xs font-bold bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-200">
              {data.payments.length} Recorded
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {data.payments.map((p) => (
              <div
                key={p.id}
                className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/60 transition"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-900">{p.paymentNumber}</h4>
                      {p.receipt && (
                        <span className="text-[10px] font-extrabold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md border border-indigo-200">
                          {p.receipt.receiptNumber}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                      {new Date(p.paymentDate).toLocaleDateString()} • Method:{" "}
                      <span className="capitalize">{p.paymentMethod.replace("-", " ")}</span>
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                      Ref: {p.transactionReference}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 self-end md:self-auto">
                  <span className="text-sm font-extrabold text-emerald-700">${p.amount}</span>
                  {p.receipt && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenReceiptDetail(p.receipt!.id)}
                        className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        <span>Print Receipt</span>
                      </button>
                      <button
                        onClick={() => handleDownloadReceiptPdf(p.receipt!.id, p.receipt!.receiptNumber)}
                        title="Download Receipt PDF"
                        disabled={downloadingPdf}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full Invoice Detail Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 md:p-8 shadow-2xl border border-slate-200 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedInvoice(null)}
              className="absolute top-6 right-6 p-2 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Official Tuition Statement
              </span>
              <span className="text-xs text-slate-400 font-medium">TrueLern Financial Records</span>
            </div>

            <div className="flex items-center justify-between mt-1">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">{selectedInvoice.invoiceNumber}</h2>
                <p className="text-xs text-slate-500 mt-0.5">{selectedInvoice.courseName}</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleDownloadInvoicePdf(selectedInvoice.id, selectedInvoice.invoiceNumber)}
                  disabled={downloadingPdf}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 transition"
                >
                  {downloadingPdf ? <span className="animate-pulse">Downloading...</span> : <><Download className="w-3.5 h-3.5" /> Download PDF</>}
                </button>
                <span
                  className={`text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider border ${
                    selectedInvoice.status === "paid" || selectedInvoice.amountDue <= 0
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-amber-50 text-amber-700 border-amber-200"
                  }`}
                >
                  {selectedInvoice.status}
                </span>
              </div>
            </div>

            {loadingInvoiceDetail && (
              <div className="py-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                <span>Loading complete financial breakdown...</span>
              </div>
            )}

            {invoiceDetailError && (
              <div className="mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{invoiceDetailError}</span>
              </div>
            )}

            {payError && (
              <div className="mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{payError}</span>
              </div>
            )}

            {/* Date Details Bar */}
            <div className="grid grid-cols-2 gap-3 my-5 p-3.5 bg-slate-50 rounded-2xl border border-slate-200/60 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Issue Date</span>
                <span className="font-semibold text-slate-800">
                  {new Date(selectedInvoice.issueDate).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Payment Due Date</span>
                <span className="font-semibold text-slate-800">
                  {new Date(selectedInvoice.dueDate).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="border border-slate-200/80 rounded-2xl p-4 bg-slate-50/50">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Itemized Tuition Breakdown
              </p>
              {selectedInvoice.items && selectedInvoice.items.length > 0 ? (
                <div className="divide-y divide-slate-200/60">
                  {selectedInvoice.items.map((it) => (
                    <div key={it.id} className="py-2.5 flex justify-between text-xs">
                      <div>
                        <span className="font-semibold text-slate-800 block">{it.description}</span>
                        <span className="text-slate-400 text-[10px]">
                          Qty: {it.quantity} • Unit: ${it.unitPrice}
                        </span>
                      </div>
                      <span className="font-bold text-slate-900">${it.totalPrice}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-2 flex justify-between text-xs">
                  <span className="font-semibold text-slate-800">{selectedInvoice.courseName} Tuition</span>
                  <span className="font-bold text-slate-900">
                    ${selectedInvoice.baseAmount ?? selectedInvoice.totalAmount}
                  </span>
                </div>
              )}

              {/* Financial Subtotals */}
              <div className="mt-4 pt-3 border-t border-slate-200 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Base Tuition</span>
                  <span className="font-semibold text-slate-700">
                    ${selectedInvoice.baseAmount ?? selectedInvoice.totalAmount}
                  </span>
                </div>
                {selectedInvoice.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>Discount Applied</span>
                    <span>-${selectedInvoice.discountAmount}</span>
                  </div>
                )}
                {selectedInvoice.scholarshipAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>Scholarship Grant</span>
                    <span>-${selectedInvoice.scholarshipAmount}</span>
                  </div>
                )}
                {selectedInvoice.taxAmount > 0 && (
                  <div className="flex justify-between text-slate-500">
                    <span>Tax & Processing</span>
                    <span className="font-semibold text-slate-700">${selectedInvoice.taxAmount}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-2 border-t border-slate-200">
                  <span>Total Amount</span>
                  <span>${selectedInvoice.totalAmount}</span>
                </div>
                {selectedInvoice.amountPaid > 0 && (
                  <div className="flex justify-between text-xs text-emerald-600 font-bold">
                    <span>Amount Already Settled</span>
                    <span>-${selectedInvoice.amountPaid}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-black text-amber-600 pt-1">
                  <span>Balance Due</span>
                  <span>${selectedInvoice.amountDue}</span>
                </div>
              </div>
            </div>

            {/* Payment History for this specific invoice */}
            {selectedInvoice.payments && selectedInvoice.payments.length > 0 && (
              <div className="mt-5 border border-slate-200 rounded-2xl p-4 bg-white">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Invoice Payment History
                </p>
                <div className="divide-y divide-slate-100">
                  {selectedInvoice.payments.map((p) => (
                    <div key={p.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{p.paymentNumber}</span>
                          <span className="text-[10px] font-semibold text-emerald-700 uppercase bg-emerald-50 px-2 py-0.5 rounded">
                            {p.status}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {new Date(p.paymentDate).toLocaleDateString()} • {p.paymentMethod.replace("-", " ")} • Ref: {p.transactionReference}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-emerald-700">${p.amount}</span>
                        {p.receipt && (
                          <button
                            onClick={() => handleOpenReceiptDetail(p.receipt!.id)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold transition flex items-center gap-1"
                          >
                            <Receipt className="w-3 h-3" /> Voucher
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Payment Method Selector & Pay Action (if unpaid) */}
            {selectedInvoice.amountDue > 0 && selectedInvoice.status !== "paid" && (
              <div className="mt-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Select Payment Method
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: "credit-card", label: "Credit Card", icon: CreditCard },
                      { id: "debit-card", label: "Debit Card", icon: CreditCard },
                      { id: "upi", label: "UPI / Net Banking", icon: Smartphone },
                      { id: "bank-transfer", label: "Bank Transfer", icon: Building },
                    ].map((m) => {
                      const Icon = m.icon;
                      const active = paymentMethod === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setPaymentMethod(m.id)}
                          className={`flex items-center gap-2 p-3 rounded-2xl border text-xs font-bold transition text-left ${
                            active
                              ? "bg-emerald-50 text-emerald-800 border-emerald-500 ring-2 ring-emerald-500/20"
                              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          <Icon className={`w-4 h-4 ${active ? "text-emerald-600" : "text-slate-400"}`} />
                          <span>{m.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  onClick={() => handlePayNow(selectedInvoice)}
                  disabled={isPaying}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-2xl transition shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isPaying ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Processing Payment of ${selectedInvoice.amountDue}...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Authorize Payment of ${selectedInvoice.amountDue}</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Payment Success Result Modal */}
      {paymentResult && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 text-center shadow-2xl border border-emerald-200 relative">
            <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
              Payment Completed
            </div>

            <h2 className="text-2xl font-black text-slate-900">Tuition Settled Successfully!</h2>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Your payment of <strong className="text-slate-900">${paymentResult.payment.amount}</strong> for{" "}
              <strong>{selectedChild?.firstName}</strong> has been recorded and verified.
            </p>

            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 my-6 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Payment Number</span>
                <span className="font-bold text-slate-800">{paymentResult.payment.paymentNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Transaction Ref</span>
                <span className="font-mono text-slate-800">{paymentResult.payment.transactionReference}</span>
              </div>
              {paymentResult.receipt && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Receipt Number</span>
                  <span className="font-bold text-emerald-700">{paymentResult.receipt.receiptNumber}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-400">Invoice Status</span>
                <span className="font-bold text-emerald-600 capitalize">{paymentResult.invoice.status}</span>
              </div>
              {paymentResult.enrollmentStatus && (
                <div className="flex justify-between pt-1 border-t border-slate-200">
                  <span className="text-slate-400">Enrollment Status</span>
                  <span className="font-bold text-emerald-700 uppercase">Confirmed &amp; Active</span>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2.5">
              {paymentResult.receipt && (
                <button
                  onClick={() => {
                    handleOpenReceiptDetail(paymentResult.receipt.id);
                    setPaymentResult(null);
                  }}
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
                >
                  <Receipt className="w-4 h-4" />
                  <span>Print Receipt</span>
                </button>
              )}

              <Link
                href="/parent/dashboard"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20"
              >
                <Sparkles className="w-4 h-4" />
                <span>Return to Learning Hub</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Official Receipt Voucher Modal */}
      {activeReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-8 shadow-2xl border border-slate-200 relative">
            <button
              onClick={() => setActiveReceipt(null)}
              className="absolute top-6 right-6 p-2 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 transition print:hidden"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="border-b border-slate-200 pb-4 mb-4 text-center">
              <img
                src="/TrueLernLogo_horizontal.png"
                alt="TrueLern"
                className="h-8 w-auto mx-auto object-contain mb-2"
              />
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">
                Official Tuition Payment Receipt
              </p>
            </div>

            <div className="space-y-3 text-xs mb-6">
              <div className="flex justify-between">
                <span className="text-slate-400">Receipt Number</span>
                <span className="font-extrabold text-slate-900">{activeReceipt.receiptNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Issue Date</span>
                <span className="font-semibold text-slate-800">
                  {new Date(activeReceipt.issueDate).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Invoice Reference</span>
                <span className="font-bold text-slate-800">{activeReceipt.invoice.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Program / Course</span>
                <span className="font-semibold text-slate-800">{activeReceipt.invoice.courseName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Learner Ward</span>
                <span className="font-bold text-slate-900">
                  {activeReceipt.student.firstName} {activeReceipt.student.lastName} ({activeReceipt.student.studentCode})
                </span>
              </div>
              {activeReceipt.payment && (
                <>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Payment Reference</span>
                    <span className="font-mono text-slate-800">
                      {activeReceipt.payment.paymentNumber} ({activeReceipt.payment.transactionReference})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Payment Method</span>
                    <span className="capitalize text-slate-800">
                      {activeReceipt.payment.paymentMethod.replace("-", " ")}
                    </span>
                  </div>
                </>
              )}
              <div className="flex justify-between pt-3 border-t border-slate-100">
                <span className="text-slate-500 font-bold">Total Amount Settled</span>
                <span className="font-black text-emerald-700 text-lg">${activeReceipt.amount}</span>
              </div>
            </div>

            <div className="flex gap-2.5 print:hidden">
              <button
                onClick={() => handleDownloadReceiptPdf(activeReceipt.id, activeReceipt.receiptNumber)}
                disabled={downloadingPdf}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm shadow-emerald-600/20 disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>{downloadingPdf ? "Generating PDF..." : "Download PDF"}</span>
              </button>
              <button
                onClick={() => window.print()}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>Print Voucher</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
