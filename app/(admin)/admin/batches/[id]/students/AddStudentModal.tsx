"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/dialogs/ToastProvider";

export interface EligibleStudent {
  _id: string;
  studentId: string;
  code: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone?: string;
  enrollmentId: string;
  enrollmentNumber: string;
  enrollmentStatus: string;
  courseId: string;
  courseName: string;
  courseCode?: string;
  cohortId?: string;
  cohortName?: string;
  isPaid?: boolean;
  isEligible?: boolean;
}

interface AddStudentModalProps {
  batchId: string;
  batchInfo?: {
    batchCode?: string;
    batchName?: string;
    courseName?: string;
    cohortName?: string;
  };
}

export function AddStudentModal({ batchId, batchInfo }: AddStudentModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [students, setStudents] = useState<EligibleStudent[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const router = useRouter();
  const toast = useToast();

  const fetchEligibleStudents = useCallback(async (query?: string) => {
    setLoading(true);
    setFetchError(null);
    try {
      const q = query ? `&search=${encodeURIComponent(query)}` : "";
      const res = await fetch(`/api/batches/${batchId}/students?eligible=true${q}`, {
        cache: "no-store",
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setStudents(data.data || []);
      } else {
        const errMsg = data.error || data.message || "Failed to load eligible students";
        setFetchError(errMsg);
        toast.error("Fetch Failed", errMsg);
      }
    } catch (err: any) {
      console.error("Error fetching eligible students:", err);
      const errMsg = err?.message || "Network error loading eligible students";
      setFetchError(errMsg);
      toast.error("Network Error", errMsg);
    } finally {
      setLoading(false);
    }
  }, [batchId, toast]);

  useEffect(() => {
    if (isOpen) {
      fetchEligibleStudents();
    } else {
      setSearch("");
      setStudents([]);
      setFetchError(null);
      setAddingId(null);
    }
  }, [isOpen, fetchEligibleStudents]);

  // Client-side quick filter over the loaded eligible students list
  const filteredStudents = useMemo(() => {
    if (!search.trim()) return students;
    const q = search.trim().toLowerCase();
    return students.filter((s) => {
      const fullName = (s.name || `${s.firstName} ${s.lastName}`).toLowerCase();
      const code = (s.code || "").toLowerCase();
      const email = (s.email || "").toLowerCase();
      const phone = (s.phone || "").toLowerCase();
      const enrNo = (s.enrollmentNumber || "").toLowerCase();
      return (
        fullName.includes(q) ||
        code.includes(q) ||
        email.includes(q) ||
        phone.includes(q) ||
        enrNo.includes(q)
      );
    });
  }, [students, search]);

  const handleManualSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    fetchEligibleStudents(search);
  };

  const handleAdd = async (student: EligibleStudent) => {
    if (addingId) return; // Prevent repeated concurrent clicks
    setAddingId(student.studentId);

    try {
      const res = await fetch(`/api/batches/${batchId}/students`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: student.studentId,
          enrollmentId: student.enrollmentId,
          forceManual: true,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success(
          "Student Added",
          `${student.name || student.firstName} has been successfully assigned to the batch.`
        );
        // Remove locally from list of eligible candidates immediately
        setStudents((prev) => prev.filter((s) => s.studentId !== student.studentId));
        router.refresh();
      } else {
        const errorMsg =
          data.error?.message || data.error || data.message || "Failed to assign student.";
        toast.error("Assignment Failed", errorMsg);
      }
    } catch (err: any) {
      console.error("Failed to add student to batch:", err);
      toast.error("Error", "Network error occurred while assigning student.");
    } finally {
      setAddingId(null);
    }
  };

  const courseDisplayName = batchInfo?.courseName || students[0]?.courseName;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="lms-btn lms-btn-primary flex items-center gap-1.5 font-semibold shadow-sm transition active:scale-95"
      >
        <span>+</span> Add Student
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[88vh] overflow-hidden border border-gray-100">
            {/* Header */}
            <div className="p-5 border-b border-gray-100 flex justify-between items-start bg-slate-50/70">
              <div>
                <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                  <span>Add Student to Roster</span>
                  {courseDisplayName && (
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {courseDisplayName}
                    </span>
                  )}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Showing students with confirmed enrollment eligible for assignment to this batch.
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Search and Filter Bar */}
            <div className="p-4 border-b border-gray-100 bg-white">
              <form onSubmit={handleManualSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Filter by student name, ID, or email..."
                    className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <span className="absolute left-3 top-2.5 text-gray-400 text-xs">🔍</span>
                </div>
                {search && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      fetchEligibleStudents("");
                    }}
                    className="px-3 py-2 text-xs font-medium text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                  >
                    Clear
                  </button>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition"
                >
                  Search
                </button>
              </form>
            </div>

            {/* List Body */}
            <div className="p-4 overflow-y-auto flex-1 divide-y divide-gray-100 min-h-[260px]">
              {loading && students.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3" />
                  <p className="text-sm font-medium text-gray-700">Loading eligible students...</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Checking confirmed course enrollments and batch allocation status
                  </p>
                </div>
              )}

              {fetchError && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-center my-4">
                  <p className="text-sm font-semibold text-red-800">Failed to load students</p>
                  <p className="text-xs text-red-600 mt-1">{fetchError}</p>
                  <button
                    onClick={() => fetchEligibleStudents()}
                    className="mt-3 px-3 py-1 bg-red-600 text-white rounded text-xs font-semibold hover:bg-red-700 transition"
                  >
                    Retry
                  </button>
                </div>
              )}

              {!loading && !fetchError && filteredStudents.length === 0 && (
                <div className="text-center py-12 px-4">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3 text-xl text-gray-400">
                    👥
                  </div>
                  <h4 className="text-sm font-bold text-gray-800">
                    {search ? "No matching students found" : "No eligible students available"}
                  </h4>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
                    {search
                      ? `No students matching "${search}" were found among the eligible list.`
                      : "All confirmed students for this course are already allocated, or pending payment confirmation."}
                  </p>
                </div>
              )}

              {filteredStudents.map((s) => {
                const isAdding = addingId === s.studentId;
                return (
                  <div
                    key={s.studentId || s._id}
                    className="py-3 px-2 flex items-center justify-between gap-4 hover:bg-slate-50/80 rounded-xl transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-indigo-600/10 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0 border border-indigo-200">
                        {s.firstName?.[0] || "S"}
                        {s.lastName?.[0] || ""}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-gray-900 truncate">
                            {s.name || `${s.firstName} ${s.lastName}`}
                          </span>
                          {s.code && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                              {s.code}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                          <span className="truncate">{s.email}</span>
                          {s.enrollmentNumber && (
                            <span className="text-[11px] font-mono text-gray-400">
                              Enr: {s.enrollmentNumber}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                            Confirmed / Paid
                          </span>
                          {s.courseName && (
                            <span className="text-[10px] text-gray-500 truncate max-w-[200px]">
                              {s.courseName}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleAdd(s)}
                      disabled={loading || Boolean(addingId)}
                      className="shrink-0 px-3.5 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-1 shadow-xs"
                    >
                      {isAdding ? (
                        <>
                          <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
                          <span>Adding...</span>
                        </>
                      ) : (
                        <span>+ Add to Batch</span>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="p-3 bg-gray-50 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500 px-5">
              <span>
                {filteredStudents.length} eligible student{filteredStudents.length === 1 ? "" : "s"}
                {search ? " matching" : " available"}
              </span>
              <button
                onClick={() => setIsOpen(false)}
                className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-900 font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
