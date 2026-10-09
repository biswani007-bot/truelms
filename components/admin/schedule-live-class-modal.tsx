"use client";

import React, { useState, useEffect } from "react";
import { Plus, X, Calendar, Clock, Video, BookOpen, Layers, UserCheck, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

interface ScheduleLiveClassModalProps {
  courses: Array<{ _id: string; courseCode: string; courseName: string }>;
  batches: Array<{ _id: string; batchCode: string; batchName: string; course: string; primaryTeacher?: string; assistantTeacher?: string; mentor?: string }>;
  teachers: Array<{ _id: string; firstName: string; lastName: string; designation?: string; teacherCode?: string }>;
  batchTeachers?: Array<{ batch: string; teacher: string }>;
}

export function ScheduleLiveClassModal({ courses, batches, teachers, batchTeachers = [] }: ScheduleLiveClassModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [selectedCourse, setSelectedCourse] = useState(courses[0]?._id || "");
  const [selectedBatch, setSelectedBatch] = useState(batches[0]?._id || "");
  const [selectedTeacher, setSelectedTeacher] = useState(teachers[0]?._id || "");
  const [classTitle, setClassTitle] = useState("");
  const [classDate, setClassDate] = useState("");
  const [startTime, setStartTime] = useState("10:00");
  const [duration, setDuration] = useState(60);
  const [description, setDescription] = useState("");

  // Filter batches by course when course changes
  const filteredBatches = batches.filter((b) => !selectedCourse || b.course?.toString() === selectedCourse.toString());

  useEffect(() => {
    if (filteredBatches.length > 0 && !filteredBatches.some((b) => b._id === selectedBatch)) {
      setSelectedBatch(filteredBatches[0]._id);
      if (filteredBatches[0].primaryTeacher) {
        setSelectedTeacher(filteredBatches[0].primaryTeacher);
      }
    }
  }, [selectedCourse, filteredBatches, selectedBatch]);

  // Set default teacher when batch changes
  const handleBatchChange = (batchId: string) => {
    setSelectedBatch(batchId);
    const batch = batches.find((b) => b._id === batchId);
    if (batch?.primaryTeacher) {
      setSelectedTeacher(batch.primaryTeacher);
    }
  };

  const parseDateTime = (dateStr: string, timeStr: string): Date | null => {
    if (!dateStr) return null;
    const time = timeStr ? (timeStr.length === 5 ? `${timeStr}:00` : timeStr) : "00:00:00";

    // 1. Try standard ISO format YYYY-MM-DD
    let d = new Date(`${dateStr}T${time}`);
    if (!isNaN(d.getTime())) return d;

    // 2. Try parsing DD.MM.YYYY, DD-MM-YYYY, or DD/MM/YYYY
    const parts = dateStr.trim().split(/[.\-\/]/);
    if (parts.length === 3) {
      let year: number, month: number, day: number;
      if (parts[0].length === 4) {
        // YYYY-MM-DD
        year = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10) - 1;
        day = parseInt(parts[2], 10);
      } else if (parts[2].length === 4) {
        // DD.MM.YYYY or MM.DD.YYYY (default to DD.MM.YYYY standard in Indian / European locales)
        day = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10) - 1;
        year = parseInt(parts[2], 10);
      } else {
        return null;
      }
      const [hh, mm, ss] = time.split(":").map((v) => parseInt(v, 10) || 0);
      d = new Date(year, month, day, hh, mm, ss);
      if (!isNaN(d.getTime())) return d;
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (!selectedCourse || !selectedBatch || !selectedTeacher || !classTitle || !classDate || !startTime) {
        throw new Error("Please complete all required fields.");
      }

      const startDateTime = parseDateTime(classDate, startTime);
      if (!startDateTime || isNaN(startDateTime.getTime())) {
        throw new Error("Please enter a valid date and start time.");
      }
      const endDateTime = new Date(startDateTime.getTime() + Number(duration) * 60 * 1000);

      const payload = {
        classTitle,
        course: selectedCourse,
        batch: selectedBatch,
        teacher: selectedTeacher,
        startDate: startDateTime.toISOString(),
        endDate: endDateTime.toISOString(),
        duration: Number(duration),
        timezone: "UTC",
        meetingPlatform: "truelern",
        meetingLink: `/student/live-classes`,
        description: description || `Interactive cohort workshop for ${classTitle}`,
        status: "scheduled",
      };

      const res = await fetch("/api/live-classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("Your session has expired. Please sign in again.");
        } else if (res.status === 403) {
          throw new Error(data.message || data.error || "You do not have permission to schedule live classes.");
        } else if (res.status === 409) {
          throw new Error(data.message || data.error?.message || data.error || "Schedule conflict detected for teacher or batch.");
        } else {
          const errMsg = data.message || data.error?.message || (typeof data.error === "string" ? data.error : null) || "Failed to schedule live class.";
          throw new Error(errMsg);
        }
      }

      setSuccess(true);
      setTimeout(() => {
        setIsOpen(false);
        setSuccess(false);
        window.location.reload();
      }, 1200);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition"
      >
        <Plus className="w-4 h-4" />
        <span>Schedule Live Class</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Video className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900">Schedule Live Class</h2>
                  <p className="text-xs text-slate-500">Create a new live cohort session on TrueLern Classroom</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-3">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-3 font-semibold">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Live class scheduled successfully! Refreshing dashboard...</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs">
              {/* Course Selection */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                  <span>Course *</span>
                </label>
                <select
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                >
                  <option value="" disabled>Select Course</option>
                  {courses.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.courseCode} - {c.courseName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Batch / Cohort Selection */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-slate-400" />
                  <span>Cohort Batch *</span>
                </label>
                <select
                  value={selectedBatch}
                  onChange={(e) => handleBatchChange(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                >
                  <option value="" disabled>Select Batch</option>
                  {filteredBatches.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.batchCode} - {b.batchName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Teacher Selection */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                  <span>Assigned Instructor *</span>
                </label>
                <select
                  value={selectedTeacher}
                  onChange={(e) => setSelectedTeacher(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                >
                  <option value="" disabled>Select Instructor</option>
                  {(() => {
                    const selectedBatchDoc = batches.find((b) => b._id === selectedBatch);
                    const batchLinkedTeachers = batchTeachers.filter(bt => bt.batch === selectedBatch);
                    
                    const eligibleTeacherIds = new Set<string>();
                    
                    if (selectedBatchDoc?.primaryTeacher) eligibleTeacherIds.add(selectedBatchDoc.primaryTeacher);
                    if (selectedBatchDoc?.assistantTeacher) eligibleTeacherIds.add(selectedBatchDoc.assistantTeacher);
                    if (selectedBatchDoc?.mentor) eligibleTeacherIds.add(selectedBatchDoc.mentor);
                    
                    batchLinkedTeachers.forEach(bt => eligibleTeacherIds.add(bt.teacher));
                    
                    const eligible = eligibleTeacherIds.size > 0
                      ? teachers.filter(t => eligibleTeacherIds.has(t._id))
                      : teachers;
                      
                    return eligible.map((t) => (
                      <option key={t._id} value={t._id}>
                        Prof. {t.firstName} {t.lastName} {t.designation ? `(${t.designation})` : ""}
                      </option>
                    ));
                  })()}

                </select>
              </div>

              {/* Class Title */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Class Title *
                </label>
                <input
                  type="text"
                  value={classTitle}
                  onChange={(e) => setClassTitle(e.target.value)}
                  placeholder="e.g., Full Stack Architecture & REST API Design"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                />
              </div>

              {/* Date, Time, Duration Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Date *</span>
                  </label>
                  <input
                    type="date"
                    value={classDate}
                    onChange={(e) => setClassDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Start Time *</span>
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    Duration (Mins) *
                  </label>
                  <input
                    type="number"
                    min="15"
                    max="240"
                    step="15"
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Platform Info Note */}
              <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-2xl flex items-center gap-2.5 text-[11px] text-indigo-800">
                <Video className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>
                  <strong>Platform: TrueLern Live Classroom</strong> (Self-Hosted Jitsi RTC with moderator JWT tokens & auto-recording capabilities).
                </span>
              </div>

              {/* Description */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Agenda / Description (Optional)
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Key concepts, syllabus topics, and prerequisites for this cohort session..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition resize-none"
                />
              </div>

              {/* Actions */}
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition shadow-sm disabled:opacity-70"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Scheduling...</span>
                    </>
                  ) : (
                    <span>Schedule Class</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
