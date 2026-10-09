"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  HeartHandshake, User, Search, Calendar, Clock, MessageSquare,
  CheckCircle2, XCircle, CalendarClock, Loader2, AlertCircle, Plus, X
} from "lucide-react";

interface Counsellor {
  _id: string;
  firstName: string;
  lastName: string;
  designation?: string;
  department?: string;
  bio?: string;
}

interface Child {
  _id: string;
  student: {
    _id: string;
    firstName: string;
    lastName: string;
  };
}

interface MyRequest {
  _id: string;
  status: string;
  reason: string;
  proposedStart: string;
  proposedEnd: string;
  confirmedStart?: string;
  confirmedEnd?: string;
  jitsiRoomId?: string;
  counsellor?: { firstName: string; lastName: string; designation?: string };
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending:     { label: "Pending Review",  color: "text-amber-700 bg-amber-50 border-amber-200",    icon: Clock },
  accepted:    { label: "Accepted",        color: "text-emerald-700 bg-emerald-50 border-emerald-200", icon: CheckCircle2 },
  rescheduled: { label: "Rescheduled",     color: "text-blue-700 bg-blue-50 border-blue-200",       icon: CalendarClock },
  rejected:    { label: "Declined",        color: "text-red-700 bg-red-50 border-red-200",           icon: XCircle },
  completed:   { label: "Completed",       color: "text-slate-500 bg-slate-50 border-slate-200",    icon: CheckCircle2 },
  cancelled:   { label: "Cancelled",       color: "text-slate-400 bg-slate-50 border-slate-200",    icon: XCircle },
};

