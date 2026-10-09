"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ShieldCheck,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  BookOpen,
  User,
  Sparkles,
  Lock,
  Layers,
  Clock,
  RefreshCw,
  XCircle,
  ChevronRight,
  FileText,
  BadgeCheck,
} from "lucide-react";

interface InvoiceData {
  invoiceId?: string;
  invoiceNumber: string;
  courseId?: string;
  courseName: string;
  courseCode?: string;
  duration?: string;
  deliveryMode?: string;
  studentName: string;
  studentId?: string;
  studentRefId?: string;
  enrollmentId?: string;
  enrollmentNumber?: string;
  baseAmount: number;
  registrationFee?: number;
  materialFee?: number;
  taxAmount: number;
  discountAmount: number;
  scholarshipAmount: number;
  totalAmount: number;
  outstandingAmount: number;
  currency: string;
  status: string;
  enrollmentStatus?: string;
  issueDate?: string;
  dueDate?: string;
}

function CheckoutContent() {
  const searchParams = useSearchParams();
  const sessionToken = searchParams.get("session") || "";
  const paymentParam = searchParams.get("payment");

  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [error, setError] = useState<string>("");
  const [processing, setProcessing] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [handoffToken, setHandoffToken] = useState<string>("");
  const [paymentResult, setPaymentResult] = useState<any>(null);
  const [stripeLoading, setStripeLoading] = useState(false);

  // Fetch authoritative invoice details using the secure session token
  const loadInvoice = async () => {
    if (!sessionToken) {
      setError("No checkout session token provided. Please start from the program or parent dashboard.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`/api/public/enroll/invoice?token=${encodeURIComponent(sessionToken)}`);
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || "Failed to load checkout details.");
      }
      setInvoice(json.data);

      if (
        json.data.status === "paid" ||
        json.data.enrollmentStatus === "confirmed" ||
        json.data.enrollmentStatus === "batch-assigned"
      ) {
        setCompleted(true);
        // Query status endpoint to get handoff token if available
        try {
          const stRes = await fetch(`/api/public/enroll/status?token=${encodeURIComponent(sessionToken)}`);
          const stJson = await stRes.json();
          if (stRes.ok && stJson.data?.handoffToken) {
            setHandoffToken(stJson.data.handoffToken);
          }
        } catch {
          // Non-critical
        }
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while loading checkout details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoice();
  }, [sessionToken]);

  // Execute development sandbox payment
  const handleDevelopmentPayment = async () => {
    if (!sessionToken || processing) return;
    setProcessing(true);
    setError("");

    try {
      const res = await fetch("/api/public/enroll/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checkoutToken: sessionToken }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || "Payment execution failed.");
      }

      setPaymentResult(json.data);
      if (json.data?.handoffToken) {
        setHandoffToken(json.data.handoffToken);
      }
      setCompleted(true);
    } catch (err: any) {
      setError(err.message || "Payment execution encountered an error.");
    } finally {
      setProcessing(false);
    }
  };

  // Launch real Stripe Checkout session
  const handleStripeCheckout = async () => {
    if (!invoice?.invoiceId || stripeLoading) return;
    setStripeLoading(true);
    setError("");

    try {
      const host = window.location.origin;
      const res = await fetch("/api/finance/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: invoice.invoiceId,
          studentId: invoice.studentRefId || invoice.studentId,
          successUrl: `${host}/checkout?session=${encodeURIComponent(sessionToken)}&payment=success`,
          cancelUrl: `${host}/checkout?session=${encodeURIComponent(sessionToken)}&payment=cancelled`,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || "Unable to initiate Stripe checkout.");
      }

      if (json.data?.url) {
        window.location.href = json.data.url;
      } else {
        throw new Error("No checkout URL returned from payment provider.");
      }
    } catch (err: any) {
      setError(err.message || "Stripe checkout could not be initiated.");
      setStripeLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4 px-4">
        <div className="w-10 h-10 border-4 border-[#0037b1] border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-600 font-medium text-sm">Verifying secure checkout session...</p>
      </div>
    );
  }

  if (error && !invoice) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full bg-white border border-rose-200 rounded-3xl p-8 text-center shadow-lg">
          <div className="w-12 h-12 bg-rose-50 border border-rose-200 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Checkout Session Invalid</h2>
          <p className="text-sm text-slate-600 mb-6 leading-relaxed">{error}</p>
          <div className="flex flex-col gap-2.5">
            <Link
              href="/parent/dashboard"
              className="inline-flex items-center justify-center px-6 py-3 bg-[#0037b1] hover:bg-[#002b8a] text-white font-semibold text-sm rounded-xl transition"
            >
              Return to Parent Dashboard
            </Link>
            <Link
              href="/programs"
              className="inline-flex items-center justify-center px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs rounded-xl transition"
            >
              Browse Programs
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // PAYMENT CONFIRMED / SUCCESS SCREEN
  if (completed) {
    const isBatchAssigned =
      paymentResult?.enrollmentStatus === "batch-assigned" ||
      invoice?.enrollmentStatus === "batch-assigned";

    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4 py-12 md:py-16">
        <div className="max-w-2xl w-full bg-white border border-emerald-200 rounded-3xl p-6 sm:p-10 shadow-xl text-center">
          <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm shadow-emerald-100">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <span className="inline-block px-3.5 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full mb-3 uppercase tracking-wider">
            TrueLern Enrollment Confirmed
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-3">
            Welcome to TrueLern!
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed mb-8 max-w-lg mx-auto">
            Thank you! The enrollment payment for <strong className="text-slate-900">{invoice?.studentName}</strong> in{" "}
            <strong className="text-slate-900">{invoice?.courseName}</strong> has been successfully settled.
          </p>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 sm:p-6 text-left space-y-3.5 mb-8">
            <div className="flex justify-between items-center text-xs text-slate-500 pb-2.5 border-b border-slate-200">
              <span className="font-medium">Invoice Reference</span>
              <span className="font-mono font-bold text-slate-900">{invoice?.invoiceNumber}</span>
            </div>
            {paymentResult?.paymentNumber && (
              <div className="flex justify-between items-center text-xs text-slate-500 pb-2.5 border-b border-slate-200">
                <span className="font-medium">Payment Reference</span>
                <span className="font-mono font-bold text-slate-900">{paymentResult.paymentNumber}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-xs text-slate-500 pb-2.5 border-b border-slate-200">
              <span className="font-medium">Total Amount Settled</span>
              <span className="font-bold text-emerald-700 text-sm">
                ${((invoice?.totalAmount || 0) / 100).toFixed(2)} {invoice?.currency || "USD"}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs text-slate-500 pb-2.5 border-b border-slate-200">
              <span className="font-medium">Student Name</span>
              <span className="font-bold text-slate-900">{invoice?.studentName}</span>
            </div>
            <div className="flex justify-between items-center text-xs text-slate-500">
              <span className="font-medium">Cohort Allocation Status</span>
              {isBatchAssigned ? (
                <span className="inline-flex items-center gap-1.5 font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
                  <Sparkles className="w-3.5 h-3.5" /> Batch & Access Activated
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                  <Clock className="w-3.5 h-3.5" /> Next Cohort Queue (Batch Placement in Progress)
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3.5 justify-center">
            <Link
              href="/parent/dashboard"
              className="inline-flex items-center justify-center px-7 py-3.5 bg-[#0037b1] hover:bg-[#002b8a] active:scale-[0.99] text-white font-bold text-sm rounded-xl shadow-md transition gap-2"
            >
              Go to Parent Dashboard <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/parent/finance"
              className="inline-flex items-center justify-center px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-xl transition"
            >
              View Invoices & Receipts
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // PAYMENT FAILURE / CANCELLED NOTICES
  const isPaymentFailed = paymentParam === "failed";
  const isPaymentCancelled = paymentParam === "cancelled";

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16">
      {/* Header */}
      <div className="mb-8 md:mb-10 text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-semibold rounded-full mb-3 shadow-sm">
          <ShieldCheck className="w-4 h-4 text-indigo-600" /> Secure 256-bit Encrypted Checkout
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
          Complete Your Enrollment
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
          Review your course summary and authorize the enrollment fee to secure cohort placement for your child.
        </p>
      </div>

      {/* Warnings & Notifiers */}
      {isPaymentFailed && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-800 text-xs leading-relaxed">
          <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Payment Unsuccessful</p>
            <p className="text-rose-700 mt-0.5">
              The previous payment transaction was not completed. Your enrollment remains in waiting-for-payment status. You can retry authorizing below.
            </p>
          </div>
        </div>
      )}

      {isPaymentCancelled && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-amber-900 text-xs leading-relaxed">
          <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Payment Session Cancelled</p>
            <p className="text-amber-800 mt-0.5">
              The checkout session was exited without charging. You can proceed whenever you are ready.
            </p>
          </div>
        </div>
      )}

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Left Column: What you are enrolling in + Fee Breakdown */}
        <div className="w-full lg:col-span-7 space-y-6">
          {/* Card: What You Are Enrolling In */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-sm space-y-5">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="min-w-0 flex-1">
                <span className="text-[11px] uppercase tracking-wider font-bold text-indigo-600 block mb-1">
                  What You Are Enrolling In
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug break-words">
                  {invoice?.courseName}
                </h2>
                {invoice?.courseCode && (
                  <p className="text-xs text-slate-400 font-mono mt-1">{invoice.courseCode}</p>
                )}
              </div>
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
                <BookOpen className="w-6 h-6" />
              </div>
            </div>

            {/* Program specifications */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3">
                <span className="text-slate-400 font-medium block text-[10px] uppercase">Duration</span>
                <span className="font-bold text-slate-800">{invoice?.duration || "12 Weeks"}</span>
              </div>
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3">
                <span className="text-slate-400 font-medium block text-[10px] uppercase">Delivery Mode</span>
                <span className="font-bold text-slate-800">{invoice?.deliveryMode || "Live Cohort"}</span>
              </div>
            </div>

            {/* Child Profile Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-600 shrink-0 shadow-xs">
                  <User className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Enrolling Child</p>
                  <p className="text-sm font-bold text-slate-900 truncate">{invoice?.studentName}</p>
                </div>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg">
                Waiting for Payment
              </span>
            </div>
          </div>

          {/* Card: Payment Summary */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center justify-between">
              <span>Payment Summary</span>
              <span className="font-mono text-xs text-slate-400">Invoice #{invoice?.invoiceNumber}</span>
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center text-slate-600">
                <span>Tuition & Course Fee</span>
                <span className="font-semibold text-slate-900">
                  ${(((invoice?.baseAmount || 0)) / 100).toFixed(2)}
                </span>
              </div>

              {(invoice?.registrationFee || 0) > 0 && (
                <div className="flex justify-between items-center text-slate-600">
                  <span>Registration Fee</span>
                  <span className="font-semibold text-slate-900">
                    ${((invoice!.registrationFee!) / 100).toFixed(2)}
                  </span>
                </div>
              )}

              {(invoice?.materialFee || 0) > 0 && (
                <div className="flex justify-between items-center text-slate-600">
                  <span>Material & Lab Access</span>
                  <span className="font-semibold text-slate-900">
                    ${((invoice!.materialFee!) / 100).toFixed(2)}
                  </span>
                </div>
              )}

              {(invoice?.taxAmount || 0) > 0 && (
                <div className="flex justify-between items-center text-slate-600">
                  <span>Estimated Taxes</span>
                  <span className="font-semibold text-slate-900">
                    ${(((invoice?.taxAmount || 0)) / 100).toFixed(2)}
                  </span>
                </div>
              )}

              {(invoice?.discountAmount || 0) > 0 && (
                <div className="flex justify-between items-center text-emerald-600 font-medium">
                  <span>Discount Applied</span>
                  <span>-${(((invoice?.discountAmount || 0)) / 100).toFixed(2)}</span>
                </div>
              )}

              <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline">
                <div>
                  <span className="text-sm font-extrabold text-slate-900 block">Total Payable</span>
                  <p className="text-[10px] text-slate-400">Authoritative balance in {invoice?.currency || "USD"}</p>
                </div>
                <div className="text-right">
                  <span className="text-xl sm:text-2xl font-black text-slate-900">
                    ${(((invoice?.outstandingAmount ?? invoice?.totalAmount ?? 0)) / 100).toFixed(2)}
                  </span>
                  <span className="text-xs font-bold text-slate-400 ml-1">
                    {invoice?.currency || "USD"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Payment Authorization & What Happens Next */}
        <div className="w-full lg:col-span-5 space-y-6">
          {/* Card: Payment Authorization CTA */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-sm space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-50 border border-indigo-200 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Authorize Payment</h3>
                <p className="text-[11px] text-slate-400">Official TrueLern Settlement Gate</p>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Primary Payment Action: Pay & Continue */}
            <div className="space-y-3 pt-1">
              <button
                type="button"
                onClick={handleStripeCheckout}
                disabled={stripeLoading || processing}
                className="w-full py-4 px-6 bg-[#0037b1] hover:bg-[#002b8a] active:scale-[0.99] disabled:opacity-60 text-white font-bold text-sm rounded-2xl shadow-lg shadow-blue-600/20 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {stripeLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Connecting to Stripe...</span>
                  </>
                ) : (
                  <>
                    <span>Pay & Continue (${(((invoice?.outstandingAmount ?? invoice?.totalAmount ?? 0)) / 100).toFixed(2)})</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Dev sandbox button for local / testing environments */}
              <button
                type="button"
                onClick={handleDevelopmentPayment}
                disabled={processing || stripeLoading}
                className="w-full py-3 px-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 active:scale-[0.99] disabled:opacity-60 text-slate-700 font-semibold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {processing ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-slate-600 border-t-transparent rounded-full animate-spin" />
                    <span>Settling Payment Sandbox...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5 text-slate-500" />
                    <span>Instant Sandbox Payment (Test Mode)</span>
                  </>
                )}
              </button>
            </div>

            <div className="pt-2 text-center">
              <span className="text-[11px] text-slate-400 flex items-center justify-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Server-authoritative amount & idempotency verified
              </span>
            </div>
          </div>

          {/* Card: What Happens After Payment (Honest Progression) */}
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" /> What Happens After Payment
            </h4>

            <ol className="space-y-3 text-xs text-slate-600">
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  1
                </span>
                <div>
                  <strong className="text-slate-800">Payment Settled:</strong> Receipt is generated immediately and linked to your invoice.
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  2
                </span>
                <div>
                  <strong className="text-slate-800">Enrollment Confirmed:</strong> Your child's enrollment status becomes official and confirmed.
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  3
                </span>
                <div>
                  <strong className="text-slate-800">Cohort & Batch Placement:</strong> Your child is queued for batch placement based on their schedule.
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  4
                </span>
                <div>
                  <strong className="text-slate-800">Class Access & Materials:</strong> Faculty room and live class details will activate in the Student Portal.
                </div>
              </li>
            </ol>

            <p className="text-[11px] text-slate-500 pt-2 border-t border-slate-200/60 leading-relaxed italic">
              Note: Specific cohort batch schedules and teacher assignments are finalized by academic administration prior to the first class session.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex items-center justify-center text-slate-500 font-medium">
          Loading Checkout...
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
