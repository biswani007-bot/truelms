"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Plus, X, BookOpen, Layers, Users, Calendar, AlertCircle, Loader2, Search } from "lucide-react";
import { useToast } from "@/components/ui/dialogs/ToastProvider";

interface CourseOption {
  _id: string;
  courseName?: string;
  name?: string;
  courseCode?: string;
  code?: string;
  status?: string;
}

interface CohortOption {
  _id: string;
  cohortName?: string;
  name?: string;
  cohortCode?: string;
  code?: string;
  course?: any;
  startDate?: string;
  endDate?: string;
  status?: string;
}

interface TeacherOption {
  _id: string;
  firstName?: string;
  lastName?: string;
  teacherCode?: string;
  employeeId?: string;
  designation?: string;
}

interface AddBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBatchCreated: (newBatch: any) => void;
}

export function AddBatchModal({ isOpen, onClose, onBatchCreated }: AddBatchModalProps) {
  const toast = useToast();

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data sources
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [cohorts, setCohorts] = useState<CohortOption[]>([]);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingCohorts, setLoadingCohorts] = useState(false);
  const [courseSearch, setCourseSearch] = useState("");

  // Form state
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedCohortId, setSelectedCohortId] = useState("");
  const [batchName, setBatchName] = useState("");
  const [batchCode, setBatchCode] = useState("");
  const [capacity, setCapacity] = useState<number>(50);
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedTeacherId, setSelectedTeacherId] = useState("");

  // Fetch courses and teachers when modal opens
  useEffect(() => {
    if (!isOpen) {
      // Reset form on close
      setError(null);
      setCourseSearch("");
      return;
    }

    const fetchInitialData = async () => {
      setLoadingCourses(true);
      setError(null);
      try {
        const [courseRes, teacherRes] = await Promise.all([
          fetch("/api/courses?limit=100"),
          fetch("/api/teachers?limit=100"),
        ]);

        const courseJson = await courseRes.json();
        const teacherJson = await teacherRes.json();

        if (courseJson.success && Array.isArray(courseJson.data)) {
          setCourses(courseJson.data);
        } else {
          // Fallback to public courses if /api/courses fails
          const fallbackRes = await fetch("/api/public/courses");
          const fallbackJson = await fallbackRes.json();
          if (fallbackJson.success && Array.isArray(fallbackJson.data)) {
            setCourses(fallbackJson.data);
          }
        }

        if (teacherJson.success && Array.isArray(teacherJson.data)) {
          setTeachers(teacherJson.data);
        }
      } catch (err: any) {
        console.error("Failed to fetch initial modal data", err);
        setError("Failed to load available courses or teachers.");
      } finally {
        setLoadingCourses(false);
      }
    };

    fetchInitialData();
  }, [isOpen]);

  // Fetch cohorts whenever selected course changes
  useEffect(() => {
    if (!selectedCourseId) {
      setCohorts([]);
      setSelectedCohortId("");
      return;
    }

    // Step 3 of PRD: When the course changes, clear previous cohort selection
    setSelectedCohortId("");
    setLoadingCohorts(true);
    setError(null);

    const fetchCohortsForCourse = async () => {
      try {
        const res = await fetch(`/api/cohorts?course=${encodeURIComponent(selectedCourseId)}&limit=100`);
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setCohorts(json.data);
          // If only 1 cohort, optionally pre-select or let admin choose
          if (json.data.length === 1) {
            setSelectedCohortId(json.data[0]._id);
            if (json.data[0].startDate) {
              const iso = new Date(json.data[0].startDate).toISOString().split("T")[0];
              setStartDate(iso);
            }
          }
        } else {
          setCohorts([]);
        }
      } catch (err: any) {
        console.error("Failed to load cohorts for selected course", err);
        setError("Failed to load cohorts for the selected course.");
      } finally {
        setLoadingCohorts(false);
      }
    };

    fetchCohortsForCourse();
  }, [selectedCourseId]);

  // When cohort selection changes, auto-populate start date if available
  const handleCohortChange = (cohortId: string) => {
    setSelectedCohortId(cohortId);
    const chosen = cohorts.find((c) => c._id === cohortId);
    if (chosen && chosen.startDate) {
      try {
        const iso = new Date(chosen.startDate).toISOString().split("T")[0];
        setStartDate(iso);
      } catch {
        // keep current start date
      }
    }
  };

  // Filtered courses for searchable dropdown
  const filteredCourses = useMemo(() => {
    if (!courseSearch.trim()) return courses;
    const q = courseSearch.toLowerCase();
    return courses.filter((c) => {
      const name = (c.courseName || c.name || "").toLowerCase();
      const code = (c.courseCode || c.code || "").toLowerCase();
      return name.includes(q) || code.includes(q);
    });
  }, [courses, courseSearch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client validations
    if (!selectedCourseId) {
      setError("Please select a course.");
      return;
    }
    if (!selectedCohortId) {
      setError("Please select a valid cohort for the course.");
      return;
    }
    if (!batchName.trim()) {
      setError("Batch Name is required.");
      return;
    }
    const cap = Number(capacity);
    if (!Number.isInteger(cap) || cap <= 0) {
      setError("Capacity must be a positive integer.");
      return;
    }
    if (!startDate) {
      setError("Start Date is required.");
      return;
    }

    setSaving(true);

    try {
      const payload: Record<string, any> = {
        course: selectedCourseId,
        cohort: selectedCohortId,
        batchName: batchName.trim(),
        capacity: cap,
        startDate: new Date(startDate).toISOString(),
      };

      if (batchCode.trim()) {
        payload.batchCode = batchCode.trim();
      }

      if (selectedTeacherId) {
        payload.primaryTeacher = selectedTeacherId;
      }

      const res = await fetch("/api/batches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        const message = json.message || json.error || "Failed to create batch.";
        setError(message);
        toast.error("Batch Creation Failed", message);
        return;
      }

      // Success
      toast.success("Batch Created", `Batch "${json.data?.batchName || batchName}" created successfully.`);
      onBatchCreated(json.data);
      onClose();

      // Reset form
      setSelectedCourseId("");
      setSelectedCohortId("");
      setBatchName("");
      setBatchCode("");
      setCapacity(50);
      setStartDate(new Date().toISOString().split("T")[0]);
      setSelectedTeacherId("");
    } catch (err: any) {
      console.error("Submission error", err);
      const msg = err.message || "An unexpected error occurred.";
      setError(msg);
      toast.error("Error", msg);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Plus className="size-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">Add New Batch</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Create an authoritative batch bound to an existing course and cohort.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={saving}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg transition disabled:opacity-50"
            aria-label="Close modal"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Course Selection (Searchable) */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <BookOpen className="size-3.5 text-indigo-500" />
                Select Course <span className="text-red-500">*</span>
              </span>
              <span className="text-[10px] text-slate-400 font-normal">
                {courses.length} eligible courses
              </span>
            </label>

            {/* Course search input if courses > 5 */}
            {courses.length > 5 && (
              <div className="relative">
                <Search className="size-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter courses by name or code..."
                  value={courseSearch}
                  onChange={(e) => setCourseSearch(e.target.value)}
                  className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            )}

            {loadingCourses ? (
              <div className="py-2.5 px-3 text-xs text-slate-400 flex items-center gap-2 border border-slate-200 rounded-xl bg-slate-50">
                <Loader2 className="size-3.5 animate-spin" />
                Loading courses...
              </div>
            ) : (
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                required
                className="w-full text-xs rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">— Select an eligible course —</option>
                {filteredCourses.map((c) => {
                  const code = c.courseCode || c.code || "";
                  const name = c.courseName || c.name || "Untitled Course";
                  return (
                    <option key={c._id} value={c._id}>
                      {code ? `[${code}] ` : ""}{name}
                    </option>
                  );
                })}
              </select>
            )}
          </div>

          {/* 2. Cohort Selection (Filtered by selected course) */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Layers className="size-3.5 text-indigo-500" />
                Select Cohort <span className="text-red-500">*</span>
              </span>
              <span className="text-[10px] text-slate-400 font-normal">
                Course-bound only
              </span>
            </label>

            {loadingCohorts ? (
              <div className="py-2.5 px-3 text-xs text-slate-400 flex items-center gap-2 border border-slate-200 rounded-xl bg-slate-50">
                <Loader2 className="size-3.5 animate-spin" />
                Loading cohorts for course...
              </div>
            ) : (
              <select
                value={selectedCohortId}
                onChange={(e) => handleCohortChange(e.target.value)}
                disabled={!selectedCourseId || cohorts.length === 0}
                required
                className="w-full text-xs rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
              >
                <option value="">
                  {!selectedCourseId
                    ? "— Choose a course above first —"
                    : cohorts.length === 0
                    ? "— No active cohorts found for this course —"
                    : "— Select a compatible cohort —"}
                </option>
                {cohorts.map((coh) => {
                  const code = coh.cohortCode || coh.code || "";
                  const name = coh.cohortName || coh.name || "Untitled Cohort";
                  return (
                    <option key={coh._id} value={coh._id}>
                      {code ? `[${code}] ` : ""}{name}
                    </option>
                  );
                })}
              </select>
            )}

            {selectedCourseId && cohorts.length === 0 && !loadingCohorts && (
              <p className="text-[11px] text-amber-600">
                No existing cohorts found for this course. Please select a course that has an active cohort.
              </p>
            )}
          </div>

          {/* 3. Batch Name & Batch Code */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Batch Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Future-Ready Builders - Alpha"
                value={batchName}
                onChange={(e) => setBatchName(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span>Batch Code</span>
                <span className="text-[10px] text-slate-400 font-normal">Optional unique code</span>
              </label>
              <input
                type="text"
                placeholder="Auto-generated if left blank"
                value={batchCode}
                onChange={(e) => setBatchCode(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-[10px] text-slate-400">
                Leave blank to auto-generate (e.g. BTH-0005)
              </p>
            </div>
          </div>

          {/* 4. Capacity & Start Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Users className="size-3.5 text-indigo-500" />
                  Capacity <span className="text-red-500">*</span>
                </span>
                <span className="text-[10px] text-slate-400 font-normal">Platform default: 50</span>
              </label>
              <input
                type="number"
                min={1}
                step={1}
                required
                value={capacity}
                onChange={(e) => setCapacity(parseInt(e.target.value, 10) || 0)}
                className="w-full text-xs rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Calendar className="size-3.5 text-indigo-500" />
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* 5. Teacher Assignment (Optional) */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
              <span>Primary Teacher (Optional)</span>
              <span className="text-[10px] text-slate-400 font-normal">Can be assigned later</span>
            </label>
            <select
              value={selectedTeacherId}
              onChange={(e) => setSelectedTeacherId(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">— None (Assign Later) —</option>
              {teachers.map((t) => {
                const name = `${t.firstName || ""} ${t.lastName || ""}`.trim() || "Teacher";
                const code = t.teacherCode || t.employeeId || "";
                return (
                  <option key={t._id} value={t._id}>
                    {name} {code ? `(${code})` : ""} {t.designation ? `— ${t.designation}` : ""}
                  </option>
                );
              })}
            </select>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving || !selectedCourseId || !selectedCohortId || !batchName.trim()}
            className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition shadow-sm inline-flex items-center gap-1.5"
          >
            {saving ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                Creating Batch...
              </>
            ) : (
              <>
                <Plus className="size-3.5" />
                Create Batch
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
