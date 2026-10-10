"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParentChild, ChildProfile } from "@/components/parent/parent-child-context";
import Link from "next/link";

import {
  Sparkles,
  Calendar,
  Clock,
  Check,
  CreditCard,
  Video,
  MessageSquare,
  AlertCircle,
  FileText,
  BookOpen,
  Target,
  BarChart3,
  CalendarDays,
  Bell,
  UserCircle,
  GraduationCap,
  ClipboardList
} from "lucide-react";

// ─── Loading Skeleton ─────────────────────────────────────────────────────────
function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6 animate-pulse pt-2">
      <div className="h-36 rounded-2xl bg-slate-200/60" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => <div key={i} className="h-20 rounded-xl bg-slate-200/60" />)}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 h-52 rounded-2xl bg-slate-200/60" />
        <div className="h-52 rounded-2xl bg-slate-200/60" />
        <div className="h-44 rounded-2xl bg-slate-200/60" />
        <div className="md:col-span-2 h-44 rounded-2xl bg-slate-200/60" />
      </div>
    </div>
  );
}

// ─── Attendance Circle Component ───────────────────────────────────────────────
function AttendanceCircle({ pct, totalSessions, presentSessions }: { pct: number | null; totalSessions: number; presentSessions: number }) {
  const hasSessions = totalSessions > 0;
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = hasSessions && pct !== null ? circumference - (circumference * pct / 100) : circumference;
  const strokeColor = !hasSessions ? "#cbd5e1" : pct !== null && pct >= 80 ? "#10B981" : pct !== null && pct >= 60 ? "#F59E0B" : "#EF4444";

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-28 h-28 flex items-center justify-center mb-3">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="#e8e7f3" strokeWidth="8" />
          <circle
            className="transition-all duration-1000 ease-out"
            cx="50" cy="50" r={radius} fill="none"
            stroke={strokeColor}
            strokeDasharray={circumference}
            strokeDashoffset={strokeOffset}
            strokeLinecap="round" strokeWidth="8"
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="text-2xl font-bold" style={{ color: strokeColor }}>
            {hasSessions && pct !== null ? `${pct}%` : "--"}
          </span>
        </div>
      </div>
      <p className="text-xs text-slate-500 text-center font-medium">
        {hasSessions
          ? `${presentSessions} of ${totalSessions} sessions`
          : "No sessions yet"}
      </p>
    </div>
  );
}