export default function ParentCounsellingPage() {
  const [counsellors, setCounsellors] = useState<Counsellor[]>([]);
  const [myRequests, setMyRequests] = useState<MyRequest[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [loadingCounsellors, setLoadingCounsellors] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCounsellor, setSelectedCounsellor] = useState<Counsellor | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Form fields
  const [studentId, setStudentId] = useState("");
  const [proposedStart, setProposedStart] = useState("");
  const [proposedEnd, setProposedEnd] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState(false);

  const fetchCounsellors = useCallback(() => {
    fetch("/api/counselling", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { if (d.success) setCounsellors(d.data || []); })
      .finally(() => setLoadingCounsellors(false));
  }, []);

  const fetchMyRequests = useCallback(() => {
    fetch("/api/counselling/my-requests", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { if (d.success) setMyRequests(d.data || []); })
      .finally(() => setLoadingRequests(false));
  }, []);

  const fetchChildren = useCallback(() => {
    fetch("/api/parent/children", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { if (d.success) setChildren(d.data || []); });
  }, []);

  useEffect(() => {
    fetchCounsellors();
    fetchMyRequests();
    fetchChildren();
  }, [fetchCounsellors, fetchMyRequests, fetchChildren]);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCounsellor) return;
    setFormError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/counselling", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          counsellorId: selectedCounsellor._id,
          studentId,
          proposedStart: new Date(proposedStart).toISOString(),
          proposedEnd: new Date(proposedEnd).toISOString(),
          reason,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setFormSuccess(true);
        setProposedStart("");
        setProposedEnd("");
        setReason("");
        setStudentId("");
        fetchMyRequests();
        setTimeout(() => {
          setShowForm(false);
          setFormSuccess(false);
          setSelectedCounsellor(null);
        }, 2000);
      } else {
        setFormError(data.error || data.message || "Could not submit request.");
      }
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (requestId: string) => {
    if (!confirm("Cancel this counselling request?")) return;
    const res = await fetch(`/api/counselling/${requestId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ action: "cancel" }),
    });
    const data = await res.json();
    if (data.success) fetchMyRequests();
  };

  const filteredCounsellors = counsellors.filter((c) => {
    const q = search.toLowerCase();
    return (
      `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) ||
      (c.designation || "").toLowerCase().includes(q) ||
      (c.department || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="border-b border-slate-200 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Counselling Sessions</h1>
            <p className="text-sm text-slate-500 mt-0.5">Request a private guidance session with a TrueLern counsellor</p>
          </div>
        </div>
      </div>

      {/* My Requests */}
      <section>
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-600 mb-3 flex items-center gap-2">
          <MessageSquare className="w-4 h-4" /> My Requests
        </h2>
        {loadingRequests ? (
          <div className="flex items-center gap-2 text-slate-400 text-sm py-4"><Loader2 className="w-4 h-4 animate-spin" /> Loading your requests...</div>
        ) : myRequests.length === 0 ? (
          <p className="text-sm text-slate-400 py-4">You haven&apos;t submitted any counselling requests yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {myRequests.map((r) => {
              const cfg = STATUS_CONFIG[r.status] || STATUS_CONFIG.pending;
              const StatusIcon = cfg.icon;
              const displayDate = r.confirmedStart ? new Date(r.confirmedStart) : new Date(r.proposedStart);
              return (
                <div key={r._id} className={`rounded-2xl border p-4 flex flex-col gap-3 ${cfg.color}`}>
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold`}>
                      <StatusIcon className="w-3.5 h-3.5" /> {cfg.label}
                    </span>
                    <span className="text-[11px] font-medium opacity-70">
                      {displayDate.toLocaleDateString()} · {displayDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <div className="text-sm font-bold">
                    {r.counsellor ? `${r.counsellor.firstName} ${r.counsellor.lastName}` : "Counsellor"}
                    {r.counsellor?.designation && <span className="font-normal opacity-70 ml-1.5 text-xs">({r.counsellor.designation})</span>}
                  </div>
                  <p className="text-xs leading-relaxed opacity-80 bg-white/40 rounded-xl p-2.5">{r.reason}</p>
                  <div className="flex gap-2 justify-end">
                    {r.status === "accepted" && r.jitsiRoomId && (
                      <a
                        href={`/parent/live-classes/counselling/${r.jitsiRoomId}`}
                        className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition"
                      >
                        Join Session
                      </a>
                    )}
                    {["pending", "rescheduled"].includes(r.status) && (
                      <button
                        onClick={() => handleCancel(r._id)}
                        className="px-3 py-1.5 bg-white/60 border border-current text-xs font-bold rounded-lg hover:bg-white/80 transition"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Available Counsellors */}
      <section>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
            <User className="w-4 h-4" /> Available Counsellors ({filteredCounsellors.length})
          </h2>
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or department..."
              className="pl-8 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 bg-white w-64"
            />
          </div>
        </div>

        {loadingCounsellors ? (
          <div className="flex items-center gap-2 text-slate-400 text-sm py-4"><Loader2 className="w-4 h-4 animate-spin" /> Loading counsellors...</div>
        ) : filteredCounsellors.length === 0 ? (
          <div className="text-sm text-slate-400 py-6 text-center">
            {search ? "No counsellors match your search." : "No counsellors are available at this time."}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCounsellors.map((c) => (
              <div
                key={c._id}
                className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col gap-3 hover:shadow-md hover:border-indigo-200 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-extrabold text-sm">
                    {c.firstName[0]}{c.lastName[0]}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-slate-900">{c.firstName} {c.lastName}</p>
                    {c.designation && <p className="text-xs text-slate-400">{c.designation}</p>}
                  </div>
                </div>
                {c.department && (
                  <p className="text-xs text-slate-500 font-medium">{c.department}</p>
                )}
                {c.bio && (
                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">{c.bio}</p>
                )}
                <button
                  onClick={() => { setSelectedCounsellor(c); setShowForm(true); setFormError(null); setFormSuccess(false); }}
                  className="mt-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition"
                >
                  <Plus className="w-3.5 h-3.5" /> Request Session
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Request Form Modal */}
      {showForm && selectedCounsellor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 flex flex-col gap-5">
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">Request Counselling Session</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  with {selectedCounsellor.firstName} {selectedCounsellor.lastName}
                  {selectedCounsellor.designation ? ` · ${selectedCounsellor.designation}` : ""}
                </p>
              </div>
              <button
                onClick={() => { setShowForm(false); setSelectedCounsellor(null); }}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition"
              >
                <X className="w-4 h-4 text-slate-600" />
              </button>
            </div>

            {formSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700 font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Request submitted! The counsellor will review it shortly.
              </div>
            )}
            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> {formError}
              </div>
            )}

            <form onSubmit={handleRequest} className="flex flex-col gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-1 flex items-center gap-1">
                  <User className="w-3 h-3" /> Child Name *
                </label>
                <select
                  required
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 bg-white"
                >
                  <option value="" disabled>Select a child</option>
                  {children.map((child) => (
                    <option key={child.student._id} value={child.student._id}>
                      {child.student.firstName} {child.student.lastName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Preferred Start *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={proposedStart}
                    onChange={(e) => setProposedStart(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Preferred End *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={proposedEnd}
                    onChange={(e) => setProposedEnd(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1 flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" /> Reason / What would you like to discuss? *
                </label>
                <textarea
                  rows={4}
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. I would like to understand my child's academic progress and any areas of concern..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="flex gap-3 justify-end pt-1">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setSelectedCounsellor(null); }}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition disabled:opacity-60"
                >
                  {submitting ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Submitting...</> : "Submit Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
