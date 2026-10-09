"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  HeartHandshake, Calendar, Clock, User, MessageSquare, CheckCircle2,
  XCircle, CalendarClock, Video, ArrowLeft, Loader2, AlertCircle
} from "lucide-react";

interface Request {
  _id: string;
  status: string;
  reason: string;
  notes?: string;
  rejectionReason?: string;
  proposedStart: string;
  proposedEnd: string;
  confirmedStart?: string;
  confirmedEnd?: string;
  jitsiRoomId?: string;
  parent?: { firstName: string; lastName: string; email?: string; phone?: string };
  student?: { firstName: string; lastName: string; studentId?: string };
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending:     { label: "Pending",     color: "text-amber-600 bg-amber-50 border-amber-200" },
  accepted:    { label: "Accepted",    color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  rescheduled: { label: "Rescheduled", color: "text-blue-700 bg-blue-50 border-blue-200" },
  rejected:    { label: "Rejected",    color: "text-red-700 bg-red-50 border-red-200" },
  completed:   { label: "Completed",   color: "text-slate-500 bg-slate-50 border-slate-200" },
  cancelled:   { label: "Cancelled",   color: "text-slate-400 bg-slate-50 border-slate-200" },
};

export default function TeacherCounsellingDetailPage({ params }: { params: Promise<{ requestId: string }> }) {
  const router = useRouter();
  const [request, setRequest] = useState<Request | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  // Action form state
  const [action, setAction] = useState<"accept" | "reject" | "reschedule" | "complete" | null>(null);
  const [confirmedStart, setConfirmedStart] = useState("");
  const [confirmedEnd, setConfirmedEnd] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    params.then(({ requestId }) => {
      fetch(`/api/counselling/${requestId}`, { credentials: "include" })
        .then((r) => r.json())
        .then((d) => {
          if (d.success) setRequest(d.data);
          else setError(d.error || "Failed to load request");
        })
        .catch(() => setError("Network error"))
        .finally(() => setLoading(false));
    });
  }, [params]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!request || !action) return;
    setProcessing(true);
    setError(null);

    const body: Record<string, string | undefined> = { action };
    if (action === "accept" || action === "reschedule") {
      if (!confirmedStart || !confirmedEnd) {
        setError("Please select the confirmed date and time.");
        setProcessing(false);
        return;
      }
      body.confirmedStart = new Date(confirmedStart).toISOString();
      body.confirmedEnd   = new Date(confirmedEnd).toISOString();
    }
    if (action === "reject") body.rejectionReason = rejectionReason;
    if (notes) body.notes = notes;

    try {
      const res = await fetch(`/api/counselling/${request._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(`Request ${action}ed successfully.`);
        setRequest(data.data);
        setAction(null);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || data.message || "Action failed.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 text-center">
        <AlertCircle className="w-12 h-12 text-red-400" />
        <p className="text-slate-600 font-semibold">{error || "Request not found"}</p>
        <Link href="/teacher/counselling" className="text-indigo-600 text-sm underline">← Back to Counselling</Link>
      </div>
    );
  }

  const cfg = STATUS_LABELS[request.status] || STATUS_LABELS.pending;
  const proposedStart = new Date(request.proposedStart);
  const confirmedStartDate = request.confirmedStart ? new Date(request.confirmedStart) : null;
  const isActionable = ["pending", "accepted", "rescheduled"].includes(request.status);

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
      {/* Back */}
      <Link href="/teacher/counselling" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-indigo-600 transition">
        <ArrowLeft className="w-4 h-4" /> All Requests
      </Link>

      {/* Header */}
      <div className="flex items-start gap-4 pb-4 border-b border-slate-200">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
          <HeartHandshake className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-extrabold text-slate-900">Counselling Request</h1>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full border capitalize ${cfg.color}`}>
              {cfg.label}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" />
            {request.parent?.firstName} {request.parent?.lastName}
            {request.student && ` · Re: ${request.student.firstName} ${request.student.lastName}`}
          </p>
        </div>
      </div>

      {/* Success / Error */}
      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700 font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> {success}
        </div>
      )}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {/* Details card */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col gap-4 text-sm">
        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
          <DetailRow icon={Calendar} label="Requested Date" value={proposedStart.toLocaleDateString()} />
          <DetailRow icon={Clock} label="Proposed Time" value={`${proposedStart.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} → ${new Date(request.proposedEnd).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`} />
          {confirmedStartDate && (
            <>
              <DetailRow icon={CalendarClock} label="Confirmed Date" value={confirmedStartDate.toLocaleDateString()} />
              <DetailRow icon={Clock} label="Confirmed Time" value={confirmedStartDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} />
            </>
          )}
          {request.parent?.email && <DetailRow icon={User} label="Parent Email" value={request.parent.email} />}
          {request.parent?.phone && <DetailRow icon={User} label="Parent Phone" value={request.parent.phone} />}
        </div>

        <div className="border-t border-slate-200 pt-3">
          <p className="text-xs font-bold text-slate-500 uppercase mb-1.5 flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" /> Parent&apos;s Reason</p>
          <p className="text-slate-700 leading-relaxed">{request.reason}</p>
        </div>

        {request.notes && (
          <div className="border-t border-slate-200 pt-3">
            <p className="text-xs font-bold text-slate-500 uppercase mb-1.5">Your Notes</p>
            <p className="text-slate-700 leading-relaxed">{request.notes}</p>
          </div>
        )}

        {request.rejectionReason && (
          <div className="border-t border-red-100 pt-3">
            <p className="text-xs font-bold text-red-500 uppercase mb-1.5">Rejection Reason</p>
            <p className="text-red-700 leading-relaxed">{request.rejectionReason}</p>
          </div>
        )}
      </div>

      {/* Join Session button if accepted + room exists */}
      {request.status === "accepted" && request.jitsiRoomId && (
        <Link
          href={`/teacher/live-classes/counselling/${request.jitsiRoomId}`}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl transition shadow-sm"
        >
          <Video className="w-5 h-5" /> Join Private Counselling Session
        </Link>
      )}

      {/* Action Buttons */}
      {isActionable && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <h2 className="text-sm font-bold text-slate-800 mb-3">Respond to Request</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            {[
              { key: "accept",     label: "✓ Accept",      cls: "bg-emerald-600 hover:bg-emerald-700 text-white", show: ["pending", "rescheduled"] },
              { key: "reschedule", label: "↷ Reschedule",  cls: "bg-blue-600 hover:bg-blue-700 text-white",     show: ["pending", "accepted"] },
              { key: "reject",     label: "✕ Decline",     cls: "bg-red-500 hover:bg-red-600 text-white",        show: ["pending"] },
            ]
              .filter((btn) => btn.show.includes(request.status))
              .map((btn) => (
                <button
                  key={btn.key}
                  onClick={() => setAction(action === btn.key ? null : (btn.key as typeof action))}
                  className={`px-4 py-2 text-xs font-bold rounded-xl transition ${btn.cls} ${action === btn.key ? "ring-2 ring-offset-1 ring-slate-400" : ""}`}
                >
                  {btn.label}
                </button>
              ))}
            {["accepted", "rescheduled"].includes(request.status) && (
              <Link
                href="/teacher/communication"
                className="px-4 py-2 text-xs font-bold rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition flex items-center gap-1.5"
              >
                <MessageSquare className="w-3.5 h-3.5" /> Start Chat
              </Link>
            )}
          </div>

          {/* Contextual form */}
          {(action === "accept" || action === "reschedule") && (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3 border-t border-slate-100 pt-4 text-xs">
              <p className="font-bold text-slate-700">{action === "accept" ? "Confirm Session Time" : "Propose New Time"}</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1 font-semibold">Start Date & Time *</label>
                  <input type="datetime-local" required value={confirmedStart} onChange={(e) => setConfirmedStart(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1 font-semibold">End Date & Time *</label>
                  <input type="datetime-local" required value={confirmedEnd} onChange={(e) => setConfirmedEnd(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500" />
                </div>
              </div>
              <div>
                <label className="block text-slate-500 mb-1 font-semibold">Notes (optional)</label>
                <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any prep materials or instructions for the parent..." className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 resize-none" />
              </div>
              <SubmitRow processing={processing} label={action === "accept" ? "Confirm & Accept" : "Send Reschedule"} />
            </form>
          )}

          {action === "reject" && (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3 border-t border-slate-100 pt-4 text-xs">
              <p className="font-bold text-slate-700">Reason for Declining</p>
              <textarea rows={3} value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} placeholder="Let the parent know why you cannot take this session..." className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 resize-none" />
              <SubmitRow processing={processing} label="Decline Request" danger />
            </form>
          )}

          {action === "complete" && (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3 border-t border-slate-100 pt-4 text-xs">
              <p className="font-bold text-slate-700">Session Completion Notes (optional)</p>
              <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Brief summary of topics discussed..." className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 resize-none" />
              <SubmitRow processing={processing} label="Mark as Completed" />
            </form>
          )}
        </div>
      )}
    </div>
  );
}

function DetailRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1 mb-0.5"><Icon className="w-3 h-3" />{label}</p>
      <p className="text-slate-800 font-semibold">{value}</p>
    </div>
  );
}

function SubmitRow({ processing, label, danger = false }: { processing: boolean; label: string; danger?: boolean }) {
  return (
    <div className="flex justify-end gap-2">
      <button type="submit" disabled={processing} className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl text-white transition disabled:opacity-60 ${danger ? "bg-red-500 hover:bg-red-600" : "bg-indigo-600 hover:bg-indigo-700"}`}>
        {processing ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Processing...</> : label}
      </button>
    </div>
  );
}
