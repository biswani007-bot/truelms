"use client";

import React, { useEffect, useState } from "react";
import {
  X,
  Calendar,
  Clock,
  User,
  BookOpen,
  GraduationCap,
  Video,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  ShieldCheck,
  UserCheck,
  UserX,
  ExternalLink,
} from "lucide-react";

interface DemoDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  demoId: string | null;
  onUpdated: () => void;
}

export function DemoDetailModal({
  isOpen,
  onClose,
  demoId,
  onUpdated,
}: DemoDetailModalProps) {
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [demo, setDemo] = useState<any>(null);
  const [facultyAvailability, setFacultyAvailability] = useState<any[]>([]);
  const [showAssignSection, setShowAssignSection] = useState(false);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("");
  const [reassignReason, setReassignReason] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchDemoDetails = async () => {
    if (!demoId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/crm/demos/${demoId}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || "Failed to load demo details");
      }
      setDemo(data.data?.demo || null);
      setFacultyAvailability(data.data?.facultyAvailability || []);
    } catch (err: any) {
      setError(err.message || "Failed to fetch demo details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && demoId) {
      setShowAssignSection(false);
      setSelectedTeacherId("");
      setReassignReason("");
      setSuccessMsg(null);
      setError(null);
      fetchDemoDetails();
    }
  }, [isOpen, demoId]);

  if (!isOpen || !demoId) return null;

  const handleAssignTeacher = async (teacherId: string) => {
    setAssigning(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const isReassignment = Boolean(demo?.teacher);
      const res = await fetch(`/api/crm/demos/${demoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacherId,
          isReassignment,
          reason: reassignReason || (isReassignment ? "Administrative reassignment" : "Manual assignment"),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || "Failed to assign teacher");
      }
      setSuccessMsg(isReassignment ? "Teacher reassigned successfully!" : "Teacher assigned successfully!");
      setShowAssignSection(false);
      await fetchDemoDetails();
      onUpdated();
    } catch (err: any) {
      setError(err.message || "Assignment failed");
    } finally {
      setAssigning(false);
    }
  };

  const isTeacherAssigned = Boolean(demo?.teacher);
  const isCompleted = demo?.status === "completed";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-slate-800">Demo Session Details</h3>
                {demo?.demoCode && (
                  <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700 font-bold">
                    {demo.demoCode}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Authoritative TrueLern Demo Session &amp; Teacher Assignment
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-semibold">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {loading ? (
            <div className="p-16 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-7 h-7 animate-spin text-indigo-600" />
              <p className="text-sm font-semibold">Loading authoritative session data...</p>
            </div>
          ) : !demo ? (
            <div className="p-12 text-center text-slate-500">Session not found.</div>
          ) : (
            <>
              {/* Completed Demo Banner (Phase 2AA) */}
              {isCompleted && (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-950 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <h4 className="font-black text-sm text-emerald-900 uppercase tracking-wider">
                        Demo Completed
                      </h4>
                    </div>
                    <p className="text-xs text-emerald-700 mt-1">
                      Participation recorded. Ready for enrollment readiness evaluation.
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-semibold text-emerald-800">
                    <div>
                      <span className="text-[10px] text-emerald-600 uppercase block">Actual Duration</span>
                      {Math.round((demo.actualDurationSeconds || 0) / 60)} mins
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-600 uppercase block">Child Attended</span>
                      {demo.firstJoinTime ? "Yes" : "Pending Log"}
                    </div>
                  </div>
                </div>
              )}

              {/* Status and Assignment State Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Session Status:
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      demo.status === "scheduled"
                        ? "bg-amber-100 text-amber-800 border border-amber-200"
                        : demo.status === "completed"
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        : demo.status === "live"
                        ? "bg-red-100 text-red-700 border border-red-200 animate-pulse"
                        : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {demo.status}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Faculty State:
                  </span>
                  {isTeacherAssigned ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Teacher Assigned
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                      Teacher Assignment Required
                    </span>
                  )}
                </div>
              </div>

              {/* Grid: Child, Parent, Course, Session */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Child Card */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-2">
                  <div className="flex items-center gap-2 text-slate-400">
                    <User className="w-4 h-4 text-indigo-600" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Child / Student
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-800">
                      {demo.student
                        ? `${demo.student.firstName} ${demo.student.lastName}`
                        : demo.lead?.fullName || "Prospect Student"}
                    </p>
                    <p className="text-xs font-mono text-slate-500">
                      Code: {demo.student?.studentCode || demo.student?.studentId || "Prospect Lead"}
                    </p>
                  </div>
                </div>

                {/* Parent Card */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-2">
                  <div className="flex items-center gap-2 text-slate-400">
                    <UserCheck className="w-4 h-4 text-indigo-600" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Parent / Guardian
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-800">
                      {demo.parent
                        ? `${demo.parent.firstName} ${demo.parent.lastName}`
                        : demo.lead?.fullName || "Registered Parent"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {demo.parent?.email || demo.lead?.email || "—"}
                    </p>
                    {demo.parent?.phone && (
                      <p className="text-xs text-slate-400 font-mono">{demo.parent.phone}</p>
                    )}
                  </div>
                </div>

                {/* Course Card */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-2">
                  <div className="flex items-center gap-2 text-slate-400">
                    <BookOpen className="w-4 h-4 text-indigo-600" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Course Program
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-800">
                      {demo.course?.courseName || demo.interestedCourse || "General Program"}
                    </p>
                    <p className="text-xs font-mono text-slate-500">
                      Code: {demo.course?.courseCode || "—"}
                    </p>
                  </div>
                </div>

                {/* Session Time Card */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-2">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Calendar className="w-4 h-4 text-indigo-600" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Session Time &amp; Duration
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-800">
                      {new Date(demo.scheduledStart).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                    <p className="text-xs text-slate-600 font-medium">
                      {new Date(demo.scheduledStart).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      –{" "}
                      {new Date(demo.scheduledEnd).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      ({demo.duration} min)
                    </p>
                  </div>
                </div>
              </div>

              {/* Jitsi Room & Attendance Information */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wider">
                    <Video className="w-4 h-4 text-indigo-600" />
                    Interactive Room &amp; Telemetry
                  </div>
                  {demo.meetingLink && (
                    <a
                      href={demo.meetingLink}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-semibold"
                    >
                      Room Link <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Platform</span>
                    <span className="font-semibold text-slate-700 capitalize">
                      {demo.meetingPlatform || "Jitsi"}
                    </span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">First Join</span>
                    <span className="font-semibold text-slate-700">
                      {demo.firstJoinTime
                        ? new Date(demo.firstJoinTime).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })
                        : "Not Recorded"}
                    </span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Last Leave</span>
                    <span className="font-semibold text-slate-700">
                      {demo.lastLeaveTime
                        ? new Date(demo.lastLeaveTime).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })
                        : "Not Recorded"}
                    </span>
                  </div>
                </div>
              </div>

              {/* TEACHER ASSIGNMENT CARD & CONTROLS */}
              <div className="p-5 rounded-3xl border border-slate-200 bg-white shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-indigo-600" />
                    <div>
                      <h4 className="text-sm font-black text-slate-900">Assigned Demo Teacher</h4>
                      <p className="text-xs text-slate-500">
                        Authoritative instructor responsible for delivering this session.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAssignSection((prev) => !prev)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm ${
                      isTeacherAssigned
                        ? "bg-slate-100 hover:bg-slate-200 text-slate-700"
                        : "bg-indigo-600 hover:bg-indigo-700 text-white"
                    }`}
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    {isTeacherAssigned ? "Reassign Teacher" : "Assign Teacher"}
                  </button>
                </div>

                {isTeacherAssigned ? (
                  <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
                        {demo.teacher.firstName?.[0] || "T"}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">
                          {demo.teacher.firstName} {demo.teacher.lastName}
                        </p>
                        <p className="text-xs text-slate-500">
                          {demo.teacher.email} • Code: {demo.teacher.teacherCode || "—"}
                        </p>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Active Assigned Instructor
                    </span>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <UserX className="w-8 h-8 text-rose-500" />
                      <div>
                        <p className="text-sm font-black text-rose-900">Teacher Assignment Required</p>
                        <p className="text-xs text-rose-700 mt-0.5">
                          {facultyAvailability.length === 0
                            ? "No eligible demo faculty configured for this course. Please configure Demo Faculty in Course Management."
                            : facultyAvailability.some((f) => f.available ?? f.isAvailable)
                            ? `${facultyAvailability.filter((f) => f.available ?? f.isAvailable).length} eligible teacher(s) available for this session. Please assign an instructor below.`
                            : "No eligible teacher is currently available for this scheduled slot (schedule conflict or inactive faculty). Admin action is required."}
                        </p>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-200/80 text-rose-900">
                      Unassigned
                    </span>
                  </div>
                )}

                {/* TEACHER ASSIGNMENT SELECTION SECTION */}
                {showAssignSection && (
                  <div className="pt-4 border-t border-slate-100 space-y-4">
                    <div className="flex items-center justify-between">
                      <h5 className="text-xs font-black uppercase tracking-wider text-slate-700">
                        {isTeacherAssigned ? "Reassign to Eligible Faculty" : "Select Faculty for Session"}
                      </h5>
                      <span className="text-[11px] text-slate-400">
                        Evaluated against Course Demo Faculty &amp; Schedule Conflicts
                      </span>
                    </div>

                    {isTeacherAssigned && (
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">
                          Reassignment Audit Reason (optional)
                        </label>
                        <input
                          type="text"
                          value={reassignReason}
                          onChange={(e) => setReassignReason(e.target.value)}
                          placeholder="e.g. Schedule adjustment, instructor leave, course specialization"
                          className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                      </div>
                    )}

                    {facultyAvailability.length === 0 ? (
                      <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 text-center text-amber-800 text-xs">
                        <AlertCircle className="w-6 h-6 text-amber-600 mx-auto mb-2" />
                        <p className="font-bold">No Demo Faculty Configured</p>
                        <p className="text-slate-600 mt-1">
                          This course does not have eligible demo teachers configured yet. Please configure Demo Faculty in the Course Management catalog.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {facultyAvailability.map((fac: any) => {
                          const isCurrent = demo.teacher?._id === fac.teacherId;
                          const isAvailable = Boolean(fac.available ?? fac.isAvailable);
                          const conflictReason = fac.reason || fac.conflictReason;
                          const teacherDisplayName =
                            fac.name ||
                            `${fac.firstName || ""} ${fac.lastName || ""}`.trim() ||
                            fac.email ||
                            "Faculty";
                          const teacherInitial = fac.firstName?.[0] || fac.name?.[0] || "T";
                          const teacherCodeOrEmp = fac.teacherCode || fac.employeeId || "Faculty";

                          return (
                            <div
                              key={fac.teacherId}
                              className={`p-3.5 rounded-2xl border transition flex items-center justify-between ${
                                isCurrent
                                  ? "border-emerald-300 bg-emerald-50/40"
                                  : isAvailable
                                  ? "border-slate-200 hover:border-indigo-300 bg-slate-50/30"
                                  : "border-slate-100 bg-slate-50/70 opacity-70"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs">
                                  {teacherInitial}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-black text-slate-800">
                                      {teacherDisplayName}
                                    </span>
                                    <span
                                      className={`text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                                        fac.role === "primary"
                                          ? "bg-purple-100 text-purple-700 font-black"
                                          : fac.role === "backup"
                                          ? "bg-slate-200 text-slate-700"
                                          : "bg-blue-100 text-blue-700"
                                      }`}
                                    >
                                      {fac.role}
                                    </span>
                                    {isCurrent && (
                                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                                        Current
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-slate-400">
                                    {fac.email} • {teacherCodeOrEmp}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                {isAvailable ? (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Available
                                  </span>
                                ) : (
                                  <div className="text-right">
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                                      <AlertCircle className="w-3 h-3" /> Unavailable
                                    </span>
                                    {conflictReason && (
                                      <p className="text-[10px] text-rose-600 max-w-[200px] truncate mt-0.5" title={conflictReason}>
                                        {conflictReason}
                                      </p>
                                    )}
                                  </div>
                                )}

                                <button
                                  disabled={assigning || !isAvailable || isCurrent}
                                  onClick={() => handleAssignTeacher(fac.teacherId)}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-sm ${
                                    isCurrent
                                      ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                      : isAvailable
                                      ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                                      : "bg-slate-100 text-slate-400 cursor-not-allowed"
                                  }`}
                                >
                                  {assigning ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : isCurrent ? (
                                    "Assigned"
                                  ) : isTeacherAssigned ? (
                                    "Reassign"
                                  ) : (
                                    "Assign"
                                  )}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex justify-end shrink-0 bg-slate-50/50">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
