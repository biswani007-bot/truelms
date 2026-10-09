"use client";

import React, { useEffect, useState } from "react";
import {
  CheckSquare,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Users,
  X,
  Calendar,
  ChevronRight,
} from "lucide-react";
import { Portal } from "@/components/ui/portal";

interface AttendanceRecord {
  _id: string;
  attendanceNumber?: string;
  student?: { firstName: string; lastName: string; studentId: string };
  batch?: { _id: string; batchName: string };
  liveClass?: { _id: string; title: string };
  date: string;
  status: "present" | "absent" | "late" | "excused";
  remarks?: string;
}

interface BatchOption {
  _id: string;
  batchName: string;
}

interface BatchStudentItem {
  _id: string;
  student: { _id: string; firstName: string; lastName: string; studentId: string };
}

export default function TeacherAttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Mark Attendance Modal
  const [markModalOpen, setMarkModalOpen] = useState(false);
  const [batches, setBatches] = useState<BatchOption[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [batchStudents, setBatchStudents] = useState<BatchStudentItem[]>([]);
  const [studentMarks, setStudentMarks] = useState<{ [studentId: string]: "present" | "absent" | "late" | "excused" }>({});
  const [liveClassTitle, setLiveClassTitle] = useState("");
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    fetchAttendanceRecords();
    fetchTeacherBatches();
  }, []);

  // Lock body scroll and handle Escape key for modal
  useEffect(() => {
    if (markModalOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape" && !savingAttendance) {
          setMarkModalOpen(false);
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = originalOverflow;
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [markModalOpen, savingAttendance]);

  const fetchAttendanceRecords = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/attendance?limit=100");
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setRecords(data.data);
      } else {
        setRecords([]);
      }
    } catch (err) {
      console.error("Error loading attendance records:", err);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeacherBatches = async () => {
    try {
      const res = await fetch("/api/batches?limit=100");
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setBatches(data.data);
      }
    } catch (err) {
      console.error("Error fetching batches:", err);
    }
  };

  const handleSelectBatch = async (batchId: string) => {
    setSelectedBatchId(batchId);
    if (!batchId) {
      setBatchStudents([]);
      return;
    }
    try {
      const res = await fetch(`/api/batches/${batchId}/students`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setBatchStudents(data.data);
        const initialMarks: { [key: string]: "present" | "absent" | "late" | "excused" } = {};
        data.data.forEach((bs: any) => {
          if (bs.student?._id) {
            initialMarks[bs.student._id] = "present";
          }
        });
        setStudentMarks(initialMarks);
      } else {
        setBatchStudents([]);
      }
    } catch (err) {
      console.error("Error fetching batch students:", err);
      setBatchStudents([]);
    }
  };

  const handleSaveBulkAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatchId || batchStudents.length === 0) return;
    setSavingAttendance(true);

    const recordsPayload = batchStudents
      .filter((bs) => bs.student?._id)
      .map((bs) => ({
        student: bs.student._id,
        status: studentMarks[bs.student._id] || "present",
        date: new Date(),
      }));

    try {
      const res = await fetch("/api/attendance/bulk-mark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batch: selectedBatchId,
          liveClass: selectedBatchId, // Associated live class / session reference
          teacher: selectedBatchId,
          records: recordsPayload,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNotification({ type: "success", message: "Attendance roster marked and saved successfully." });
        setMarkModalOpen(false);
        setSelectedBatchId("");
        setBatchStudents([]);
        fetchAttendanceRecords();
      } else {
        setNotification({ type: "error", message: data.message || "Failed to save attendance" });
      }
    } catch (err) {
      setNotification({ type: "error", message: "Network error saving attendance" });
    } finally {
      setSavingAttendance(false);
    }
  };

  const presentCount = records.filter((r) => r.status === "present").length;
  const lateCount = records.filter((r) => r.status === "late").length;
  const absentCount = records.filter((r) => r.status === "absent").length;

  const filteredRecords = records.filter((r) => {
    const student = r.student as any;
    const matchesSearch =
      !search ||
      (student && `${student.firstName} ${student.lastName}`.toLowerCase().includes(search.toLowerCase())) ||
      (r.attendanceNumber && r.attendanceNumber.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === "all" || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Faculty Attendance Tracker</h1>
          <p className="text-sm text-slate-500 mt-2">
            Mark lecture session attendance, review student presence logs, and generate roster summaries.
          </p>
        </div>

        <button
          onClick={() => setMarkModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Mark Class Attendance</span>
        </button>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between text-xs font-semibold ${
            notification.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)} className="p-1 hover:bg-black/5 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Logs", value: records.length, color: "text-slate-900", bg: "bg-slate-50" },
          { label: "Present Marked", value: presentCount, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Late Arrivals", value: lateCount, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Absences", value: absentCount, color: "text-rose-600", bg: "bg-rose-50" },
        ].map((stat) => (
          <div key={stat.label} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{stat.label}</span>
            <div className={`text-2xl font-black ${stat.color} mt-1`}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Filter and Table Container */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col gap-5">
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search student or log #..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400">Filter Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
            >
              <option value="all">All Records</option>
              <option value="present">Present</option>
              <option value="late">Late</option>
              <option value="absent">Absent</option>
              <option value="excused">Excused</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16 text-xs text-slate-400">Loading attendance records...</div>
        ) : filteredRecords.length === 0 ? (
          <div className="text-center py-16 text-xs text-slate-400 bg-slate-50 rounded-2xl border border-slate-100">
            No attendance records matching your criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 text-slate-400 uppercase font-bold text-[10px] tracking-wider">
                <tr>
                  <th className="pb-3">Student</th>
                  <th className="pb-3">Log Number</th>
                  <th className="pb-3">Cohort Batch</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredRecords.map((r) => {
                  const student = r.student as any;
                  const batch = r.batch as any;
                  return (
                    <tr key={r._id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3.5">
                        <div className="font-bold text-slate-900">
                          {student?.firstName} {student?.lastName}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">{student?.studentId}</div>
                      </td>
                      <td className="py-3.5 font-mono text-[11px] text-slate-500">
                        {r.attendanceNumber || "ATT-001"}
                      </td>
                      <td className="py-3.5 text-slate-600">{batch?.batchName || "Standard Cohort"}</td>
                      <td className="py-3.5 text-slate-500">
                        {new Date(r.date).toLocaleDateString("en-IN", {
                          dateStyle: "medium",
                        })}
                      </td>
                      <td className="py-3.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            r.status === "present"
                              ? "bg-emerald-50 text-emerald-700"
                              : r.status === "late"
                              ? "bg-amber-50 text-amber-700"
                              : r.status === "excused"
                              ? "bg-sky-50 text-sky-700"
                              : "bg-rose-50 text-rose-700"
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Mark Class Attendance Modal */}
      {markModalOpen && (
        <Portal>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-hidden">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
              onClick={() => {
                if (!savingAttendance) setMarkModalOpen(false);
              }}
            />

            {/* Modal Surface */}
            <div className="relative bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 flex flex-col max-h-[calc(100vh-2.5rem)] sm:max-h-[calc(100vh-4rem)] overflow-hidden z-10 animate-scale-in">
              <div className="p-5 sm:p-6 border-b border-slate-100 flex justify-between items-start shrink-0">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">Mark Live Class Attendance</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Select an assigned cohort to take attendance for the session.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setMarkModalOpen(false)}
                  disabled={savingAttendance}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition shrink-0"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveBulkAttendance} className="flex flex-col flex-1 overflow-hidden">
                <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Select Cohort Batch *</label>
                    <select
                      required
                      value={selectedBatchId}
                      onChange={(e) => handleSelectBatch(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">-- Choose Assigned Batch --</option>
                      {batches.map((b) => (
                        <option key={b._id} value={b._id}>
                          {b.batchName}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Student Roster Radio Matrix */}
                  {selectedBatchId && (
                    <div className="space-y-3 pt-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Student Presence Roster ({batchStudents.length})
                        </span>
                      </div>

                      {batchStudents.length === 0 ? (
                        <div className="text-center py-8 text-xs text-slate-400 bg-slate-50 rounded-2xl border border-slate-100">
                          No active students enrolled in this batch.
                        </div>
                      ) : (
                        <div className="border border-slate-200 rounded-2xl divide-y divide-slate-100 max-h-72 overflow-y-auto">
                          {batchStudents.map((bs) => {
                            const st = bs.student;
                            if (!st) return null;
                            const currentStatus = studentMarks[st._id] || "present";

                            return (
                              <div
                                key={st._id}
                                className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50"
                              >
                                <div>
                                  <div className="font-bold text-slate-900 text-xs">
                                    {st.firstName} {st.lastName}
                                  </div>
                                  <div className="text-[10px] font-mono text-slate-400">{st.studentId}</div>
                                </div>

                                <div className="flex items-center gap-1.5">
                                  {(["present", "late", "absent", "excused"] as const).map((statusVal) => (
                                    <button
                                      key={statusVal}
                                      type="button"
                                      onClick={() =>
                                        setStudentMarks({
                                          ...studentMarks,
                                          [st._id]: statusVal,
                                        })
                                      }
                                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition ${
                                        currentStatus === statusVal
                                          ? statusVal === "present"
                                            ? "bg-emerald-600 text-white shadow-sm"
                                            : statusVal === "late"
                                            ? "bg-amber-500 text-white shadow-sm"
                                            : statusVal === "excused"
                                            ? "bg-sky-600 text-white shadow-sm"
                                            : "bg-rose-600 text-white shadow-sm"
                                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                      }`}
                                    >
                                      {statusVal}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 px-5 sm:px-6 py-4 bg-slate-50/60 border-t border-slate-100 shrink-0">
                  <button
                    type="button"
                    onClick={() => setMarkModalOpen(false)}
                    disabled={savingAttendance}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingAttendance || !selectedBatchId || batchStudents.length === 0}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md transition"
                  >
                    {savingAttendance ? "Saving..." : "Submit Attendance"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}
