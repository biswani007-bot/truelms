"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParentChild } from "@/components/parent/parent-child-context";
import {
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Clock,
  BookOpen,
  AlertCircle,
  Loader2,
} from "lucide-react";

interface CourseOption {
  id: string;
  courseCode: string;
  courseName: string;
  slug: string;
  shortDescription: string;
  level: string;
  deliveryMode: string;
}

const CARD_COLORS = [
  "from-amber-500 to-orange-500",
  "from-emerald-600 to-teal-700",
  "from-blue-600 to-indigo-700",
  "from-purple-600 to-indigo-800",
  "from-rose-600 to-pink-700",
  "from-cyan-600 to-blue-700",
  "from-violet-600 to-purple-700",
];

export default function ParentDemoBookingPage() {
  const { children: linkedChildren, selectedChild, setSelectedChild, loading: contextLoading } = useParentChild();

  // Real courses from DB
  const [programs, setPrograms] = useState<CourseOption[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);

  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlotId, setSelectedSlotId] = useState("");

  const [availability, setAvailability] = useState<{
    dates: string[];
    slotsByDate: Record<string, any[]>;
  }>({ dates: [], slotsByDate: {} });
  const [fetchingSlots, setFetchingSlots] = useState(false);

  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<any>(null);

  // Load real courses from DB
  useEffect(() => {
    const fetchCourses = async () => {
      setLoadingCourses(true);
      try {
        const res = await fetch("/api/parent/demo/courses");
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setPrograms(json.data);
          setSelectedCourseId(json.data[0].id);
        }
      } catch (err) {
        console.error("Failed to load courses", err);
      } finally {
        setLoadingCourses(false);
      }
    };
    fetchCourses();
  }, []);

  // Fetch availability slots whenever course changes
  useEffect(() => {
    if (!selectedCourseId) return;
    const fetchSlots = async () => {
      setFetchingSlots(true);
      try {
        const res = await fetch(`/api/parent/demo/availability?courseId=${selectedCourseId}`);
        const json = await res.json();
        if (json.success) {
          setAvailability(json.data);
          if (json.data.dates.length > 0) {
            const firstDate = json.data.dates[0];
            setSelectedDate(firstDate);
            setSelectedSlotId(json.data.slotsByDate[firstDate]?.[0]?.id || "");
          } else {
            setSelectedDate("");
            setSelectedSlotId("");
          }
        }
      } catch (err) {
        console.error("Failed to fetch slots", err);
      } finally {
        setFetchingSlots(false);
      }
    };
    fetchSlots();
  }, [selectedCourseId]);

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    const slotsForDate = availability.slotsByDate[date] || [];
    if (slotsForDate.length > 0) {
      setSelectedSlotId(slotsForDate[0].id);
    } else {
      setSelectedSlotId("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChild) {
      setError("Please select a child before booking a demo.");
      return;
    }
    if (!selectedCourseId) {
      setError("Please select a program before booking a demo.");
      return;
    }
    if (!selectedSlotId) {
      setError("Please select an available time slot.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/parent/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          studentId: selectedChild.studentId,
          courseId: selectedCourseId,
          slotId: selectedSlotId,
          notes: notes.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || json.message || "Failed to schedule demo session");
      }

      setSuccessData(json.data);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (contextLoading || loadingCourses) {
    return (
      <div className="max-w-4xl mx-auto py-10 space-y-6">
        <div className="h-20 bg-slate-200/60 rounded-3xl animate-pulse" />
        <div className="h-96 bg-slate-200/60 rounded-3xl animate-pulse" />
      </div>
    );
  }

  if (!linkedChildren || linkedChildren.length === 0) {
    return (
      <div className="max-w-lg mx-auto mt-12 bg-white border border-slate-200 rounded-3xl p-8 text-center shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">No Child Profiles Linked</h2>
        <p className="text-sm text-slate-500 mb-6">
          Please add your child&apos;s profile on your dashboard first before scheduling a live demo class.
        </p>
        <Link
          href="/parent/dashboard"
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-xl transition"
        >
          <ArrowLeft className="w-4 h-4" /> Go to Dashboard
        </Link>
      </div>
    );
  }

  if (successData) {
    const selectedCourse = programs.find((p) => p.id === selectedCourseId);
    return (
      <div className="max-w-xl mx-auto mt-10 bg-white border border-emerald-200/80 rounded-3xl p-8 text-center shadow-lg shadow-emerald-600/5">
        <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <div className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
          Demo Class Confirmed
        </div>
        <h1 className="text-2xl font-black text-slate-900 mb-2">Live Demo Successfully Booked!</h1>
        <p className="text-sm text-slate-600 mb-6 max-w-md mx-auto">
          We have scheduled an interactive cohort demo session for{" "}
          <strong className="text-slate-900">{successData.childName || selectedChild?.firstName}</strong>.
        </p>

        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 mb-8 text-left space-y-3">
          <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-200/60">
            <span className="text-slate-500 font-medium">Program</span>
            <span className="font-bold text-slate-800">
              {successData.interestedCourse || selectedCourse?.courseName}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-200/60">
            <span className="text-slate-500 font-medium">Scheduled Date &amp; Time</span>
            <span className="font-bold text-emerald-700">{successData.scheduledTime}</span>
          </div>
          <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-200/60">
            <span className="text-slate-500 font-medium">Assigned Teacher</span>
            <span className="font-bold text-slate-800">
              {successData.teacher?.name || "Teacher assignment is being finalized."}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-200/60">
            <span className="text-slate-500 font-medium">Classroom Platform</span>
            <span className="font-bold text-slate-800">TrueLern Live Virtual Room</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500 font-medium">Student Ward</span>
            <span className="font-bold text-slate-800">
              {selectedChild?.firstName} {selectedChild?.lastName} ({selectedChild?.studentCode})
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => { window.location.href = "/parent/dashboard"; }}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-xl transition flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20"
          >
            Return to Learning Hub <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  const availableSlotsForDate = availability.slotsByDate[selectedDate] || [];

  return (
    <div className="max-w-4xl mx-auto py-4 space-y-6">
      {/* Top Breadcrumb & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/parent/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 mb-2 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
          </Link>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            Schedule a Free Live Cohort Demo
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Experience TrueLern&apos;s interactive, coach-led learning environment with your child.
          </p>
        </div>

        {/* Child Context Badge */}
        {selectedChild && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-sm font-bold shrink-0">
              {selectedChild.firstName[0]}
            </div>
            <div className="text-left">
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                Selected Child
              </span>
              <p className="text-xs font-bold text-slate-900">
                {selectedChild.firstName} {selectedChild.lastName}
              </p>
              <span className="text-[10px] text-slate-500 font-medium capitalize">
                {selectedChild.relationshipType} • {selectedChild.studentCode}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Child Selection Bar */}
      {linkedChildren && linkedChildren.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Child Selector
            </span>
            <p className="text-xs font-semibold text-slate-700">
              Select child to book demo for:
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {linkedChildren.map((child) => {
              const isSelected = selectedChild?.studentId === child.studentId;
              return (
                <button
                  type="button"
                  key={child.studentId}
                  onClick={() => {
                    setSelectedChild(child);
                    setError(null);
                    setSuccessData(null);
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 border ${
                    isSelected
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isSelected ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {child.firstName[0]}
                  </span>
                  <span>{child.firstName} {child.lastName}</span>
                  {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-2xl text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Booking Form Card */}
      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-8">
        {/* Step 1: Program Selection */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center">
              1
            </span>
            <h2 className="text-base font-bold text-slate-900">Select Program of Interest</h2>
          </div>
          <p className="text-xs text-slate-500 ml-8 mb-4">
            Choose the specialized live cohort curriculum suited for your child.
          </p>

          {programs.length === 0 ? (
            <div className="ml-8 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 font-medium">
              <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
              Loading available programs...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 ml-0 sm:ml-8">
              {programs.map((prog, idx) => {
                const isSelected = selectedCourseId === prog.id;
                const colorClass = CARD_COLORS[idx % CARD_COLORS.length];
                return (
                  <div
                    key={prog.id}
                    onClick={() => setSelectedCourseId(prog.id)}
                    className={`relative p-4 rounded-2xl border-2 text-left cursor-pointer transition-all ${
                      isSelected
                        ? "border-emerald-600 bg-emerald-50/40 shadow-sm"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md uppercase tracking-wider mr-2">
                          {prog.level}
                        </span>
                        <h3 className="text-sm font-bold text-slate-900 inline">{prog.courseName}</h3>
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                      )}
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">{prog.shortDescription}</p>
                    <p className="text-[10px] text-slate-400 mt-1.5 font-medium uppercase tracking-wider">
                      {prog.deliveryMode?.replace(/-/g, " ")}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Step 2: Date & Time Slot */}
        <div className="border-t border-slate-100 pt-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center">
              2
            </span>
            <h2 className="text-base font-bold text-slate-900">Choose Available Date &amp; Time Slot</h2>
          </div>
          <p className="text-xs text-slate-500 ml-8 mb-4">
            Select an upcoming slot convenient for your child&apos;s schedule.
          </p>

          <div className="ml-0 sm:ml-8 space-y-4">
            {fetchingSlots ? (
              <div className="text-sm text-slate-500 py-4 flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-slate-300 border-t-emerald-600 rounded-full animate-spin"></div>
                Checking availability...
              </div>
            ) : availability.dates.length === 0 ? (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-2xl text-sm font-medium">
                There are no available demo slots for this program currently. Please check back later or contact support.
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Available Dates</label>
                  <select
                    value={selectedDate}
                    onChange={(e) => handleDateChange(e.target.value)}
                    required
                    className="w-full sm:w-64 border border-slate-300 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                  >
                    {availability.dates.map((date) => (
                      <option key={date} value={date}>
                        {new Date(date).toLocaleDateString([], {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedDate && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">Available Daily Slots</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {availableSlotsForDate.map((slot: any) => {
                        const isSlotSelected = selectedSlotId === slot.id;
                        return (
                          <button
                            type="button"
                            key={slot.id}
                            onClick={() => setSelectedSlotId(slot.id)}
                            className={`p-3 rounded-2xl border-2 text-center transition ${
                              isSlotSelected
                                ? "border-emerald-600 bg-emerald-50 text-emerald-900 font-bold"
                                : "border-slate-200 hover:border-slate-300 text-slate-700 font-medium"
                            }`}
                          >
                            <div className="flex items-center justify-center gap-1.5 text-sm font-extrabold mb-0.5">
                              <Clock className="w-3.5 h-3.5" />
                              <span>{slot.timeString}</span>
                            </div>
                            <span className="text-[10px] text-slate-500 block">{slot.duration} min class</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Step 3: Notes */}
        <div className="border-t border-slate-100 pt-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center">
              3
            </span>
            <h2 className="text-base font-bold text-slate-900">Learning Focus or Notes (Optional)</h2>
          </div>
          <p className="text-xs text-slate-500 ml-8 mb-3">
            Share any specific areas of interest or topics you want the coach to assess during the class.
          </p>

          <div className="ml-0 sm:ml-8">
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Needs more confidence in public speaking, or keen to explore logic puzzles..."
              className="w-full border border-slate-300 rounded-2xl p-3.5 text-xs text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="border-t border-slate-100 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-400">
            ✓ 100% Free interactive session • No credit card required • Dedicated coach assessment
          </p>

          <button
            type="submit"
            disabled={isSubmitting || !selectedChild || !selectedSlotId || !selectedCourseId}
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-8 rounded-2xl transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Scheduling Demo...</span>
              </>
            ) : (
              <>
                <span>Confirm &amp; Schedule Demo</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
