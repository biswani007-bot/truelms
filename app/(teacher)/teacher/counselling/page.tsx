// @ts-nocheck
import React from "react";
import Link from "next/link";
import { connectDB } from "../../../../config/db";
import { getAuthenticatedTeacher } from "../../../../lib/auth/teacher-session";
import { CounsellingRequest } from "../../../../models/counselling-request.model";
import { HeartHandshake, Clock, CheckCircle2, XCircle, CalendarClock, User, AlertCircle, Video } from "lucide-react";

export const revalidate = 0;
export const metadata = {
  title: "Counselling Requests | TrueLern Teacher",
  description: "Review and manage parent counselling session requests assigned to you.",
};

const STATUS_CONFIG = {
  pending:     { label: "Pending",     bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200",   icon: Clock },
  accepted:    { label: "Accepted",    bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", icon: CheckCircle2 },
  rescheduled: { label: "Rescheduled", bg: "bg-blue-50",    text: "text-blue-700",    border: "border-blue-200",    icon: CalendarClock },
  rejected:    { label: "Rejected",    bg: "bg-red-50",     text: "text-red-700",     border: "border-red-200",     icon: XCircle },
  completed:   { label: "Completed",   bg: "bg-slate-50",   text: "text-slate-500",   border: "border-slate-200",   icon: CheckCircle2 },
  cancelled:   { label: "Cancelled",   bg: "bg-slate-50",   text: "text-slate-400",   border: "border-slate-200",   icon: XCircle },
};

export default async function TeacherCounsellingPage() {
  await connectDB();
  const teacher = await getAuthenticatedTeacher();

  if (!teacher) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
        <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
        <p className="text-slate-600 font-semibold">Session expired. Please <Link href="/teacher/login" className="text-indigo-600 underline">sign in</Link>.</p>
      </div>
    );
  }

  if (!teacher.isCounsellor) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 gap-4">
        <HeartHandshake className="w-14 h-14 text-slate-300" />
        <h1 className="text-xl font-bold text-slate-700">Counsellor Capability Not Enabled</h1>
        <p className="text-sm text-slate-500 max-w-sm">
          Your account does not have the Counsellor capability enabled. Contact your administrator to activate this feature.
        </p>
      </div>
    );
  }

  // Fetch all requests assigned to this counsellor
  const requests = await CounsellingRequest.find({
    counsellor: teacher._id,
    isDeleted: { $ne: true },
  })
    .populate("parent", "firstName lastName email phone")
    .populate("student", "firstName lastName studentId")
    .sort({ createdAt: -1 })
    .lean();

  const pending    = requests.filter((r) => r.status === "pending");
  const upcoming   = requests.filter((r) => ["accepted", "rescheduled"].includes(r.status));
  const historical = requests.filter((r) => ["completed", "rejected", "cancelled"].includes(r.status));

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900">Counselling Requests</h1>
              <p className="text-sm text-slate-500 mt-0.5">Parents seeking guidance sessions with you</p>
            </div>
          </div>
        </div>
        <div className="flex gap-4 text-center">
          {[
            { label: "Pending",   count: pending.length,    color: "text-amber-600" },
            { label: "Upcoming",  count: upcoming.length,   color: "text-emerald-600" },
            { label: "Historical",count: historical.length, color: "text-slate-500" },
          ].map((s) => (
            <div key={s.label} className="bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3">
              <div className={`text-2xl font-extrabold ${s.color}`}>{s.count}</div>
              <div className="text-[10px] font-semibold text-slate-400 uppercase">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Pending — Action Required */}
      {pending.length > 0 && (
        <section>
          <h2 className="text-xs font-bold uppercase tracking-wider text-amber-700 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4" /> Action Required — {pending.length} Pending
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pending.map((r) => (
              <RequestCard key={r._id.toString()} request={r} actionable />
            ))}
          </div>
        </section>
      )}

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <section>
          <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-700 mb-3 flex items-center gap-2">
            <CalendarClock className="w-4 h-4" /> Upcoming Sessions ({upcoming.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcoming.map((r) => (
              <RequestCard key={r._id.toString()} request={r} />
            ))}
          </div>
        </section>
      )}

      {/* Historical */}
      {historical.length > 0 && (
        <section>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            Past Sessions ({historical.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {historical.slice(0, 10).map((r) => (
              <RequestCard key={r._id.toString()} request={r} />
            ))}
          </div>
        </section>
      )}

      {requests.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <HeartHandshake className="w-16 h-16 text-slate-200" />
          <h2 className="text-lg font-bold text-slate-600">No Counselling Requests Yet</h2>
          <p className="text-sm text-slate-400 max-w-sm">
            When parents submit counselling requests, they will appear here for you to review and respond to.
          </p>
        </div>
      )}
    </div>
  );
}

function RequestCard({ request, actionable = false }: { request: any; actionable?: boolean }) {
  const cfg = STATUS_CONFIG[request.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
  const StatusIcon = cfg.icon;
  const parent = request.parent as any;
  const student = request.student as any;
  const proposedStart = new Date(request.proposedStart);
  const confirmedStart = request.confirmedStart ? new Date(request.confirmedStart) : null;
  const displayDate = confirmedStart || proposedStart;

  return (
    <div className={`rounded-2xl border ${cfg.border} ${cfg.bg} p-5 flex flex-col gap-3`}>
      {/* Status badge + date */}
      <div className="flex items-start justify-between gap-2">
        <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border ${cfg.border} ${cfg.text} ${cfg.bg}`}>
          <StatusIcon className="w-3.5 h-3.5" />
          {cfg.label}
        </span>
        <span className="text-[11px] text-slate-500 font-medium text-right">
          {displayDate.toLocaleDateString()} · {displayDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>

      {/* Parent + student info */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
          <User className="w-4 h-4 text-slate-400" />
          {parent ? `${parent.firstName} ${parent.lastName}` : "Unknown Parent"}
        </div>
        {student && (
          <p className="text-xs text-slate-500 ml-6">
            Re: {student.firstName} {student.lastName}
            {student.studentId ? ` · ${student.studentId}` : ""}
          </p>
        )}
        {parent?.email && <p className="text-xs text-slate-400 ml-6">{parent.email}</p>}
      </div>

      {/* Reason */}
      <p className="text-xs text-slate-600 bg-white/60 border border-white/80 rounded-xl p-3 leading-relaxed">
        {request.reason}
      </p>

      {/* Actions */}
      <div className="flex gap-2 justify-end mt-1">
        {request.status === "accepted" && request.jitsiRoomId && (
          <Link
            href={`/teacher/live-classes/counselling/${request.jitsiRoomId}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition"
          >
            <Video className="w-3.5 h-3.5" /> Join Session
          </Link>
        )}
        <Link
          href={`/teacher/counselling/${request._id.toString()}`}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition border ${
            actionable
              ? "bg-slate-900 text-white border-slate-900 hover:bg-slate-700"
              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
          }`}
        >
          {actionable ? "Respond →" : "View Details"}
        </Link>
      </div>
    </div>
  );
}
