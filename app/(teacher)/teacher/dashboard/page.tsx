// @ts-nocheck
import React from "react";
import Link from "next/link";
import { connectDB } from "../../../../config/db";
import { getAuthenticatedTeacher } from "../../../../lib/auth/teacher-session";
import { batchRepository } from "../../../../repositories/batch.repository";
import { BatchTeacher } from "../../../../models/batch-teacher.model";
import { batchStudentRepository } from "../../../../repositories/batch-student.repository";
import { liveClassRepository } from "../../../../repositories/live-class.repository";
import { assignmentRepository } from "../../../../repositories/assignment.repository";
import { assignmentSubmissionRepository } from "../../../../repositories/assignment-submission.repository";
import { assessmentRepository } from "../../../../repositories/assessment.repository";
import { AcademicResolver } from "../../../../services/academic/academic.service";
import { ParentTeacherMessage } from "../../../../models/parent-teacher-message.model";
import { UserCircle, CalendarClock, ArrowRight, FilePenLine, MessageSquare } from "lucide-react";

export const revalidate = 0;

export const metadata = {
  title: "Faculty Dashboard | TrueLern Teacher",
  description: "Academic cohort management, lecture schedules, and submission grading queue.",
};

export default async function TeacherDashboardPage() {
  await connectDB();
  const teacher = await getAuthenticatedTeacher();

  if (!teacher) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
        <div
          style={{ background: "radial-gradient(circle at 10% 20%, #f7e6f8 0%, #ede9fe 25%, #e0f2fe 55%, #fce7f3 80%, #fdf4ff 100%)" }}
          className="w-20 h-20 rounded-3xl flex items-center justify-center mb-4 shadow-lg"
        >
          <UserCircle className="w-10 h-10 text-indigo-500" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">TrueLern Faculty Workspace</h1>
        <p className="text-slate-500 max-w-md mt-2 text-sm">
          Please sign in to access your assigned cohorts, upcoming live classes, and student submission review queue.
        </p>
        <Link
          href="/login?redirect=/teacher/dashboard"
          className="mt-6 px-6 py-2.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-semibold rounded-xl text-sm shadow-md transition"
        >
          Sign In to Faculty Account
        </Link>
      </div>
    );
  }

  // Real teacher scoping: Find all batches where teacher is primary, assistant, mentor, or assigned via BatchTeacher
  const [directBatches, assignedBatchTeachers] = await Promise.all([
    batchRepository.findMany(
      {
        $or: [
          { primaryTeacher: teacher._id },
          { assistantTeacher: teacher._id },
          { mentor: teacher._id },
        ],
      },
      { populate: ["course", "cohort"] }
    ),
    BatchTeacher.find({ teacher: teacher._id, status: "active" }).populate({
      path: "batch",
      populate: ["course", "cohort"],
    }).lean(),
  ]);

  const batchMap = new Map();
  for (const b of directBatches) {
    batchMap.set(b._id.toString(), b);
  }
  for (const bt of assignedBatchTeachers) {
    if (bt.batch) {
      batchMap.set((bt.batch as any)._id.toString(), bt.batch);
    }
  }

  const batches = Array.from(batchMap.values());
  const batchIds = batches.map((b) => b._id);

  const [batchStudents, rawLiveClasses, assignments, assessments] = await Promise.all([
    batchIds.length > 0 ? batchStudentRepository.findMany({ batch: { $in: batchIds } }) : [],
    liveClassRepository.findMany(
      batchIds.length > 0
        ? { $or: [{ teacher: teacher._id }, { batch: { $in: batchIds } }] }
        : { teacher: teacher._id },
      { populate: ["course", "batch"], sort: "startDate", order: "asc" }
    ),
    assignmentRepository.findMany(
      { $or: [{ teacher: teacher._id }, { batch: { $in: batchIds } }] },
      { populate: ["course", "batch"] }
    ),
    assessmentRepository.findMany(
      { $or: [{ teacher: teacher._id }, { batch: { $in: batchIds } }] },
      { populate: ["course", "batch"] }
    ),
  ]);

  const liveClasses = (rawLiveClasses || []).map((lc: any) => AcademicResolver.resolveLiveClass(lc));

  const assignmentIds = assignments.map((a) => a._id);
  const submissions =
    assignmentIds.length > 0
      ? await assignmentSubmissionRepository.findMany(
          { assignment: { $in: assignmentIds } },
          { populate: ["assignment", "student"] }
        )
      : [];

  const pendingSubmissions = submissions.filter((s) => s.status === "submitted" || s.status === "late");

  const recentParentMessages = await ParentTeacherMessage.find({
    teacher: teacher._id,
    senderRole: "parent",
  })
    .sort({ createdAt: -1 })
    .limit(5)
    .populate("parent", "firstName lastName")
    .populate("student", "firstName lastName");

  const now = new Date();
  const nowMs = now.getTime();

  // Helper to extract safe start and end times for any live class
  const getClassSchedule = (lc: any) => {
    const rawStart = lc.startDate || lc.startDateTime || lc.scheduledAt;
    const startDate = rawStart ? new Date(rawStart) : null;
    const startMs = startDate && !isNaN(startDate.getTime()) ? startDate.getTime() : 0;

    let endMs = 0;
    const rawEnd = lc.endDate || lc.endDateTime;
    if (rawEnd) {
      const endDate = new Date(rawEnd);
      if (!isNaN(endDate.getTime())) {
        endMs = endDate.getTime();
      }
    }
    if (!endMs && startMs) {
      const durationMins = typeof lc.duration === "number" && lc.duration > 0 ? lc.duration : 60;
      endMs = startMs + durationMins * 60 * 1000;
    }
    return {
      startMs,
      endMs,
      startDate: startMs ? new Date(startMs) : null,
      endDate: endMs ? new Date(endMs) : null,
    };
  };

  // Filter eligible classes:
  // - Exclude cancelled, completed, archived, missed, and deleted classes
  // - Exclude classes whose scheduled end time has passed
  // - Include classes that are upcoming or in progress (still within duration)
  // - Sort ascending by scheduled start time
  const upcomingClasses = liveClasses
    .filter((lc: any) => {
      if (!lc || lc.isDeleted) return false;
      const status = (lc.status || "").toLowerCase();
      if (
        status === "completed" ||
        status === "archived" ||
        status === "cancelled" ||
        status === "canceled" ||
        status === "missed"
      ) {
        return false;
      }
      const { startMs, endMs } = getClassSchedule(lc);
      if (!startMs || !endMs) return false;

      // Class is eligible as long as its scheduled end time has not passed
      return endMs > nowMs;
    })
    .sort((a: any, b: any) => {
      const aSched = getClassSchedule(a);
      const bSched = getClassSchedule(b);
      return aSched.startMs - bSched.startMs;
    });

  const nextClass = upcomingClasses[0] || null;
  const nextClassSched = nextClass ? getClassSchedule(nextClass) : null;
  const isClassInProgress = Boolean(
    nextClassSched &&
    ((nowMs >= nextClassSched.startMs && nowMs <= nextClassSched.endMs) || nextClass?.status === "live")
  );
  const totalStudents = batchStudents.length;
  const initials = `${teacher.firstName?.charAt(0) || ""}${teacher.lastName?.charAt(0) || ""}`;
  const todayStr = new Date().toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="min-h-full p-0">
      {/* ── Glass Canvas Wrapper ─────────────────────────────────────────────── */}
      <div
        style={{
          background: "rgba(255, 255, 255, 0.72)",
          backdropFilter: "blur(28px) saturate(180%)",
          border: "1.5px solid rgba(255, 255, 255, 0.85)",
        }}
        className="rounded-[2rem] p-5 sm:p-7 shadow-xl flex flex-col gap-6 relative overflow-hidden"
      >

        {/* ── Main Dashboard Body Grid ──────────────────────────────────────── */}
        <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full items-start">

          {/* ── LEFT COLUMN (3 cols): Batches + Pending Reviews ──────────────── */}
          <section className="lg:col-span-3 flex flex-col gap-5">
            {/* Active Batches Card */}
            <div style={{ background: "rgba(255, 255, 255, 0.65)", backdropFilter: "blur(20px)", border: "1px solid rgba(255, 255, 255, 0.9)" }}
              className="rounded-[1.75rem] p-5 shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">My Batches</h3>
                <Link href="/teacher/batches" className="text-[11px] font-semibold text-slate-500 hover:text-[#7C3AED] px-2.5 py-1 rounded-full bg-white/70">View All</Link>
              </div>

              {/* Next live class highlight */}
              {nextClass ? (
                <div style={{ background: "rgba(255, 255, 255, 0.55)", backdropFilter: "blur(16px)", border: "1px solid rgba(255, 255, 255, 0.75)" }}
                  className="rounded-2xl p-3.5 flex items-center gap-3.5">
                  <div className={`w-11 h-11 rounded-xl ${isClassInProgress ? "bg-emerald-100 text-emerald-700" : "bg-purple-100 text-[#7C3AED]"} flex items-center justify-center shrink-0`}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-slate-800 truncate">{(nextClass as any).classTitle || (nextClass as any).title || (nextClass as any).courseName || "Live Class"}</h4>
                    <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${isClassInProgress ? "bg-emerald-500 animate-ping" : "bg-emerald-500 animate-pulse"}`} />
                      {isClassInProgress ? (
                        <span className="font-bold text-emerald-700">In Progress</span>
                      ) : (
                        (() => {
                          const d = nextClassSched?.startDate;
                          const tz = (nextClass as any).timezone;
                          const formatOpts: Intl.DateTimeFormatOptions = {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          };
                          if (tz) {
                            try {
                              Intl.DateTimeFormat(undefined, { timeZone: tz });
                              formatOpts.timeZone = tz;
                            } catch {
                              // ignore invalid timezone
                            }
                          }
                          return d && !isNaN(d.getTime())
                            ? d.toLocaleString("en-US", formatOpts)
                            : "Scheduled Session";
                        })()
                      )}
                    </p>
                  </div>
                </div>
              ) : (
                <div style={{ background: "rgba(255, 255, 255, 0.55)", backdropFilter: "blur(16px)", border: "1px solid rgba(255, 255, 255, 0.75)" }}
                  className="rounded-2xl p-3.5 flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center shrink-0">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-slate-800">No upcoming classes scheduled</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">All cohort lectures are up to date</p>
                  </div>
                </div>
              )}

              {/* Launch Live Class CTA */}
              <Link
                href="/teacher/live-classes"
                className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-semibold text-xs flex items-center justify-between shadow-md shadow-slate-900/10 transition-all group border border-slate-700/50"
              >
                <span className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center group-hover:scale-105 transition-transform shadow-[inset_0_1px_2px_rgba(255,255,255,0.2)]">
                    <CalendarClock className="w-4 h-4 text-white" />
                  </span>
                  <span>View Upcoming Classes</span>
                </span>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </Link>

              <hr className="border-slate-200/50" />

              {/* Batch list */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Active Cohorts</span>
                  <Link href="/teacher/batches" className="text-[11px] font-medium text-slate-400 hover:text-slate-600">View all</Link>
                </div>
                {batches.length === 0 ? (
                  <div className="text-center py-4 text-xs text-slate-400">No batches assigned yet.</div>
                ) : (
                  batches.slice(0, 4).map((batch, idx) => {
                    const colors = [
                      "bg-lime-100 text-lime-700",
                      "bg-indigo-100 text-indigo-700",
                      "bg-slate-900 text-white",
                      "bg-cyan-100 text-cyan-700",
                    ];
                    const color = colors[idx % colors.length];
                    const studentCount = batchStudents.filter((bs) => bs.batch?.toString() === batch._id.toString()).length;
                    return (
                      <div key={batch._id.toString()} className="flex items-center justify-between gap-2 p-2 rounded-xl hover:bg-white/50 transition-colors">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center font-bold text-xs shrink-0`}>
                            {((batch as any).course as any)?.title?.charAt(0) || "B"}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-800 truncate">{(batch as any).batchCode || (batch as any).name || `Batch ${idx + 1}`}</p>
                            <p className="text-[10px] text-slate-500">{studentCount} Student{studentCount !== 1 ? "s" : ""} Enrolled</p>
                          </div>
                        </div>
                        <Link
                          href={`/teacher/batches#batch-${batch._id.toString()}`}
                          className="px-3 py-1 text-[11px] font-bold rounded-full bg-white hover:bg-slate-900 hover:text-white text-slate-700 shadow-sm border border-slate-200/60 transition-all whitespace-nowrap"
                        >
                          View
                        </Link>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Pending Reviews Card */}
            <div style={{ background: "rgba(255, 255, 255, 0.65)", backdropFilter: "blur(20px)", border: "1px solid rgba(255, 255, 255, 0.9)" }}
              className="rounded-[1.75rem] p-5 shadow-sm flex flex-col gap-3.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-800">Pending Reviews</h3>
                <span className="w-6 h-6 rounded-full bg-[#7C3AED]/10 text-[#7C3AED] text-xs font-extrabold flex items-center justify-center">
                  {pendingSubmissions.length}
                </span>
              </div>
              {pendingSubmissions.length === 0 ? (
                <div className="text-center py-5 text-xs text-slate-400">
                  <div className="text-2xl mb-2">✅</div>
                  All submissions reviewed!
                </div>
              ) : (
                pendingSubmissions.slice(0, 4).map((sub) => {
                  const student = sub.student as any;
                  const assign = sub.assignment as any;
                  const subDate = new Date(sub.submittedAt || Date.now());
                  return (
                    <Link
                      key={sub._id?.toString()}
                      href="/teacher/assignments"
                      className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white/40 hover:bg-white transition-all"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="text-center w-7 leading-tight shrink-0">
                          <span className="block text-xs font-extrabold text-[#7C3AED]">{subDate.getDate()}</span>
                          <span className="block text-[9px] font-semibold text-slate-400 uppercase">{subDate.toLocaleString("en-US", { month: "short" })}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate">{student?.firstName} {student?.lastName}</p>
                          <p className="text-[10px] text-slate-500 truncate">{assign?.title || "Assignment"}</p>
                        </div>
                      </div>
                      <div className="w-6 h-6 rounded-full border border-slate-300 hover:border-emerald-500 hover:bg-emerald-50 flex items-center justify-center text-slate-400 transition-colors text-xs shrink-0">
                        →
                      </div>
                    </Link>
                  );
                })
              )}
              {pendingSubmissions.length > 4 && (
                <Link href="/teacher/assignments" className="text-center text-xs font-bold text-[#7C3AED] hover:underline">
                  +{pendingSubmissions.length - 4} more pending
                </Link>
              )}
            </div>
          </section>

          {/* ── CENTER COLUMN (6 cols): Hero + KPIs + Parent Messages ────────── */}
          <section className="lg:col-span-6 flex flex-col gap-6">
            {/* Welcome Hero */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Welcome back,{" "}
                  <span style={{ background: "linear-gradient(135deg, #7C3AED, #6366F1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                    {teacher.firstName}!
                  </span>
                </h1>
                <p className="text-xs font-medium text-slate-500 mt-1">{todayStr} • {teacher.designation || "Faculty Member"}</p>
              </div>

              {/* Quick Action Buttons */}
              <div className="flex items-center gap-2">
                <Link href="/teacher/assignments"
                  style={{ background: "rgba(255, 255, 255, 0.75)", backdropFilter: "blur(12px)", border: "1px solid rgba(255, 255, 255, 0.9)" }}
                  className="px-4 py-2 rounded-2xl text-xs font-bold text-slate-700 flex items-center gap-2 shadow-[0_2px_10px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,1)] hover:bg-white transition-all hover:-translate-y-0.5"
                >
                  <FilePenLine className="w-4 h-4 text-indigo-500" />
                  <span className="hidden sm:inline">Create Assignment</span>
                </Link>
                <Link href="/teacher/calendar"
                  className="px-4 py-2 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-[0_4px_12px_rgba(15,23,42,0.15),inset_0_1px_1px_rgba(255,255,255,0.1)] hover:-translate-y-0.5 transition-all flex items-center gap-2"
                >
                  <CalendarClock className="w-4 h-4 text-purple-300" />
                  <span>View Schedule</span>
                </Link>
              </div>
            </div>

            {/* KPI Bento Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* KPI: Students */}
              <div style={{ background: "rgba(255, 255, 255, 0.65)", backdropFilter: "blur(20px)", border: "1px solid rgba(255, 255, 255, 0.9)" }}
                className="rounded-[1.625rem] p-4 sm:p-5 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[120px]">
                <div className="absolute -top-4 -right-4 w-16 h-16 bg-purple-200/50 rounded-full blur-xl pointer-events-none" />
                <div>
                  <span className="text-3xl sm:text-4xl font-extrabold text-[#7C3AED] tracking-tight">{totalStudents}</span>
                  <p className="text-xs font-bold text-slate-700 mt-1">Active Students</p>
                </div>
                <p className="text-[10px] text-slate-400 font-medium">Across {batches.length} batch{batches.length !== 1 ? "es" : ""}</p>
              </div>

              {/* KPI: Upcoming Classes */}
              <div style={{ background: "rgba(255, 255, 255, 0.65)", backdropFilter: "blur(20px)", border: "1px solid rgba(255, 255, 255, 0.9)" }}
                className="rounded-[1.625rem] p-4 sm:p-5 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[120px]">
                <div className="absolute -top-4 -right-4 w-16 h-16 bg-sky-200/50 rounded-full blur-xl pointer-events-none" />
                <div>
                  <span className="text-3xl sm:text-4xl font-extrabold text-indigo-600 tracking-tight">{upcomingClasses.length}</span>
                  <p className="text-xs font-bold text-slate-700 mt-1">Upcoming Classes</p>
                </div>
                <p className="text-[10px] text-slate-400 font-medium">
                  {(() => {
                    if (!nextClass) return "No classes scheduled";
                    if (isClassInProgress) return "Class in progress";
                    const d = nextClassSched?.startDate;
                    return d && !isNaN(d.getTime())
                      ? `Next: ${d.toLocaleString("en-US", { weekday: "short", hour: "numeric", minute: "2-digit" })}`
                      : "No classes scheduled";
                  })()}
                </p>
              </div>

              {/* KPI: Pending Reviews */}
              <div style={{ background: "rgba(255, 255, 255, 0.65)", backdropFilter: "blur(20px)", border: "1px solid rgba(255, 255, 255, 0.9)" }}
                className="rounded-[1.625rem] p-4 sm:p-5 shadow-sm relative overflow-hidden flex flex-col justify-center justify-between min-h-[120px]">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{submissions.length} Total Submissions</p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-3xl sm:text-4xl font-extrabold text-[#7C3AED] tracking-tight">{pendingSubmissions.length}</span>
                    <span className="text-xs font-semibold text-slate-600">Pending</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">Needs grading</p>
                </div>
                <Link href="/teacher/assignments" className="mt-2 text-xs font-bold text-[#7C3AED] hover:underline">Grade Now →</Link>
              </div>
            </div>

            {/* Recent Parent Communication */}
            <div style={{ background: "rgba(255, 255, 255, 0.65)", backdropFilter: "blur(20px)", border: "1px solid rgba(255, 255, 255, 0.9)" }}
              className="rounded-[1.75rem] p-5 shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Recent Parent Messages</h3>
                  <p className="text-[11px] text-slate-400">Inbound from parent accounts</p>
                </div>
                <Link href="/teacher/messages" className="text-[11px] font-semibold text-[#7C3AED] hover:underline px-2.5 py-1 rounded-full bg-white/70">View All</Link>
              </div>

              {recentParentMessages.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400 bg-white/40 rounded-2xl border border-white/70">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 text-indigo-400 opacity-60" />
                  <p>No parent messages yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentParentMessages.map((msg: any) => {
                    const parent = msg.parent as any;
                    const student = msg.student as any;
                    return (
                      <div key={msg._id.toString()}
                        style={{ background: "rgba(255, 255, 255, 0.55)", backdropFilter: "blur(16px)", border: "1px solid rgba(255, 255, 255, 0.75)" }}
                        className="flex items-start gap-3 p-3.5 rounded-2xl"
                      >
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#7C3AED] to-indigo-500 flex items-center justify-center text-white font-bold text-xs shrink-0">
                          {(parent?.firstName || "P").charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-2 mb-1">
                            <span className="text-xs font-bold text-slate-800">{parent?.firstName} {parent?.lastName}</span>
                            <span className="text-[10px] text-slate-400 whitespace-nowrap">
                              {new Date(msg.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </span>
                          </div>
                          {student && (
                            <p className="text-[10px] font-semibold text-[#7C3AED] mb-1 uppercase tracking-wide">
                              Re: {student.firstName} {student.lastName}
                            </p>
                          )}
                          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">"{msg.message}"</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          {/* ── RIGHT COLUMN (3 cols): Quick Actions + Upcoming Schedule ─────── */}
          <section className="lg:col-span-3 flex flex-col gap-5">
            {/* Quick Actions */}
            <div style={{ background: "rgba(255, 255, 255, 0.65)", backdropFilter: "blur(20px)", border: "1px solid rgba(255, 255, 255, 0.9)" }}
              className="rounded-[1.75rem] p-5 shadow-sm flex flex-col gap-3">
              <h3 className="text-sm font-bold text-slate-900">Quick Actions</h3>
              {[
                { label: "Create Assignment", icon: "📝", href: "/teacher/assignments", bg: "bg-indigo-50 text-indigo-700" },
                { label: "Schedule Live Class", icon: "🎥", href: "/teacher/live-classes", bg: "bg-emerald-50 text-emerald-700" },
                { label: "Add Assessment", icon: "📋", href: "/teacher/assessments", bg: "bg-amber-50 text-amber-700" },
                { label: "Message Parent", icon: "💬", href: "/teacher/communication", bg: "bg-purple-50 text-purple-700" },
                { label: "View Schedule", icon: "📅", href: "/teacher/calendar", bg: "bg-blue-50 text-blue-700" },
                { label: "Grade Now", icon: "🎓", href: "/teacher/gradebook", bg: "bg-rose-50 text-rose-700" },
              ].map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  style={{ background: "rgba(255, 255, 255, 0.55)", backdropFilter: "blur(16px)", border: "1px solid rgba(255, 255, 255, 0.75)" }}
                  className="flex items-center gap-3 p-3 rounded-2xl hover:bg-white/80 transition-all group"
                >
                  <div className={`w-9 h-9 rounded-xl ${action.bg} flex items-center justify-center text-lg shrink-0 group-hover:scale-110 transition-transform`}>
                    {action.icon}
                  </div>
                  <div className="font-semibold text-slate-700 text-xs">{action.label}</div>
                  <div className="ml-auto text-slate-300 group-hover:text-slate-600 transition-colors">→</div>
                </Link>
              ))}
            </div>

            {/* Upcoming Schedule */}
            <div style={{ background: "rgba(255, 255, 255, 0.65)", backdropFilter: "blur(20px)", border: "1px solid rgba(255, 255, 255, 0.9)" }}
              className="rounded-[1.75rem] p-5 shadow-sm flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">Upcoming Classes</h3>
                <Link href="/teacher/live-classes" className="text-[11px] font-semibold text-slate-500 hover:text-[#7C3AED] px-2.5 py-1 rounded-full bg-white/70">View All</Link>
              </div>
              {upcomingClasses.length === 0 ? (
                <div className="text-center py-5 text-xs text-slate-400 bg-white/40 rounded-2xl border border-white/70">
                  <CalendarClock className="w-8 h-8 mx-auto mb-2 text-indigo-400 opacity-60" />
                  No upcoming classes scheduled.
                </div>
              ) : (
                upcomingClasses.slice(0, 4).map((lc) => {
                  const sched = getClassSchedule(lc);
                  const scheduledDate = sched.startDate || new Date();
                  const isRunning = nowMs >= sched.startMs && nowMs <= sched.endMs;
                  return (
                    <div key={(lc as any)._id?.toString() || (lc as any).id}
                      style={{ background: "rgba(255, 255, 255, 0.55)", backdropFilter: "blur(16px)", border: "1px solid rgba(255, 255, 255, 0.75)" }}
                      className="flex items-center gap-3 p-3 rounded-2xl"
                    >
                      <div className="text-center shrink-0 w-10">
                        <span className="block text-sm font-extrabold text-[#7C3AED]">{scheduledDate.getDate()}</span>
                        <span className="block text-[9px] font-semibold text-slate-400 uppercase">{scheduledDate.toLocaleString("en-US", { month: "short" })}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{(lc as any).classTitle || (lc as any).title || (lc as any).courseName || "Live Class"}</p>
                        <p className="text-[10px] text-slate-500 flex items-center gap-1">
                          {isRunning ? (
                            <span className="font-semibold text-emerald-600">In Progress</span>
                          ) : (
                            scheduledDate.toLocaleString("en-US", { hour: "numeric", minute: "2-digit" })
                          )}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

        </main>
      </div>
    </div>
  );
}
