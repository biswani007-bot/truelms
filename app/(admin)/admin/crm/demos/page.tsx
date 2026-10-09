"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Plus,
  Calendar,
  Clock,
  User,
  CheckCircle2,
  X,
  AlertCircle,
  Loader2,
  BookOpen,
  GraduationCap,
  ArrowRight,
  ChevronDown,
  Search,
  Trash2,
} from "lucide-react";
import { DemoDetailModal } from "@/components/admin/DemoDetailModal";

/** ─── Types ─────────────────────────────────────────────── */
interface Course {
  _id: string;
  courseName: string;
  courseCode: string;
  slug: string;
  status: string;
}

interface TeacherOption {
  teacherId: string;
  name: string;
  email: string;
  role: string;
}

interface SlotOption {
  date: string;
  startISO: string;
  endISO: string;
  startLabel: string;
  endLabel: string;
  durationMin: number;
  teacherId: string | null;
  teacherName: string | null;
}

interface ScheduleForm {
  leadId: string;
  parentId: string;
  studentId: string;
  studentName: string;
  parentName: string;
  parentEmail: string;
  courseId: string;
  teacherId: string;
  scheduledStart: string;
  duration: number;
}

const STATUS_CLASS: Record<string, string> = {
  scheduled: "bg-amber-100 text-amber-700",
  live: "bg-red-100 text-red-600 animate-pulse",
  completed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-slate-100 text-slate-600",
  missed: "bg-rose-100 text-rose-700",
  available: "bg-blue-100 text-blue-700",
  booked: "bg-emerald-100 text-emerald-700",
};