// ─── Main Page Component ───────────────────────────────────────────────────────
export default function ParentDashboardPage() {
  const { children, selectedChild, setSelectedChild, loading: contextLoading, authStatus, authError, refreshChildren } = useParentChild();
  const [data, setData] = useState<any>(null);
  const [statusState, setStatusState] = useState<string | null>(null);
  const [statusInfo, setStatusInfo] = useState<any>(null);
  const [demoData, setDemoData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddingChild, setIsAddingChild] = useState(false);
  const [addForm, setAddForm] = useState({ firstName: "", lastName: "", relationshipType: "guardian" });
  const [initiatingEnrollment, setInitiatingEnrollment] = useState(false);
  const [currentTime, setCurrentTime] = useState<number>(() => Date.now());

  useEffect(() => {
    setCurrentTime(Date.now());
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleProceedToEnrollment = async () => {
    if (!selectedChild?.studentId || initiatingEnrollment) return;
    setInitiatingEnrollment(true);
    try {
      const res = await fetch(`/api/parent/children/${selectedChild.studentId}/enroll`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({}),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || "Failed to initiate enrollment.");
      }
      if (json.data?.checkoutUrl) {
        window.location.href = json.data.checkoutUrl;
      } else {
        window.location.href = "/parent/finance";
      }
    } catch (err: any) {
      alert(err.message || "Could not proceed to enrollment. Please try again.");
      setInitiatingEnrollment(false);
    }
  };

  const fetchDashboard = useCallback(async (childId: string) => {
    try {
      const [dashRes, progRes, schedRes] = await Promise.all([
        fetch(`/api/parent/children/${childId}/dashboard`, { credentials: "include" }),
        fetch(`/api/parent/children/${childId}/program`, { credentials: "include" }),
        fetch(`/api/parent/children/${childId}/schedule`, { credentials: "include" })
      ]);
      
      if (!dashRes.ok) throw new Error("Failed to load child dashboard data");
      const json = await dashRes.json();
      
      let programData = null;
      let scheduleData = null;
      if (progRes.ok) {
        programData = (await progRes.json()).data;
      }
      if (schedRes.ok) {
        scheduleData = (await schedRes.json()).data;
      }
      
      setData({ ...json.data, programData, scheduleData });
    } catch (err: any) {
      setError(err.message);
    }
  }, []);

  const loadStatus = useCallback(async () => {
    if (authStatus === "unauthenticated" || authStatus === "no_parent_profile") {
      setLoading(false);
      return;
    }
    if (contextLoading || authStatus === "checking") {
      return;
    }
    try {
      setLoading(true);
      setError(null);
      setDemoData(null);
      setData(null);

      const urlParams = selectedChild?.studentId ? `?studentId=${selectedChild.studentId}` : "";
      const statusRes = await fetch(`/api/parent/status${urlParams}`, { credentials: "include" });
      
      if (statusRes.status === 401) {
        setError("UNAUTHENTICATED");
        return;
      }
      if (statusRes.status === 403) {
        setError("NO_PARENT_PROFILE");
        return;
      }
      if (!statusRes.ok) throw new Error("Failed to load status");
      const statusJson = await statusRes.json();
      const state = statusJson.data?.state || "STATE_1";
      setStatusState(state);
      setStatusInfo(statusJson.data || null);

      if (state === "STATE_3" || state === "STATE_4") {
        const demoRes = await fetch(`/api/parent/demo${urlParams}`, { credentials: "include" });
        if (demoRes.ok) {
          const demoJson = await demoRes.json();
          setDemoData(demoJson.data || null);
        } else {
          setDemoData(null);
        }
      } else {
        setDemoData(null);
      }

      if (state === "STATE_5" && selectedChild?.studentId) {
        await fetchDashboard(selectedChild.studentId);
      } else {
        setData(null);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, [authStatus, contextLoading, selectedChild?.studentId, fetchDashboard]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const handleAddChild = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingChild(true);
    try {
      const res = await fetch("/api/parent/children", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(addForm),
      });

      let json: any = null;
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        try {
          json = await res.json();
        } catch {
          json = null;
        }
      }

      if (!res.ok) {
        throw new Error(json?.message || `Failed to add child (${res.status})`);
      }
      window.location.reload();
    } catch (err: any) {
      alert(err.message || "Error adding child. Please try again.");
    } finally {
      setIsAddingChild(false);
    }
  };

  // ── Session Expired / Unauthenticated State ────────────────────────────────
  if (authStatus === "unauthenticated" || error === "UNAUTHENTICATED") {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center max-w-md mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-5 border border-amber-100 shadow-sm">
          <UserCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Session Expired</h2>
        <p className="text-sm text-slate-500 mb-6 leading-relaxed">
          Your parent portal session has expired or you are not signed in. Please sign in again to access your dashboard.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <Link
            href="/login?redirect=/parent/dashboard"
            className="flex-1 bg-[#0037b1] hover:bg-[#002b8a] text-white text-sm font-bold py-2.5 px-4 rounded-xl shadow-sm text-center transition"
          >
            Sign In to Parent Portal
          </Link>
          <button
            onClick={() => {
              setError(null);
              refreshChildren();
            }}
            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-sm font-semibold py-2.5 px-4 rounded-xl transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ── No Parent Profile State ────────────────────────────────────────────────
  if (authStatus === "no_parent_profile" || error === "NO_PARENT_PROFILE") {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center max-w-md mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center mb-5 border border-slate-200 shadow-sm">
          <GraduationCap className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Parent Profile Not Found</h2>
        <p className="text-sm text-slate-500 mb-6 leading-relaxed">
          {authError || "This account is not associated with an active parent profile. If you are an administrator, teacher, or student, please navigate to your portal."}
        </p>
        <Link
          href="/login"
          className="bg-[#0037b1] hover:bg-[#002b8a] text-white text-sm font-bold py-2.5 px-6 rounded-xl shadow-sm transition"
        >
          Sign In with Another Account
        </Link>
      </div>
    );
  }

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (contextLoading || authStatus === "checking" || loading) return <DashboardSkeleton />;

  // ── Error ────────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mb-4">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 mb-1">Dashboard Error</h2>
        <p className="text-sm text-slate-500 mb-4">{error}</p>
        <button
          onClick={() => {
            setError(null);
            loadStatus();
          }}
          className="bg-[#0037b1] text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-[#002b8a] transition"
        >
          Retry
        </button>
      </div>
    );
  }

  // ── STATE 1: No children ─────────────────────────────────────────────────────
  if (statusState === "STATE_1") {
    return (
      <div className="max-w-md mx-auto mt-16 bg-white/80 backdrop-blur-md rounded-3xl border border-white p-8 shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center mx-auto mb-5 text-white shadow-md">
          <Sparkles className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 text-center mb-1">Welcome to TrueLern</h2>
        <p className="text-sm text-slate-500 text-center mb-7">Add your child's details to set up their learning profile.</p>
        <form onSubmit={handleAddChild} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">First Name</label>
            <input required type="text" placeholder="e.g. Alex" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#0037b1] outline-none bg-white" value={addForm.firstName} onChange={e => setAddForm({ ...addForm, firstName: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Last Name</label>
            <input required type="text" placeholder="e.g. Mercer" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#0037b1] outline-none bg-white" value={addForm.lastName} onChange={e => setAddForm({ ...addForm, lastName: e.target.value })} />
          </div>
          <button type="submit" disabled={isAddingChild} className="w-full bg-[#0037b1] hover:bg-[#002b8a] text-white font-bold py-3 rounded-xl transition disabled:opacity-50 mt-2">
            {isAddingChild ? "Adding..." : "Continue →"}
          </button>
        </form>
      </div>
    );
  }

  // ── STATE 2: Schedule Demo ───────────────────────────────────────────────────
  if (statusState === "STATE_2") {
    return (
      <div className="max-w-md mx-auto mt-16 bg-white/80 backdrop-blur-md rounded-3xl border border-white p-8 shadow-sm text-center">
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-5 shadow-sm">
          <Calendar className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Book a Free Demo Class</h2>
        <p className="text-sm text-slate-500 mb-7">Experience TrueLern's live cohort-based learning with your child. No commitment required.</p>
        <Link href="/parent/demo" className="inline-block bg-[#0037b1] hover:bg-[#002b8a] text-white font-bold py-3 px-7 rounded-xl transition">
          Schedule Free Demo
        </Link>
      </div>
    );
  }

  // ── STATE 3: Demo Scheduled ──────────────────────────────────────────────────
  if (statusState === "STATE_3") {
    return (
      <div className="max-w-md mx-auto mt-16 bg-white/80 backdrop-blur-md rounded-3xl border border-white p-8 shadow-sm text-center">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-5 shadow-sm">
          <Clock className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-1">Demo Session Booked</h2>
        <p className="text-sm text-slate-500 mb-6">Your demo class is confirmed and ready.</p>
        {demoData && (
          <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl mb-6 text-left space-y-2">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Session</p>
              <p className="font-bold text-slate-800">{demoData.interestedCourse || "Foundation Program"}</p>
              <p className="text-sm text-slate-600 mt-0.5">{demoData.scheduledTime || "Pending confirmation"}</p>
            </div>
            <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Assigned Teacher</span>
              <span className="font-bold text-slate-800">
                {demoData.teacher?.name || "Teacher assignment is being finalized."}
              </span>
            </div>
          </div>
        )}
        {demoData?.joinEligible ? (
          <div className="flex flex-col gap-2">
            <Link href={`/parent/demo/join?demoId=${demoData.demoId || demoData.id}&joinAs=child`} className="block w-full bg-[#0037b1] hover:bg-[#002b8a] text-white font-bold py-3 rounded-xl transition shadow-md shadow-blue-600/20 text-center">
              Join Demo as Child (Attendance) →
            </Link>
            <Link href={`/parent/demo/join?demoId=${demoData.demoId || demoData.id}&joinAs=parent`} className="block w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl transition border border-slate-200 text-center text-sm">
              Join as Parent (Observation)
            </Link>
          </div>
        ) : (
          <button disabled className="w-full bg-slate-100 text-slate-400 font-bold py-3 rounded-xl cursor-not-allowed text-sm">
            Join link will appear shortly before class
          </button>
        )}
      </div>
    );
  }

  // ── STATE 4: Demo Completed / Payment Required / Waiting for Payment ───────
  if (statusState === "STATE_4") {
    const isEnrollmentWaitingPayment = Boolean(statusInfo?.enrollmentId);
    const courseTitle = statusInfo?.courseName || demoData?.courseName || demoData?.interestedCourse || "Foundation Program";
    const teacherName = demoData?.teacher?.name;

    return (
      <div className="max-w-xl mx-auto mt-12 bg-white/90 backdrop-blur-md rounded-3xl border border-emerald-100 p-8 sm:p-10 shadow-lg text-center">
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm border ${
          isEnrollmentWaitingPayment ? "bg-amber-50 text-amber-600 border-amber-200" : "bg-emerald-50 text-emerald-600 border-emerald-200"
        }`}>
          {isEnrollmentWaitingPayment ? <CreditCard className="w-8 h-8" /> : <Check className="w-8 h-8" />}
        </div>
        
        <span className={`inline-block px-3 py-1 text-xs font-bold rounded-full mb-3 uppercase tracking-wider ${
          isEnrollmentWaitingPayment ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
        }`}>
          {isEnrollmentWaitingPayment ? "Enrollment • Waiting for Payment" : "Demo Completed"}
        </span>
        
        <h2 className="text-2xl font-black text-slate-900 mb-2">
          {isEnrollmentWaitingPayment 
            ? `Enrollment #${statusInfo?.enrollmentNumber || ""} — Waiting for Payment`
            : "Demo Completed Successfully!"}
        </h2>
        <p className="text-sm text-slate-600 mb-6 max-w-md mx-auto leading-relaxed">
          {isEnrollmentWaitingPayment ? (
            <>Payment is required to confirm enrollment for <strong className="text-slate-900">{selectedChild?.firstName} {selectedChild?.lastName}</strong> in <strong className="text-slate-900">{courseTitle}</strong>.</>
          ) : (
            <>Your child, <strong className="text-slate-900">{selectedChild?.firstName} {selectedChild?.lastName}</strong>, has completed the demo session for <strong className="text-slate-900">{courseTitle}</strong>.</>
          )}
        </p>

        {/* Course & Child Info Card */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 text-left space-y-3 mb-6 text-xs">
          <div className="flex justify-between items-center pb-2.5 border-b border-slate-200">
            <span className="text-slate-500 font-medium">Enrolling Child</span>
            <span className="font-bold text-slate-900">{selectedChild?.firstName} {selectedChild?.lastName}</span>
          </div>
          <div className="flex justify-between items-center pb-2.5 border-b border-slate-200">
            <span className="text-slate-500 font-medium">Program Course</span>
            <span className="font-bold text-slate-900">{courseTitle}</span>
          </div>
          {statusInfo?.invoiceNumber && (
            <div className="flex justify-between items-center pb-2.5 border-b border-slate-200">
              <span className="text-slate-500 font-medium">Invoice Reference</span>
              <span className="font-mono font-bold text-slate-900">{statusInfo.invoiceNumber}</span>
            </div>
          )}
          {statusInfo?.outstandingAmount !== undefined && (
            <div className="flex justify-between items-center pb-2.5 border-b border-slate-200">
              <span className="text-slate-500 font-medium">Payable Amount</span>
              <span className="font-bold text-emerald-700">${(statusInfo.outstandingAmount / 100).toFixed(2)} USD</span>
            </div>
          )}
          {teacherName && (
            <div className="flex justify-between items-center pb-2.5 border-b border-slate-200">
              <span className="text-slate-500 font-medium">Demo Faculty</span>
              <span className="font-semibold text-slate-800">{teacherName}</span>
            </div>
          )}
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium">Next Step</span>
            <span className="font-bold text-indigo-700">Complete enrollment payment</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={handleProceedToEnrollment}
            disabled={initiatingEnrollment}
            className="flex-1 py-3.5 px-6 bg-[#0037b1] hover:bg-[#002b8a] active:scale-[0.99] disabled:opacity-60 text-white font-bold text-sm rounded-xl shadow-md shadow-blue-600/20 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            {initiatingEnrollment ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Preparing Enrollment...</span>
              </>
            ) : (
              <>
                <span>{isEnrollmentWaitingPayment ? "Proceed to Checkout" : "View Enrollment & Pay"}</span>
                <span className="text-base">&rarr;</span>
              </>
            )}
          </button>
          <Link
            href="/parent/finance"
            className="py-3.5 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-xl transition inline-flex items-center justify-center"
          >
            View Billing & Invoices
          </Link>
        </div>
      </div>
    );
  }

  // ── Fallback guard ───────────────────────────────────────────────────────────
  if (!selectedChild || statusState !== "STATE_5" || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
          <AlertCircle className="w-5 h-5" />
        </div>
        <p className="text-sm text-slate-500">Preparing your dashboard…</p>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // STATE 5: FULL LEARNING HUB DASHBOARD
  // ─────────────────────────────────────────────────────────────────────────────

  const { attendance, enrolledBatches, upcomingLiveClasses, assignmentsCount, recentResults, feeOverview, recentTeacherCommunication } = data;

  const attPct = attendance?.attendancePercentage ?? null;
  const hasSessions = (attendance?.totalSessions || 0) > 0;
  const presentSessions = attendance?.presentSessions || 0;
  const totalSessions = attendance?.totalSessions || 0;

  const primaryBatch = data?.programData?.activeProgram || (data?.programData?.courseName ? data.programData : null) || enrolledBatches?.[0];
  const programName = primaryBatch?.courseName || null;
  const instructor = primaryBatch?.instructor || primaryBatch?.teacher || null;

  const isValidDate = (d: any) => {
    if (!d) return false;
    const time = new Date(d).getTime();
    return !isNaN(time);
  };

  const effectiveNow = (typeof window !== "undefined" && (window as any).__MOCK_TIME__)
    ? new Date((window as any).__MOCK_TIME__).getTime()
    : currentTime;

  const GRACE_WINDOW_MS = 10 * 60 * 1000; // 10 minutes (600,000 ms)

  const rawSchedule: any[] = (Array.isArray(data?.scheduleData) && data.scheduleData.length > 0)
    ? data.scheduleData
    : (Array.isArray(upcomingLiveClasses) && upcomingLiveClasses.length > 0 ? upcomingLiveClasses : []);

  const upcomingSchedule = [...rawSchedule]
    .filter((lc: any) => {
      const status = (lc?.status || "").toLowerCase();
      if (status === "cancelled" || status === "canceled" || status === "completed" || status === "archived" || status === "missed") {
        return false;
      }
      const classStart = new Date(lc?.startDate || lc?.startAt || 0).getTime();
      if (isNaN(classStart) || classStart === 0) return false;

      // Class display window: eligible up to classStart + GRACE_WINDOW_MS (10 minutes)
      return effectiveNow <= classStart + GRACE_WINDOW_MS;
    })
    .sort((a: any, b: any) => {
      const timeA = new Date(a.startDate || a.startAt || 0).getTime();
      const timeB = new Date(b.startDate || b.startAt || 0).getTime();
      return timeA - timeB;
    });

  const nextClass = upcomingSchedule?.[0] || null;
  const nextClassDate = nextClass?.startDate || nextClass?.startAt;
  const hasNextClass = isValidDate(nextClassDate);
  const nextClassStartMs = hasNextClass ? new Date(nextClassDate).getTime() : 0;
  const isNextClassStartingNow = hasNextClass && effectiveNow >= nextClassStartMs && effectiveNow <= (nextClassStartMs + GRACE_WINDOW_MS);
  const totalDue = feeOverview?.totalDue || 0;
  
  const CLAY_ICON_CLASS = "flex items-center justify-center w-10 h-10 rounded-2xl shadow-[4px_4px_10px_rgba(0,0,0,0.04),-4px_-4px_10px_rgba(255,255,255,0.9),inset_2px_2px_4px_rgba(255,255,255,0.8),inset_-2px_-2px_4px_rgba(0,0,0,0.02)]";

  // summary stats for top banner
  const summaryStats = [
    {
      label: "Programs",
      value: enrolledBatches?.length > 0 ? `${enrolledBatches.length} Active` : "None",
      sub: enrolledBatches?.[0]?.courseName || "No program yet",
      color: "text-[#0037b1]",
      icon: <div className={`${CLAY_ICON_CLASS} bg-[#0037b1]/5 text-[#0037b1]`}><BookOpen className="w-5 h-5" /></div>,
    },
    {
      label: "Next Class",
      value: hasNextClass ? new Date(nextClassDate).toLocaleString("en-US", { hour: "numeric", minute: "2-digit" }) : "--",
      sub: hasNextClass 
        ? (isNextClassStartingNow 
            ? `Starting now • ${new Date(nextClassDate).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}` 
            : new Date(nextClassDate).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }))
        : "Waiting for next class",
      badge: isNextClassStartingNow ? "Starting now" : null,
      color: isNextClassStartingNow ? "text-emerald-600" : "text-purple-600",
      icon: <div className={`${CLAY_ICON_CLASS} ${isNextClassStartingNow ? "bg-emerald-50 text-emerald-600" : "bg-purple-50 text-purple-600"}`}><Video className="w-5 h-5" /></div>,
    },
    {
      label: "Assignments",
      value: assignmentsCount > 0 ? `${assignmentsCount} Due` : "All Clear",
      sub: assignmentsCount > 0 ? "Pending submission" : "No pending tasks",
      color: assignmentsCount > 0 ? "text-rose-600" : "text-emerald-600",
      icon: <div className={`${CLAY_ICON_CLASS} ${assignmentsCount > 0 ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"}`}><FileText className="w-5 h-5" /></div>,
    },
    {
      label: "Balance Due",
      value: totalDue > 0 ? `$${totalDue.toFixed(2)}` : "Paid Up",
      sub: totalDue > 0 ? "Outstanding fees" : "All invoices clear",
      color: totalDue > 0 ? "text-amber-600" : "text-emerald-600",
      icon: <div className={`${CLAY_ICON_CLASS} ${totalDue > 0 ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"}`}><CreditCard className="w-5 h-5" /></div>,
    },
  ];

  return (
    <div className="min-h-full">
      {/* ── Welcome Banner ─────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#F3E8FF] via-[#E0F2FE] to-white p-6 md:p-8 shadow-sm mb-6">
        <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-[#0037b1]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 top-0 w-48 h-48 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 backdrop-blur-md mb-3">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-[#0037b1]">Learning Hub</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight mb-1">
              How is {selectedChild.firstName} doing?
            </h1>
            <p className="text-sm text-slate-500">
              {instructor ? `Currently with ${instructor}` : "Track progress, attendance, and communication"}
            </p>
          </div>

          {/* Child Switcher */}
          <div className="flex items-center gap-3 overflow-x-auto pb-1 max-w-full">
            {children.map((child: ChildProfile, idx: number) => {
              const childKey = child.studentId || (child as any)._id || (child as any).id || `child-${idx}`;
              const isActive = child.studentId === selectedChild.studentId;
              return (
                <button
                  key={childKey}
                  onClick={() => setSelectedChild(child)}
                  className={`flex flex-col items-center gap-1.5 min-w-[64px] transition-all group ${isActive ? "opacity-100" : "opacity-60 hover:opacity-100"}`}
                >
                  <div className={`w-14 h-14 rounded-full p-0.5 ${isActive ? "bg-gradient-to-tr from-[#0037b1] to-[#22D3EE]" : "bg-slate-200"}`}>
                    <div className={`w-full h-full rounded-full border-2 border-white flex items-center justify-center font-bold text-lg ${isActive ? "bg-[#0037b1] text-white" : "bg-white text-slate-500"}`}>
                      {child.firstName.charAt(0)}
                    </div>
                  </div>
                  <span className={`text-xs font-bold ${isActive ? "text-[#0037b1]" : "text-slate-500"}`}>
                    {child.firstName}
                  </span>
                </button>
              );
            })}
            <Link href="/parent/children?add=true" className="flex flex-col items-center gap-1.5 min-w-[64px] opacity-60 hover:opacity-100 transition-all">
              <div className="w-14 h-14 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 hover:border-[#0037b1] hover:text-[#0037b1] flex items-center justify-center text-slate-400 text-2xl font-light transition-colors">
                +
              </div>
              <span className="text-xs font-medium text-slate-400">Add</span>
            </Link>
          </div>
        </div>

        {/* Quick summary stats */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          {summaryStats.map((stat) => (
            <div key={stat.label} className="flex flex-col p-4 rounded-xl bg-white/80 backdrop-blur-sm shadow-sm">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider">{stat.label}</span>
                  {(stat as any).badge && (
                    <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-700 animate-pulse shrink-0">
                      {(stat as any).badge}
                    </span>
                  )}
                </div>
                <span className="shrink-0">{stat.icon}</span>
              </div>
              <span className={`text-base md:text-lg font-bold ${stat.color}`}>{stat.value}</span>
              <span className="text-xs sm:text-[13px] font-medium text-slate-500 mt-0.5">{stat.sub}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Cohort Placement in Progress Banner (Phase 3S) ─────────────────────── */}
      {(!enrolledBatches || enrolledBatches.length === 0) && (
        <div className="mb-6 p-6 bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 border border-emerald-200 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">Status Update</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-200 text-emerald-900">Enrollment Confirmed</span>
              </div>
              <h3 className="text-base font-bold text-slate-900 mt-1">Enrollment Confirmed — Cohort Placement in Progress</h3>
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                Your payment is settled. Academic operations is currently assigning your child's cohort batch and class schedule.
              </p>
            </div>
          </div>
          <Link
            href="/parent/finance"
            className="px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 font-bold text-xs rounded-xl shadow-xs transition shrink-0 text-center"
          >
            View Receipt & Statement
          </Link>
        </div>
      )}

      {/* ── Main Bento Grid ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Next Demo Card */}
        {data.nextDemo && (
          <div className="md:col-span-3 bg-gradient-to-r from-amber-50/50 to-orange-50/50 rounded-3xl p-6 shadow-sm border border-amber-100 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shadow-sm shrink-0">
                <Video className="w-7 h-7" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-1">Next Demo Session</p>
                <h3 className="text-xl font-bold text-slate-900">{data.nextDemo.interestedCourse}</h3>
                <p className="text-sm font-semibold text-slate-700 mt-1 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-amber-500" />
                  {new Date(data.nextDemo.scheduledStart).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                </p>
                <p className="text-xs text-slate-600 mt-1">
                  <span className="font-semibold text-slate-700">Teacher: </span>
                  {data.nextDemo.teacher?.name || "Teacher assignment is being finalized."}
                </p>
              </div>
            </div>
            <div className="w-full md:w-auto mt-4 md:mt-0">
              {data.nextDemo.joinEligible ? (
                <div className="flex flex-col gap-2 w-full md:min-w-[200px]">
                  <Link href={`/parent/demo/join?demoId=${data.nextDemo.demoId}&joinAs=child`} className="flex items-center justify-center gap-2 bg-[#0037b1] hover:bg-[#002b8a] text-white font-bold py-3 px-8 rounded-xl shadow-md transition w-full">
                    Join as Child <Video className="w-4 h-4" />
                  </Link>
                  <Link href={`/parent/demo/join?demoId=${data.nextDemo.demoId}&joinAs=parent`} className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 px-8 rounded-xl border border-slate-200 transition w-full text-xs">
                    Join as Parent
                  </Link>
                </div>
              ) : (
                <div className="text-center md:text-right">
                  <button disabled className="w-full md:w-auto bg-slate-100 text-slate-400 font-bold py-3 px-8 rounded-xl cursor-not-allowed text-sm border border-slate-200">
                    Join button active 15m before
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Current Program Card (2/3) */}
        <div className="md:col-span-2 bg-white/80 backdrop-blur-md rounded-3xl p-6 shadow-sm border border-white hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#22D3EE]/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110 pointer-events-none" />
          <div className="flex items-start justify-between mb-6 relative z-10">
            <div>
              <div className="inline-flex items-center gap-1.5 bg-[#22D3EE]/10 text-cyan-700 px-3 py-1 rounded-full text-xs font-bold mb-3">
                <BookOpen className="w-3.5 h-3.5" /> Current Program
              </div>
              {programName ? (
                <>
                  <h3 className="text-xl font-bold text-slate-900 mb-1">{programName}</h3>
                  <p className="text-sm text-slate-500 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    {hasNextClass
                      ? (isNextClassStartingNow
                          ? `Starting now (${new Date(nextClassDate).toLocaleString("en-US", { weekday: "short", hour: "numeric", minute: "2-digit" })})`
                          : `Next: ${new Date(nextClassDate).toLocaleString("en-US", { weekday: "short", hour: "numeric", minute: "2-digit" })}`)
                      : "Waiting for next class"}
                  </p>
                  {instructor && <p className="text-xs text-slate-400 mt-1">Instructor: {instructor}</p>}
                </>
              ) : (
                <div className="py-2">
                  <h3 className="text-base font-semibold text-slate-500">No active program</h3>
                  <p className="text-sm text-slate-400 mt-1">Enroll in a program to see your learning status here.</p>
                </div>
              )}
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#22D3EE]/5 flex items-center justify-center text-cyan-600 shadow-[4px_4px_10px_rgba(0,0,0,0.04),-4px_-4px_10px_rgba(255,255,255,0.9),inset_2px_2px_4px_rgba(255,255,255,0.8),inset_-2px_-2px_4px_rgba(0,0,0,0.02)] shrink-0">
              <Target className="w-6 h-6" />
            </div>
          </div>

          {/* Course Progress strip */}
          <div className="relative z-10 mt-2">
            <div className="flex justify-between items-end mb-2">
              <span className="text-xs font-semibold text-slate-500">Course Progress</span>
              <span className={`text-xs font-bold ${programName ? "text-[#0037b1]" : "text-slate-400"}`}>
                {programName ? `${typeof data?.programData?.progress === "number" ? data.programData.progress : 0}%` : "Not Enrolled"}
              </span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              {programName ? (
                <div 
                  className="bg-gradient-to-r from-[#0037b1] to-[#22D3EE] h-full rounded-full transition-all duration-700 ease-out" 
                  style={{ width: `${Math.min(100, Math.max(0, typeof data?.programData?.progress === "number" ? data.programData.progress : 0))}%` }}
                />
              ) : (
                <div className="bg-slate-200 h-full rounded-full w-full" />
              )}
            </div>
            {!programName && (
              <Link href="/parent/demo" className="inline-block mt-3 text-xs font-bold text-[#0037b1] hover:underline">
                → Schedule a demo to get started
              </Link>
            )}
          </div>

          {/* Upcoming classes list */}
          <div className="mt-5 pt-5 border-t border-slate-100 relative z-10">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Upcoming Classes</p>
            {upcomingSchedule?.length > 0 ? (
              <div className="space-y-2">
                {upcomingSchedule.slice(0, 2).map((lc: any) => {
                  const classId = lc.id || lc._id || lc.classId || "liveclass";
                  const classDate = lc.startDate || lc.startAt;
                  const classTime = classDate ? new Date(classDate).getTime() : "slot";
                  const classKey = `${classId}-${classTime}`;
                  const isLive = (lc.status || "").toLowerCase() === "live" || (lc.status || "").toLowerCase() === "in-progress";
                  const classStartMs = new Date(classDate).getTime();
                  const isStarting = effectiveNow >= classStartMs && effectiveNow <= (classStartMs + GRACE_WINDOW_MS);

                  return (
                    <div key={classKey} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-sm shadow-[2px_2px_6px_rgba(0,0,0,0.04),-2px_-2px_6px_rgba(255,255,255,0.9),inset_1px_1px_2px_rgba(255,255,255,0.8),inset_-1px_-1px_2px_rgba(0,0,0,0.02)] shrink-0">
                        <Video className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{lc.classTitle || lc.title || lc.courseName || lc.course || "Live Class"}</p>
                        <p className="text-[10px] text-slate-500">
                          {isValidDate(classDate) ? new Date(classDate).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "--"}
                        </p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isLive ? "bg-emerald-100 text-emerald-700" : isStarting ? "bg-emerald-100 text-emerald-700 animate-pulse" : "bg-slate-100 text-slate-600"}`}>
                        {isLive ? "LIVE" : isStarting ? "Starting now" : "Scheduled"}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-1">Waiting for next class</p>
            )}
          </div>
        </div>

        {/* Attendance Card (1/3) */}
        <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 shadow-sm flex flex-col items-center justify-center border border-white hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-5 w-full justify-start">
            <div className="w-8 h-8 rounded-xl bg-slate-50 text-slate-500 flex items-center justify-center shadow-[2px_2px_6px_rgba(0,0,0,0.04),-2px_-2px_6px_rgba(255,255,255,0.9),inset_1px_1px_2px_rgba(255,255,255,0.8),inset_-1px_-1px_2px_rgba(0,0,0,0.02)] shrink-0">
              <BarChart3 className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Attendance</h3>
          </div>
          <AttendanceCircle pct={attPct} totalSessions={totalSessions} presentSessions={presentSessions} />
          {hasSessions && attPct !== null && (
            <div className="mt-4 w-full">
              <div className={`text-center text-xs font-bold px-3 py-1.5 rounded-full ${attPct >= 80 ? "bg-emerald-50 text-emerald-700" : attPct >= 60 ? "bg-amber-50 text-amber-700" : "bg-rose-50 text-rose-700"}`}>
                {attPct >= 80 ? "Excellent Attendance!" : attPct >= 60 ? "Needs Improvement" : "Poor Attendance"}
              </div>
            </div>
          )}
          <Link href="/parent/attendance" className="mt-4 text-xs font-bold text-[#0037b1] hover:underline">
            View Details →
          </Link>
        </div>

        {/* Pending Tasks Card (1/3) */}
        <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 shadow-sm border-l-4 border-l-[#9333EA] border-t border-r border-b border-white hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-[#9333EA] flex items-center justify-center shadow-[2px_2px_6px_rgba(0,0,0,0.04),-2px_-2px_6px_rgba(255,255,255,0.9),inset_1px_1px_2px_rgba(255,255,255,0.8),inset_-1px_-1px_2px_rgba(0,0,0,0.02)] shrink-0">
                <ClipboardList className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Pending Tasks</h3>
            </div>
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${assignmentsCount > 0 ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-700"}`}>
              {assignmentsCount > 0 ? `${assignmentsCount} Due` : "All Done"}
            </span>
          </div>

          {/* Recent assessment results */}
          {recentResults?.length > 0 && (
            <div className="mb-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Recent Assessments</p>
              <div className="space-y-2">
                {recentResults.slice(0, 2).map((r: any) => {
                  const resultKey = r.id || r._id || `${r.title || "assessment"}-${r.score || 0}`;
                  return (
                    <div key={resultKey} className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${r.isPassed ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-600"}`}>
                        {r.isPassed ? "Pass" : "Fail"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{r.title || "Assessment"}</p>
                        <p className="text-[10px] text-slate-500">{r.percentage !== undefined ? `${r.percentage}%` : `${r.score} pts`}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {assignmentsCount === 0 && recentResults?.length === 0 && (
            <div className="text-center py-6 text-sm text-slate-400">
              No pending tasks right now
            </div>
          )}

          <Link href="/parent/assignments" className="block text-center w-full py-2.5 rounded-xl border border-slate-200 text-[#0037b1] text-xs font-bold hover:bg-slate-50 transition-colors mt-2">
            View All Assignments
          </Link>
        </div>

        {/* Recent Teacher Communication (2/3) */}
        <div className="md:col-span-2 bg-white/80 backdrop-blur-md rounded-3xl p-6 shadow-sm border border-white hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-[#A855F7] flex items-center justify-center shadow-[2px_2px_6px_rgba(0,0,0,0.04),-2px_-2px_6px_rgba(255,255,255,0.9),inset_1px_1px_2px_rgba(255,255,255,0.8),inset_-1px_-1px_2px_rgba(0,0,0,0.02)] shrink-0">
                <MessageSquare className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Recent Teacher Communication</h3>
            </div>
            <Link href="/parent/messages" className="text-xs font-bold text-[#0037b1] hover:underline">
              View All →
            </Link>
          </div>

          <div className="space-y-4">
            {recentTeacherCommunication && recentTeacherCommunication.length > 0 ? (
              recentTeacherCommunication.map((msg: any) => {
                const msgKey = msg.id || msg._id || `${msg.teacherName || "teacher"}-${msg.createdAt || Date.now()}`;
                return (
                  <div key={msgKey} className="flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center flex-shrink-0 font-bold text-base border-2 border-white shadow-sm">
                      {(msg.teacherName || "T").charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="bg-slate-50 p-3.5 rounded-2xl rounded-tl-none border border-slate-100">
                        <p className="text-sm text-slate-700 leading-relaxed">"{msg.message}"</p>
                        <p className="text-xs text-slate-400 font-bold mt-1.5">— {msg.teacherName || "Teacher"}</p>
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium ml-2 mt-1 block">
                        {new Date(msg.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-sm text-slate-400 bg-slate-50 rounded-2xl border border-slate-100">
                <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p>No recent messages from teachers.</p>
                <p className="text-xs mt-1">Messages will appear here once your teacher sends one.</p>
              </div>
            )}
          </div>
        </div>

        {/* Finance Summary */}
        {feeOverview?.totalInvoices > 0 && (
          <div className="md:col-span-1 bg-white/80 backdrop-blur-md rounded-3xl p-6 shadow-sm border border-white hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 rounded-xl bg-slate-50 text-slate-500 flex items-center justify-center shadow-[2px_2px_6px_rgba(0,0,0,0.04),-2px_-2px_6px_rgba(255,255,255,0.9),inset_1px_1px_2px_rgba(255,255,255,0.8),inset_-1px_-1px_2px_rgba(0,0,0,0.02)] shrink-0">
                <CreditCard className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Financial Overview</h3>
            </div>
            <div className={`p-4 rounded-2xl ${totalDue > 0 ? "bg-amber-50 border border-amber-100" : "bg-emerald-50 border border-emerald-100"}`}>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Outstanding Balance</p>
              <p className={`text-2xl font-bold ${totalDue > 0 ? "text-amber-700" : "text-emerald-700"}`}>
                {totalDue > 0 ? `$${totalDue.toFixed(2)}` : "All Paid"}
              </p>
              <p className="text-xs text-slate-500 mt-1">{feeOverview.totalInvoices} invoice{feeOverview.totalInvoices !== 1 ? "s" : ""} total</p>
            </div>
            <Link href="/parent/finance" className="block text-center w-full py-2.5 rounded-xl bg-[#0037b1] text-white text-xs font-bold hover:bg-[#002b8a] transition-colors mt-4">
              View Invoices & Finance
            </Link>
          </div>
        )}

        {/* Enrolled Programs Section */}
        {enrolledBatches?.length > 1 && (
          <div className={`bg-white/80 backdrop-blur-md rounded-3xl p-6 shadow-sm border border-white hover:shadow-md transition-shadow ${feeOverview?.totalInvoices > 0 ? "md:col-span-2" : "md:col-span-3"}`}>
            <div className="flex items-center gap-2 mb-5 w-full justify-start">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0037b1] flex items-center justify-center shadow-[2px_2px_6px_rgba(0,0,0,0.04),-2px_-2px_6px_rgba(255,255,255,0.9),inset_1px_1px_2px_rgba(255,255,255,0.8),inset_-1px_-1px_2px_rgba(0,0,0,0.02)] shrink-0">
                <GraduationCap className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">All Enrolled Programs</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {enrolledBatches.map((batch: any) => {
                const batchKey = batch.id || batch._id || batch.batchId || batch.batchName || "batch";
                return (
                  <div key={batchKey} className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="w-10 h-10 rounded-xl bg-[#0037b1]/10 text-[#0037b1] flex items-center justify-center text-base font-bold shrink-0">
                      {batch.courseName?.charAt(0) || "P"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">{batch.courseName || "Program"}</p>
                      <p className="text-xs text-slate-500 truncate">{batch.batchName} {batch.instructor ? `• ${batch.instructor}` : ""}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* Bottom Mobile Spacer */}
      <div className="h-8 md:hidden" />
    </div>
  );
}
