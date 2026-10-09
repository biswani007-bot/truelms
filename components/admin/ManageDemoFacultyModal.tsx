"use client";

import React, { useEffect, useState } from "react";
import {
  GraduationCap,
  CheckCircle2,
  AlertCircle,
  Search,
  X,
  Loader2,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { Portal } from "@/components/ui/portal";

interface TeacherItem {
  _id: string;
  firstName: string;
  lastName: string;
  employeeId?: string;
  teacherCode?: string;
  status: string;
  user?: {
    email?: string;
  };
}

interface ManageDemoFacultyModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: any;
  onSaved: (updatedCourse: any) => void;
}

export function ManageDemoFacultyModal({
  isOpen,
  onClose,
  course,
  onSaved,
}: ManageDemoFacultyModalProps) {
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [primaryTeacher, setPrimaryTeacher] = useState<string>("");
  const [eligibleTeachers, setEligibleTeachers] = useState<string[]>([]);
  const [backupTeacher, setBackupTeacher] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    // Load active teachers
    setLoadingTeachers(true);
    setError(null);
    fetch("/api/teachers?limit=100&status=active")
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data?.data?.data)
          ? data.data.data
          : [];
        setTeachers(list);
      })
      .catch(() => {
        setError("Failed to load active teachers");
      })
      .finally(() => {
        setLoadingTeachers(false);
      });

    // Populate initial state from course.demoFaculty
    const df = course?.demoFaculty || {};
    const pId = df.primaryTeacher?._id || df.primaryTeacher || "";
    const bId = df.backupTeacher?._id || df.backupTeacher || "";
    const eList = Array.isArray(df.eligibleTeachers)
      ? df.eligibleTeachers.map((t: any) => t?._id || t).filter(Boolean)
      : [];

    setPrimaryTeacher(pId.toString());
    setBackupTeacher(bId.toString());
    setEligibleTeachers(eList.map((id: any) => id.toString()));
  }, [isOpen, course]);

  if (!isOpen) return null;

  const toggleEligibleTeacher = (teacherId: string) => {
    setEligibleTeachers((prev) =>
      prev.includes(teacherId)
        ? prev.filter((id) => id !== teacherId)
        : [...prev, teacherId]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        demoFaculty: {
          primaryTeacher: primaryTeacher || undefined,
          eligibleTeachers: eligibleTeachers,
          backupTeacher: backupTeacher || undefined,
        },
      };

      const res = await fetch(`/api/courses/${course._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || "Failed to save demo faculty");
      }

      onSaved(data.data);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to update demo faculty configuration");
    } finally {
      setSaving(false);
    }
  };

  const filteredTeachers = teachers.filter((t) => {
    const fullName = `${t.firstName} ${t.lastName}`.toLowerCase();
    const email = (t.user?.email || "").toLowerCase();
    const code = (t.employeeId || t.teacherCode || "").toLowerCase();
    const q = searchTerm.toLowerCase();
    return fullName.includes(q) || email.includes(q) || code.includes(q);
  });

  return (
    <Portal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shadow-sm">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Manage Demo Faculty
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  {course?.courseName} ({course?.courseCode})
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={saving}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto space-y-6">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Strategy Explainer */}
            <div className="p-3.5 bg-indigo-50/60 border border-indigo-100 rounded-xl text-xs text-indigo-900 space-y-1">
              <p className="font-semibold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                Deterministic Assignment Strategy
              </p>
              <p className="text-indigo-700 leading-relaxed text-[11px]">
                When a parent books a demo, the platform checks availability in order:{" "}
                <strong>1. Primary Teacher</strong> &rarr;{" "}
                <strong>2. Eligible Teachers</strong> &rarr;{" "}
                <strong>3. Backup Teacher</strong>. If none are free, the demo is marked{" "}
                <em>&quot;Teacher Assignment Required&quot;</em> for admin review.
              </p>
            </div>

            {loadingTeachers ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                <span className="text-xs">Loading faculty directory...</span>
              </div>
            ) : (
              <>
                {/* 1. Primary Demo Teacher */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                    <span>Primary Demo Teacher</span>
                    <span className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider">
                      First Preference
                    </span>
                  </label>
                  <select
                    value={primaryTeacher}
                    onChange={(e) => setPrimaryTeacher(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                  >
                    <option value="">&mdash; None Selected &mdash;</option>
                    {teachers.map((t) => (
                      <option key={t._id} value={t._id}>
                        {t.firstName} {t.lastName}{" "}
                        {t.employeeId ? `(${t.employeeId})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Additional Eligible Teachers */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800">
                      Additional Eligible Demo Teachers
                    </label>
                    <span className="text-[10px] text-slate-500">
                      {eligibleTeachers.length} selected
                    </span>
                  </div>

                  {/* Search within faculty */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search faculty by name or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white">
                    {filteredTeachers.length === 0 ? (
                      <p className="p-4 text-center text-xs text-slate-400">
                        No active teachers found.
                      </p>
                    ) : (
                      filteredTeachers.map((t) => {
                        const isChecked = eligibleTeachers.includes(t._id);
                        const isPrimary = primaryTeacher === t._id;
                        return (
                          <label
                            key={t._id}
                            className={`px-3.5 py-2.5 flex items-center justify-between text-xs cursor-pointer hover:bg-slate-50 transition ${
                              isChecked ? "bg-indigo-50/40" : ""
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleEligibleTeacher(t._id)}
                                className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 border-slate-300"
                              />
                              <div>
                                <span className="font-semibold text-slate-800">
                                  {t.firstName} {t.lastName}
                                </span>
                                {t.user?.email && (
                                  <span className="text-slate-400 text-[11px] ml-1.5">
                                    &bull; {t.user.email}
                                  </span>
                                )}
                              </div>
                            </div>
                            {isPrimary && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700">
                                Primary
                              </span>
                            )}
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* 3. Backup Demo Teacher */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                    <span>Backup Teacher (Optional)</span>
                    <span className="text-[10px] font-semibold text-amber-600 uppercase tracking-wider">
                      Fallback
                    </span>
                  </label>
                  <select
                    value={backupTeacher}
                    onChange={(e) => setBackupTeacher(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                  >
                    <option value="">&mdash; None (Optional) &mdash;</option>
                    {teachers.map((t) => (
                      <option key={t._id} value={t._id}>
                        {t.firstName} {t.lastName}{" "}
                        {t.employeeId ? `(${t.employeeId})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || loadingTeachers}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-indigo-600/20 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Save Demo Faculty</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
}