export default function AdminDemosPage() {
  // ── List data ──────────────────────────────────────────────────────────────
  const [bookedDemos, setBookedDemos] = useState<any[]>([]);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"booked" | "available">("booked");
  const [selectedDemoIdForDetail, setSelectedDemoIdForDetail] = useState<string | null>(null);

  // ── Notification ───────────────────────────────────────────────────────────
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // ── "Generate Demo Class" modal (legacy — create availability slots) ───────
  const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [times, setTimes] = useState<string[]>(["10:00 AM", "2:00 PM", "4:00 PM"]);
  const [newTime, setNewTime] = useState("");
  const [timeError, setTimeError] = useState<string | null>(null);
  const [slotDuration, setSlotDuration] = useState<string | number>(45);
  const [generating, setGenerating] = useState(false);
  const [slotModalError, setSlotModalError] = useState<string | null>(null);

  // ── "Schedule Demo for Child" modal (new) ─────────────────────────────────
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleStep, setScheduleStep] = useState<1 | 2 | 3>(1);

  // Step 1: Child & Lead search
  const [childSearch, setChildSearch] = useState("");
  const [childSearchResults, setChildSearchResults] = useState<any[]>([]);
  const [searchingChild, setSearchingChild] = useState(false);

  // Step 2: Course → Teacher resolution
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [schedForm, setSchedForm] = useState<ScheduleForm>({
    leadId: "",
    parentId: "",
    studentId: "",
    studentName: "",
    parentName: "",
    parentEmail: "",
    courseId: "",
    teacherId: "",
    scheduledStart: "",
    duration: 45,
  });
  const [eligibleTeachers, setEligibleTeachers] = useState<TeacherOption[]>([]);
  const [smartSlots, setSmartSlots] = useState<SlotOption[]>([]);
  const [loadingSmartData, setLoadingSmartData] = useState(false);

  // Step 3: Confirm & Schedule
  const [scheduling, setScheduling] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);

  // Bulk Delete Available Slots
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);

  // ── Data fetch ─────────────────────────────────────────────────────────────
  const fetchDemos = useCallback(async () => {
    setLoading(true);
    try {
      const [demosRes, availRes] = await Promise.all([
        fetch("/api/crm/demos"),
        fetch("/api/crm/demos/availability"),
      ]);
      const demosJson = await demosRes.json();
      const availJson = await availRes.json();
      if (demosJson.success) setBookedDemos(demosJson.data || []);
      if (availJson.success) setAvailableSlots(availJson.data || []);
    } catch (error) {
      console.error("Failed to fetch demos data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDemos();
  }, [fetchDemos]);

  // Load courses when schedule modal opens
  useEffect(() => {
    if (!isScheduleModalOpen) return;
    const load = async () => {
      setLoadingCourses(true);
      try {
        const res = await fetch("/api/courses?status=published&limit=100");
        const json = await res.json();
        const data = json.data?.courses || json.data || [];
        setAllCourses(Array.isArray(data) ? data : []);
      } catch {
        setAllCourses([]);
      } finally {
        setLoadingCourses(false);
      }
    };
    load();
  }, [isScheduleModalOpen]);

  // Fetch smart schedule data whenever courseId or teacherId changes
  useEffect(() => {
    if (!schedForm.courseId) {
      setEligibleTeachers([]);
      setSmartSlots([]);
      return;
    }
    const fetchSmart = async () => {
      setLoadingSmartData(true);
      try {
        const params = new URLSearchParams({
          courseId: schedForm.courseId,
          duration: schedForm.duration.toString(),
        });
        if (schedForm.teacherId) params.set("teacherId", schedForm.teacherId);
        const res = await fetch(`/api/crm/demos/smart-schedule?${params.toString()}`);
        const json = await res.json();
        if (json.success) {
          setEligibleTeachers(json.data.eligibleTeachers || []);
          setSmartSlots(json.data.slots || []);
          // Auto-select teacher if only one
          if (json.data.eligibleTeachers?.length === 1 && !schedForm.teacherId) {
            setSchedForm((f) => ({
              ...f,
              teacherId: json.data.eligibleTeachers[0].teacherId,
            }));
          }
        }
      } catch (err) {
        console.error("Smart schedule fetch error:", err);
      } finally {
        setLoadingSmartData(false);
      }
    };
    fetchSmart();
  }, [schedForm.courseId, schedForm.teacherId, schedForm.duration]);

  // ── Child/Lead search ──────────────────────────────────────────────────────
  const handleChildSearch = async () => {
    if (!childSearch.trim()) return;
    setSearchingChild(true);
    try {
      const res = await fetch(
        `/api/crm/leads?search=${encodeURIComponent(childSearch.trim())}&limit=10`
      );
      const json = await res.json();
      setChildSearchResults(json.data?.leads || json.data || []);
    } catch {
      setChildSearchResults([]);
    } finally {
      setSearchingChild(false);
    }
  };

  const selectLead = (lead: any) => {
    setSchedForm((f) => ({
      ...f,
      leadId: lead._id,
      parentId: lead.parent?._id || "",
      studentId: lead.student?._id || "",
      studentName: lead.student
        ? `${lead.student.firstName} ${lead.student.lastName}`.trim()
        : lead.fullName || "",
      parentName: lead.parent
        ? `${lead.parent.firstName} ${lead.parent.lastName}`.trim()
        : lead.fullName || "",
      parentEmail: lead.email || "",
      courseId: lead.course?._id || lead.course || "",
      teacherId: "",
    }));
    setChildSearchResults([]);
    setChildSearch("");
    setScheduleStep(2);
  };

  // ── Slot modal helpers (legacy availability generation) ────────────────────
  const toggleDay = (day: number) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const normalizeTimeInput = (raw: string): string | null => {
    const trimmed = raw.trim();
    if (!trimmed) return null;
    const match = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
    if (!match) return null;
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const period = match[3]?.toUpperCase();
    if (minutes < 0 || minutes > 59) return null;
    if (period) {
      if (hours < 1 || hours > 12) return null;
      return `${hours}:${minutes.toString().padStart(2, "0")} ${period}`;
    } else {
      if (hours < 0 || hours > 23) return null;
      const p = hours >= 12 ? "PM" : "AM";
      const h = hours % 12 === 0 ? 12 : hours % 12;
      return `${h}:${minutes.toString().padStart(2, "0")} ${p}`;
    }
  };

  const addTime = () => {
    const normalized = normalizeTimeInput(newTime);
    if (!normalized) {
      setTimeError("Please enter a valid time (e.g. 10:00 AM or 2:00 PM).");
      return;
    }
    if (times.includes(normalized)) {
      setTimeError("This time has already been added.");
      return;
    }
    setTimeError(null);
    setTimes([...times, normalized]);
    setNewTime("");
  };

  const removeTime = (t: string) => setTimes(times.filter((time) => time !== t));

  const handleGenerateSlots = async () => {
    setSlotModalError(null);
    if (!startDate || !endDate || selectedDays.length === 0 || times.length === 0) {
      setSlotModalError("Please fill in all required fields (Dates, Days, and at least one Time).");
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      setSlotModalError("End date must be on or after start date.");
      return;
    }

    const parsedDuration = typeof slotDuration === "string" ? slotDuration.trim() : String(slotDuration);
    if (!parsedDuration) {
      setSlotModalError("Please enter a demo duration in minutes.");
      return;
    }

    const durationNumber = Number(parsedDuration);
    if (isNaN(durationNumber) || !Number.isInteger(durationNumber) || durationNumber <= 0) {
      setSlotModalError("Duration must be a positive whole number of minutes (e.g. 30, 45, 60).");
      return;
    }

    if (durationNumber < 15) {
      setSlotModalError("Demo duration must be at least 15 minutes.");
      return;
    }

    if (durationNumber > 480) {
      setSlotModalError("Demo duration cannot exceed 480 minutes (8 hours).");
      return;
    }

    setGenerating(true);
    try {
      const res = await fetch("/api/crm/demos/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate,
          endDate,
          daysOfWeek: selectedDays,
          times,
          duration: durationNumber,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setNotification({
          type: "success",
          message: json.message || `${json.count || 0} demo times created`,
        });
        setIsSlotModalOpen(false);
        await fetchDemos();
        setActiveTab("available");
      } else {
        setSlotModalError("Unable to create demo availability. Please try again.");
      }
    } catch {
      setSlotModalError("Unable to create demo availability. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const handleRemoveSlot = async (slotId: string) => {
    try {
      const res = await fetch(`/api/crm/demos/availability?id=${slotId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setNotification({ type: "success", message: "Slot removed successfully." });
        await fetchDemos();
      } else {
        setNotification({ type: "error", message: json.error || "Failed to remove slot." });
      }
    } catch {
      setNotification({ type: "error", message: "An error occurred while removing the slot." });
    }
  };

  const handleDeleteAllSlots = async () => {
    setDeletingAll(true);
    try {
      const res = await fetch("/api/crm/demos/availability?all=true", {
        method: "DELETE",
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setIsDeleteAllModalOpen(false);
        setNotification({
          type: "success",
          message: json.message || "All available demo slots removed successfully.",
        });
        await fetchDemos();
      } else {
        setNotification({
          type: "error",
          message: json.error || "Failed to delete available slots.",
        });
      }
    } catch {
      setNotification({
        type: "error",
        message: "An error occurred while removing available slots.",
      });
    } finally {
      setDeletingAll(false);
    }
  };

  // ── Schedule Demo for Child — submit ───────────────────────────────────────
  const handleScheduleDemo = async () => {
    setScheduleError(null);
    if (!schedForm.courseId) {
      setScheduleError("Please select a course/program.");
      return;
    }
    if (!schedForm.scheduledStart) {
      setScheduleError("Please select an available time slot.");
      return;
    }

    setScheduling(true);
    try {
      const res = await fetch("/api/crm/demos/schedule-for-child", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: schedForm.leadId || undefined,
          parentId: schedForm.parentId || undefined,
          studentId: schedForm.studentId || undefined,
          courseId: schedForm.courseId,
          teacherId: schedForm.teacherId || undefined,
          scheduledStart: schedForm.scheduledStart,
          duration: schedForm.duration,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || json.error || "Failed to schedule demo");
      }
      setNotification({
        type: "success",
        message: `Demo (${json.data.demoCode}) scheduled for ${schedForm.studentName || "child"} in ${
          allCourses.find((c) => c._id === schedForm.courseId)?.courseName || "selected program"
        }`,
      });
      setIsScheduleModalOpen(false);
      resetScheduleModal();
      await fetchDemos();
      setActiveTab("booked");
    } catch (err: any) {
      setScheduleError(err.message || "Failed to schedule demo. Please try again.");
    } finally {
      setScheduling(false);
    }
  };

  const resetScheduleModal = () => {
    setScheduleStep(1);
    setChildSearch("");
    setChildSearchResults([]);
    setSchedForm({
      leadId: "",
      parentId: "",
      studentId: "",
      studentName: "",
      parentName: "",
      parentEmail: "",
      courseId: "",
      teacherId: "",
      scheduledStart: "",
      duration: 45,
    });
    setEligibleTeachers([]);
    setSmartSlots([]);
    setScheduleError(null);
  };

  // Derive end time preview
  const selectedSlot = schedForm.scheduledStart
    ? smartSlots.find((s) => s.startISO === schedForm.scheduledStart)
    : null;

  const groupedSlots = smartSlots.reduce<Record<string, SlotOption[]>>((acc, slot) => {
    if (!acc[slot.date]) acc[slot.date] = [];
    acc[slot.date].push(slot);
    return acc;
  }, {});

  const selectedCourse = allCourses.find((c) => c._id === schedForm.courseId);
  const selectedTeacher = eligibleTeachers.find((t) => t.teacherId === schedForm.teacherId);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Notification */}
      {notification && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between text-sm font-semibold transition ${
            notification.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600" />
            )}
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Demo Scheduling</h1>
          <p className="text-sm text-slate-500">Manage available slots and demo bookings</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition shadow-sm"
            onClick={() => {
              resetScheduleModal();
              setIsScheduleModalOpen(true);
            }}
          >
            <GraduationCap className="w-4 h-4" /> Schedule Demo for Child
          </button>
          <button
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition shadow-sm"
            onClick={() => {
              setSlotModalError(null);
              setSlotDuration(45);
              setIsSlotModalOpen(true);
            }}
          >
            <Plus className="w-4 h-4" /> Add Available Times
          </button>
          {activeTab === "available" && (
            <button
              className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => setIsDeleteAllModalOpen(true)}
              disabled={deletingAll || availableSlots.length === 0}
              title={
                availableSlots.length === 0
                  ? "No available slots to delete"
                  : `Delete all ${availableSlots.length} available slots`
              }
            >
              {deletingAll ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              Delete All
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-slate-200">
        {(["booked", "available"] as const).map((tab) => (
          <button
            key={tab}
            className={`pb-3 text-sm font-bold border-b-2 transition-colors ${
              activeTab === tab
                ? "border-indigo-600 text-indigo-700"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === "booked"
              ? `Booked Demos (${bookedDemos.length})`
              : `Available Times (${availableSlots.length})`}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            <p className="text-sm font-medium">Loading demo schedule data...</p>
          </div>
        ) : activeTab === "booked" ? (
          bookedDemos.length === 0 ? (
            <div className="p-16 text-center">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-700 mb-1">No Bookings Found</h3>
              <p className="text-sm text-slate-500">Scheduled demo sessions will appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Child / Parent</th>
                    <th className="px-6 py-4">Program / Course</th>
                    <th className="px-6 py-4">Teacher</th>
                    <th className="px-6 py-4">Date &amp; Time</th>
                    <th className="px-6 py-4">End</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bookedDemos.map((demo: any) => (
                    <tr key={demo._id} className="hover:bg-slate-50/50 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                            {demo.student?.firstName?.[0] ||
                              demo.lead?.fullName?.[0] ||
                              demo.parent?.firstName?.[0] ||
                              "?"}
                          </div>
                          <div>
                            {demo.student ? (
                              <p className="font-bold text-slate-900 text-xs">
                                {demo.student.firstName} {demo.student.lastName}
                              </p>
                            ) : null}
                            <p className="text-xs text-slate-600">
                              {demo.parent
                                ? `${demo.parent.firstName} ${demo.parent.lastName}`.trim()
                                : demo.lead?.fullName || "Parent"}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              {demo.parent?.email || demo.lead?.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-800 text-xs">
                          {demo.course?.courseName || demo.interestedCourse || "General Demo"}
                        </p>
                        {demo.course?.courseCode && (
                          <p className="text-[11px] text-slate-400">{demo.course.courseCode}</p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {demo.teacher ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Teacher Assigned
                            </span>
                            <p className="text-xs font-bold text-slate-800">
                              {demo.teacher.firstName} {demo.teacher.lastName}
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                              Assignment Required
                            </span>
                            <p className="text-[10px] text-slate-500 italic">
                              Unassigned &bull; Action Required
                            </p>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 font-medium text-slate-700 text-xs">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {new Date(demo.scheduledStart).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                          <Clock className="w-3 h-3" />
                          {new Date(demo.scheduledStart).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[11px] text-slate-500">
                        {new Date(demo.scheduledEnd).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        <br />
                        <span className="text-slate-400">{demo.duration} min</span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                            STATUS_CLASS[demo.status] || "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {demo.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedDemoIdForDetail(demo._id)}
                            className={`inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm ${
                              demo.teacher
                                ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                                : "bg-indigo-600 hover:bg-indigo-700 text-white"
                            }`}
                          >
                            {demo.teacher ? "Reassign" : "Assign Teacher"}
                          </button>
                          {demo.lead?._id ? (
                            <Link
                              href={`/admin/crm/leads/${demo.lead._id}`}
                              className="inline-flex items-center justify-center bg-white border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 px-3 py-1.5 rounded-lg text-xs font-semibold transition shadow-sm"
                            >
                              View Lead
                            </Link>
                          ) : (
                            <button
                              onClick={() => setSelectedDemoIdForDetail(demo._id)}
                              className="inline-flex items-center justify-center bg-white border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 px-3 py-1.5 rounded-lg text-xs font-semibold transition shadow-sm"
                            >
                              Details
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : availableSlots.length === 0 ? (
          <div className="p-16 text-center">
            <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-700 mb-1">No Available Times</h3>
            <p className="text-sm text-slate-500">
              Configure availability for parents to book demos.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-4">Date &amp; Time</th>
                  <th className="px-6 py-4">Duration</th>
                  <th className="px-6 py-4">Host / Teacher</th>
                  <th className="px-6 py-4">Program</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {availableSlots.map((slot: any) => (
                  <tr key={slot._id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 font-medium text-slate-700 text-xs">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(slot.scheduledStart).toLocaleDateString("en-US", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1">
                        <Clock className="w-3.5 h-3.5" />
                        {slot.startTime ||
                          new Date(slot.scheduledStart).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-800 text-xs">{slot.duration} min</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-slate-600 font-medium">
                        {slot.teacher?.name || slot.teacher?.firstName
                          ? `${slot.teacher.firstName || ""} ${slot.teacher.lastName || ""}`.trim()
                          : "Open Host"}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-slate-600 font-medium">
                        {slot.course?.courseName || "All Programs"}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          STATUS_CLASS[slot.status] || "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {slot.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {slot.status === "available" && (
                        <button
                          onClick={() => handleRemoveSlot(slot._id)}
                          className="inline-flex items-center justify-center text-rose-600 hover:text-rose-700 text-xs font-semibold transition"
                        >
                          Remove
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* MODAL 1: Schedule Demo for Child (new course-aware flow)           */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-lg font-black text-slate-800">Schedule Demo for Child</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Step {scheduleStep} of 3 —{" "}
                  {scheduleStep === 1
                    ? "Find Child / Parent"
                    : scheduleStep === 2
                    ? "Course, Teacher & Time Slot"
                    : "Review & Confirm"}
                </p>
              </div>
              <button
                onClick={() => {
                  setIsScheduleModalOpen(false);
                  resetScheduleModal();
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step progress bar */}
            <div className="px-6 py-3 shrink-0">
              <div className="flex gap-2">
                {[1, 2, 3].map((s) => (
                  <div
                    key={s}
                    className={`h-1.5 flex-1 rounded-full transition-colors ${
                      s <= scheduleStep ? "bg-indigo-600" : "bg-slate-200"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Error */}
            {scheduleError && (
              <div className="mx-6 mb-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-2 shrink-0">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{scheduleError}</span>
              </div>
            )}

            {/* Modal Body — scrollable */}
            <div className="p-6 overflow-y-auto flex-1 space-y-5">
              {/* ── STEP 1: Find Child/Lead ────────────────────────────── */}
              {scheduleStep === 1 && (
                <div className="space-y-4">
                  <p className="text-sm text-slate-600">
                    Search for the parent/lead by name, email, or phone to associate with this demo session.
                  </p>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Search by name, email, or phone..."
                      value={childSearch}
                      onChange={(e) => setChildSearch(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleChildSearch()}
                      className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={handleChildSearch}
                      disabled={searchingChild}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition disabled:opacity-50"
                    >
                      {searchingChild ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Search className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {childSearchResults.length > 0 && (
                    <div className="border border-slate-200 rounded-2xl overflow-hidden">
                      {childSearchResults.map((lead: any) => (
                        <button
                          key={lead._id}
                          type="button"
                          onClick={() => selectLead(lead)}
                          className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-100 last:border-b-0 transition"
                        >
                          <p className="text-sm font-bold text-slate-900">{lead.fullName}</p>
                          <p className="text-xs text-slate-500">
                            {lead.email} • {lead.phone}
                          </p>
                          {lead.interestedCourse && (
                            <p className="text-[11px] text-indigo-600 font-semibold mt-0.5">
                              Requested: {lead.interestedCourse}
                            </p>
                          )}
                          {lead.student && (
                            <p className="text-[11px] text-emerald-600 mt-0.5">
                              Child: {lead.student.firstName} {lead.student.lastName}
                            </p>
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  {childSearchResults.length === 0 && childSearch && !searchingChild && (
                    <p className="text-xs text-slate-400 text-center py-4">
                      No leads found. Try a different search term.
                    </p>
                  )}

                  {/* Manual entry fallback */}
                  <div className="border-t border-slate-100 pt-4">
                    <p className="text-xs font-bold text-slate-500 mb-3">
                      Or enter details manually:
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-slate-500 block mb-1">Student / Child Name</label>
                        <input
                          type="text"
                          value={schedForm.studentName}
                          onChange={(e) =>
                            setSchedForm((f) => ({ ...f, studentName: e.target.value }))
                          }
                          placeholder="Child full name"
                          className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-500 block mb-1">Parent Email</label>
                        <input
                          type="email"
                          value={schedForm.parentEmail}
                          onChange={(e) =>
                            setSchedForm((f) => ({ ...f, parentEmail: e.target.value }))
                          }
                          placeholder="parent@email.com"
                          className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setScheduleStep(2)}
                      className="mt-3 w-full bg-slate-800 hover:bg-slate-700 text-white py-2.5 rounded-xl text-sm font-bold transition"
                    >
                      Continue with Manual Entry →
                    </button>
                  </div>
                </div>
              )}

              {/* ── STEP 2: Course + Teacher + Slot ───────────────────── */}
              {scheduleStep === 2 && (
                <div className="space-y-5">
                  {/* Child summary */}
                  {(schedForm.studentName || schedForm.parentEmail) && (
                    <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-3 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-sm font-bold shrink-0">
                        {(schedForm.studentName || schedForm.parentEmail)?.[0]?.toUpperCase() || "?"}
                      </div>
                      <div>
                        {schedForm.studentName && (
                          <p className="text-sm font-bold text-slate-900">{schedForm.studentName}</p>
                        )}
                        <p className="text-xs text-slate-500">
                          {schedForm.parentEmail || schedForm.parentName}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* 1. Course Selection */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Course / Program <span className="text-rose-500">*</span>
                    </label>
                    {loadingCourses ? (
                      <div className="flex items-center gap-2 text-sm text-slate-500 py-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Loading courses...
                      </div>
                    ) : (
                      <select
                        value={schedForm.courseId}
                        onChange={(e) =>
                          setSchedForm((f) => ({
                            ...f,
                            courseId: e.target.value,
                            teacherId: "",
                            scheduledStart: "",
                          }))
                        }
                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                      >
                        <option value="">Select a course/program...</option>
                        {allCourses.map((c) => (
                          <option key={c._id} value={c._id}>
                            {c.courseName} ({c.courseCode})
                          </option>
                        ))}
                      </select>
                    )}
                    {schedForm.courseId && schedForm.leadId && (
                      <p className="text-[11px] text-emerald-700 mt-1 font-semibold">
                        ✓ Matches child&apos;s requested program
                      </p>
                    )}
                  </div>

                  {/* 2. Duration */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Demo Duration (minutes)
                    </label>
                    <select
                      value={schedForm.duration}
                      onChange={(e) =>
                        setSchedForm((f) => ({
                          ...f,
                          duration: parseInt(e.target.value),
                          scheduledStart: "",
                        }))
                      }
                      className="w-40 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                    >
                      <option value={30}>30 minutes</option>
                      <option value={45}>45 minutes</option>
                      <option value={60}>60 minutes</option>
                      <option value={90}>90 minutes</option>
                    </select>
                  </div>

                  {/* 3. Teacher Selection */}
                  {schedForm.courseId && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Assigned Teacher
                        {loadingSmartData && (
                          <Loader2 className="w-3.5 h-3.5 animate-spin inline ml-2 text-indigo-500" />
                        )}
                      </label>
                      {!loadingSmartData && eligibleTeachers.length === 0 ? (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 font-medium">
                          ⚠ No teacher is currently assigned/available for this course via batch assignments.
                        </div>
                      ) : (
                        <select
                          value={schedForm.teacherId}
                          onChange={(e) =>
                            setSchedForm((f) => ({
                              ...f,
                              teacherId: e.target.value,
                              scheduledStart: "",
                            }))
                          }
                          className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                        >
                          <option value="">
                            {eligibleTeachers.length === 1
                              ? eligibleTeachers[0].name
                              : "Select teacher..."}
                          </option>
                          {eligibleTeachers.map((t) => (
                            <option key={t.teacherId} value={t.teacherId}>
                              {t.name} ({t.role})
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  )}

                  {/* 4. Available Slots */}
                  {schedForm.courseId && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2">
                        Available Date &amp; Time Slots
                        {loadingSmartData && (
                          <Loader2 className="w-3.5 h-3.5 animate-spin inline ml-2 text-indigo-500" />
                        )}
                      </label>

                      {!loadingSmartData && Object.keys(groupedSlots).length === 0 ? (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 font-medium">
                          No available slots found for the selected teacher/course in the next 14 days.
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                          {Object.entries(groupedSlots)
                            .slice(0, 7)
                            .map(([date, slots]) => (
                              <div key={date}>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                                  {new Date(date).toLocaleDateString("en-US", {
                                    weekday: "short",
                                    month: "short",
                                    day: "numeric",
                                    timeZone: "UTC",
                                  })}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {slots.map((slot) => (
                                    <button
                                      key={slot.startISO}
                                      type="button"
                                      onClick={() =>
                                        setSchedForm((f) => ({
                                          ...f,
                                          scheduledStart: slot.startISO,
                                          teacherId: slot.teacherId || f.teacherId,
                                        }))
                                      }
                                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition ${
                                        schedForm.scheduledStart === slot.startISO
                                          ? "border-indigo-600 bg-indigo-50 text-indigo-900"
                                          : "border-slate-200 hover:border-slate-300 text-slate-700"
                                      }`}
                                    >
                                      {slot.startLabel} – {slot.endLabel}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Start/End preview */}
                  {selectedSlot && (
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Session Preview
                      </p>
                      <div className="grid grid-cols-3 gap-3 text-xs">
                        <div>
                          <p className="text-slate-400 font-medium">Start</p>
                          <p className="font-bold text-slate-900">{selectedSlot.startLabel}</p>
                        </div>
                        <div>
                          <p className="text-slate-400 font-medium">End</p>
                          <p className="font-bold text-slate-900">{selectedSlot.endLabel}</p>
                        </div>
                        <div>
                          <p className="text-slate-400 font-medium">Duration</p>
                          <p className="font-bold text-slate-900">{selectedSlot.durationMin} min</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setScheduleStep(1)}
                      className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-700 py-2.5 rounded-xl text-sm font-bold transition"
                    >
                      ← Back
                    </button>
                    <button
                      type="button"
                      disabled={!schedForm.courseId || !schedForm.scheduledStart}
                      onClick={() => {
                        setScheduleError(null);
                        setScheduleStep(3);
                      }}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-sm font-bold transition disabled:opacity-50"
                    >
                      Review & Confirm →
                    </button>
                  </div>
                </div>
              )}

              {/* ── STEP 3: Review & Confirm ───────────────────────────── */}
              {scheduleStep === 3 && (
                <div className="space-y-4">
                  <h4 className="text-base font-bold text-slate-900">Demo Session Summary</h4>

                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Child</span>
                      <span className="font-bold text-slate-900">
                        {schedForm.studentName || "—"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Parent</span>
                      <span className="font-bold text-slate-900">
                        {schedForm.parentName || schedForm.parentEmail || "—"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Program / Course</span>
                      <span className="font-bold text-slate-900">
                        {selectedCourse?.courseName || "—"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Teacher</span>
                      <span className="font-bold text-slate-900">
                        {selectedTeacher?.name || "Auto-resolved at creation"}
                      </span>
                    </div>
                    {selectedSlot && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-medium">Date</span>
                          <span className="font-bold text-slate-900">
                            {new Date(selectedSlot.startISO).toLocaleDateString("en-US", {
                              weekday: "long",
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              timeZone: "UTC",
                            })}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-medium">Start Time</span>
                          <span className="font-bold text-indigo-700">{selectedSlot.startLabel}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-medium">End Time</span>
                          <span className="font-bold text-indigo-700">{selectedSlot.endLabel}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-medium">Duration</span>
                          <span className="font-bold text-slate-900">
                            {selectedSlot.durationMin} minutes
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-800 font-medium">
                    ✉ A confirmation email + T-25 reminder will be sent automatically to the parent.
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setScheduleStep(2)}
                      className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-700 py-3 rounded-xl text-sm font-bold transition"
                    >
                      ← Back
                    </button>
                    <button
                      type="button"
                      onClick={handleScheduleDemo}
                      disabled={scheduling}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl text-sm font-bold disabled:opacity-50 transition flex items-center justify-center gap-2 shadow-sm"
                    >
                      {scheduling ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Scheduling...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          Generate Demo Class
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* MODAL 2: Add Available Times (legacy slot generation)              */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {isSlotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">Generate Demo Schedule</h3>
              <button
                onClick={() => {
                  setIsSlotModalOpen(false);
                  setSlotModalError(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              {slotModalError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{slotModalError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Days of Week</label>
                <div className="flex gap-2">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, idx) => (
                    <button
                      type="button"
                      key={day}
                      onClick={() => toggleDay(idx)}
                      className={`flex-1 h-10 rounded-xl text-xs font-bold transition ${
                        selectedDays.includes(idx)
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Available Times</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="e.g. 10:00 AM"
                    value={newTime}
                    onChange={(e) => {
                      setNewTime(e.target.value);
                      if (timeError) setTimeError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTime();
                      }
                    }}
                    className="flex-1 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={addTime}
                    className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-sm font-bold transition"
                  >
                    Add
                  </button>
                </div>
                {timeError && (
                  <p className="text-[11px] text-rose-600 font-semibold mb-2">{timeError}</p>
                )}
                <div className="flex flex-wrap gap-2">
                  {times.map((t) => (
                    <div
                      key={t}
                      className="bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 border border-indigo-100"
                    >
                      <span>{t}</span>
                      <button
                        type="button"
                        onClick={() => removeTime(t)}
                        className="text-indigo-400 hover:text-indigo-600 transition"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={slotDuration}
                  onChange={(e) => {
                    setSlotDuration(e.target.value);
                    if (slotModalError) setSlotModalError(null);
                  }}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  placeholder="e.g. 45"
                />
              </div>

              <button
                type="button"
                onClick={handleGenerateSlots}
                disabled={generating}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-xl text-sm font-bold disabled:opacity-50 transition shadow-sm"
              >
                {generating ? "Generating..." : "Create Available Times"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* MODAL 3: Confirm Delete All Available Slots                       */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {isDeleteAllModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <div className="flex items-center gap-2.5 text-rose-600">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <h3 className="text-base font-bold text-slate-800">Delete All Available Times</h3>
              </div>
              <button
                onClick={() => !deletingAll && setIsDeleteAllModalOpen(false)}
                disabled={deletingAll}
                className="text-slate-400 hover:text-slate-600 disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600 leading-relaxed">
                Are you sure you want to delete all available demo time slots? This action will remove{" "}
                <span className="font-bold text-slate-900">
                  {availableSlots.length} available slot{availableSlots.length === 1 ? "" : "s"}
                </span>.
              </p>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Any already-booked demo sessions, student records, and CRM leads will remain intact and will not be deleted.
                </span>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDeleteAllModalOpen(false)}
                  disabled={deletingAll}
                  className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-700 py-2.5 rounded-xl text-sm font-bold transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAllSlots}
                  disabled={deletingAll}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white py-2.5 rounded-xl text-sm font-bold transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                >
                  {deletingAll ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Delete All
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Demo Detail & Teacher Assignment Modal */}
      {selectedDemoIdForDetail && (
        <DemoDetailModal
          isOpen={Boolean(selectedDemoIdForDetail)}
          onClose={() => setSelectedDemoIdForDetail(null)}
          demoId={selectedDemoIdForDetail}
          onUpdated={fetchDemos}
        />
      )}
    </div>
  );
}
