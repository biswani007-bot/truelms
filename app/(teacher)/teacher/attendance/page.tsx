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
  Layers,
  ChevronRight,
  BookOpen,
} from "lucide-react";
import { Portal } from "@/components/ui/portal";

interface StudentInfo {
  _id: string;
  firstName: string;
  lastName: string;
  studentId: string;
  avatar?: string;
  email?: string;
}

interface BatchOption {
  _id: string;
  batchName: string;
  batchCode?: string;
  course?: { _id?: string; title?: string; name?: string };
  cohort?: { _id?: string; name?: string };
}

interface BatchStudentItem {
  _id: string;
  student: StudentInfo;
  enrollment?: any;
}

interface AttendanceRecord {
  _id: string;
  attendanceNumber?: string;
  student?: StudentInfo;
  batch?: { _id: string; batchName: string; batchCode?: string };
  liveClass?: { _id: string; title: string };
  attendanceDate?: string | Date;
  date?: string | Date;
  createdAt?: string | Date;
  status: "present" | "absent" | "late" | "excused" | "half-day";
  remarks?: string;
}

function formatAttendanceDate(rawDate: any): string {
  if (!rawDate) return "—";
  const parsed = new Date(rawDate);
  if (isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString("en-IN", {
    dateStyle: "medium",
  });
}

export default function TeacherAttendancePage() {
  const [batches, setBatches] = useState<BatchOption[]>([]);
  const [loadingBatches, setLoadingBatches] = useState(true);
  const [selectedBatchId, setSelectedBatchId] = useState("");

  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [rosterStudents, setRosterStudents] = useState<BatchStudentItem[]>([]);
  const [loadingRoster, setLoadingRoster] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Mark Attendance Modal
  const [markModalOpen, setMarkModalOpen] = useState(false);
  const [modalBatchId, setModalBatchId] = useState("");
  const [modalStudents, setModalStudents] = useState<BatchStudentItem[]>([]);
  const [loadingModalStudents, setLoadingModalStudents] = useState(false);
  const [attendanceDateStr, setAttendanceDateStr] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [studentMarks, setStudentMarks] = useState<{ [studentId: string]: "present" | "absent" | "late" | "excused" | "half-day" }>({});
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    loadTeacherBatches();
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

  const loadTeacherBatches = async () => {
    setLoadingBatches(true);
    try {
      const res = await fetch("/api/teacher/batches");
      const data = await res.json();
      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        setBatches(data.data);
        const initialBatchId = data.data[0]._id;
        setSelectedBatchId(initialBatchId);
        await Promise.all([
          loadAttendanceRecords(initialBatchId),
          loadBatchRoster(initialBatchId),
        ]);
      } else {
        setBatches([]);
        setSelectedBatchId("");
        setRecords([]);
        setRosterStudents([]);
      }
    } catch (err) {
      console.error("Error fetching teacher batches:", err);
      setBatches([]);
      setSelectedBatchId("");
      setRecords([]);
      setRosterStudents([]);
    } finally {
      setLoadingBatches(false);
    }
  };

  const loadAttendanceRecords = async (batchId: string) => {
    if (!batchId) {
      setRecords([]);
      return;
    }
    setLoadingRecords(true);
    try {
      const res = await fetch(`/api/attendance?batch=${encodeURIComponent(batchId)}&limit=100`);
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
      setLoadingRecords(false);
    }
  };

  const loadBatchRoster = async (batchId: string) => {
    if (!batchId) {
      setRosterStudents([]);
      return;
    }
    setLoadingRoster(true);
    try {
      const res = await fetch(`/api/batches/${encodeURIComponent(batchId)}/students`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setRosterStudents(data.data);
      } else {
        setRosterStudents([]);
      }
    } catch (err) {
      console.error("Error loading batch roster:", err);
      setRosterStudents([]);
    } finally {
      setLoadingRoster(false);
    }
  };

  const handleBatchSelection = async (batchId: string) => {
    setSelectedBatchId(batchId);
    setSearch("");
    setStatusFilter("all");
    await Promise.all([
      loadAttendanceRecords(batchId),
      loadBatchRoster(batchId),
    ]);
  };

  const handleOpenMarkModal = async () => {
    const targetBatchId = selectedBatchId || (batches[0]?._id ?? "");
    const initialDate = attendanceDateStr || new Date().toISOString().split("T")[0];
    setModalBatchId(targetBatchId);
    setAttendanceDateStr(initialDate);
    setMarkModalOpen(true);

    if (targetBatchId) {
      await loadModalData(targetBatchId, initialDate);
    } else {
      setModalStudents([]);
      setStudentMarks({});
    }
  };

  const loadModalData = async (batchId: string, dateStr: string) => {
    setLoadingModalStudents(true);
    try {
      const [rosterRes, attRes] = await Promise.all([
        fetch(`/api/batches/${encodeURIComponent(batchId)}/students`),
        fetch(`/api/attendance?batch=${encodeURIComponent(batchId)}&date=${encodeURIComponent(dateStr)}&limit=100`),
      ]);

      const rosterData = await rosterRes.json();
      const attData = await attRes.json();

      const rosterList: BatchStudentItem[] =
        rosterData.success && Array.isArray(rosterData.data) ? rosterData.data : [];
      const existingRecords: AttendanceRecord[] =
        attData.success && Array.isArray(attData.data) ? attData.data : [];

      // Build quick lookup for existing attendance records on this exact date
      const statusMap = new Map<string, "present" | "absent" | "late" | "excused" | "half-day">();
      const validStatuses: Array<"present" | "absent" | "late" | "excused" | "half-day"> = [
        "present",
        "absent",
        "late",
        "excused",
        "half-day",
      ];

      for (const r of existingRecords) {
        if (!r.status) continue;
        const normalized = r.status.toLowerCase() as any;
        if (!validStatuses.includes(normalized)) continue;

        if (r.student) {
          if (typeof r.student === "object") {
            if (r.student._id) statusMap.set(String(r.student._id), normalized);
            if (r.student.studentId) statusMap.set(String(r.student.studentId), normalized);
          } else if (typeof r.student === "string") {
            statusMap.set(String(r.student), normalized);
          }
        }
      }

      // Populate student marks using saved records or default to "present"
      const initialMarks: { [key: string]: "present" | "absent" | "late" | "excused" | "half-day" } = {};
      rosterList.forEach((bs) => {
        const st = bs.student;
        if (!st?._id) return;
        const mongoId = String(st._id);
        const studentCode = st.studentId ? String(st.studentId) : "";

        const savedStatus = statusMap.get(mongoId) || (studentCode ? statusMap.get(studentCode) : undefined);
        initialMarks[mongoId] = savedStatus || "present";
      });

      setModalStudents(rosterList);
      setStudentMarks(initialMarks);
    } catch (err) {
      console.error("Error loading modal attendance data:", err);
      setModalStudents([]);
      setStudentMarks({});
    } finally {
      setLoadingModalStudents(false);
    }
  };

  const handleModalBatchChange = async (batchId: string) => {
    setModalBatchId(batchId);
    if (batchId) {
      await loadModalData(batchId, attendanceDateStr);
    } else {
      setModalStudents([]);
      setStudentMarks({});
    }
  };

  const handleModalDateChange = async (newDate: string) => {
    setAttendanceDateStr(newDate);
    if (modalBatchId) {
      await loadModalData(modalBatchId, newDate);
    }
  };

  const handleMarkAll = (status: "present" | "absent" | "late" | "excused" | "half-day") => {
    const updated: { [key: string]: "present" | "absent" | "late" | "excused" | "half-day" } = {};
    modalStudents.forEach((bs) => {
      if (bs.student?._id) {
        updated[bs.student._id] = status;
      }
    });
    setStudentMarks(updated);
  };

  const handleSaveBulkAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalBatchId || modalStudents.length === 0) return;
    setSavingAttendance(true);

    const recordsPayload = modalStudents
      .filter((bs) => bs.student?._id)
      .map((bs) => ({
        student: bs.student._id,
        status: studentMarks[bs.student._id] || "present",
      }));

    try {
      const res = await fetch("/api/attendance/bulk-mark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batch: modalBatchId,
          attendanceDate: attendanceDateStr,
          records: recordsPayload,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNotification({ type: "success", message: "Attendance roster marked and saved successfully." });
        setMarkModalOpen(false);

        // If marked for current batch, refresh records; otherwise switch to that batch
        if (modalBatchId === selectedBatchId) {
          await loadAttendanceRecords(selectedBatchId);
        } else {
          setSelectedBatchId(modalBatchId);
          await Promise.all([
            loadAttendanceRecords(modalBatchId),
            loadBatchRoster(modalBatchId),
          ]);
        }
      } else {
        setNotification({ type: "error", message: data.message || "Failed to save attendance" });
      }
    } catch (err) {
      setNotification({ type: "error", message: "Network error saving attendance" });
    } finally {
      setSavingAttendance(false);
    }
  };

  const currentBatch = batches.find((b) => b._id === selectedBatchId);

  const presentCount = records.filter((r) => r.status === "present").length;
  const lateCount = records.filter((r) => r.status === "late").length;
  const absentCount = records.filter((r) => r.status === "absent").length;

  const filteredRecords = records.filter((r) => {
    const student = r.student as any;
    const matchesSearch =
      !search ||
      (student && `${student.firstName} ${student.lastName}`.toLowerCase().includes(search.toLowerCase())) ||
      (student && student.studentId && student.studentId.toLowerCase().includes(search.toLowerCase())) ||
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
          onClick={handleOpenMarkModal}
          disabled={batches.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl shadow-sm transition shrink-0"
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

      {/* Assigned Batch Selector Bar */}
      {loadingBatches ? (
        <div className="p-6 rounded-3xl bg-white border border-slate-200 text-xs text-slate-400 text-center animate-pulse">
          Loading assigned batches...
        </div>
      ) : batches.length === 0 ? (
        <div className="bg-amber-50/70 border border-amber-200 rounded-3xl p-8 text-center max-w-xl mx-auto shadow-sm">
          <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-3 text-amber-700">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-extrabold text-slate-900">No batches assigned to you</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
            You are not currently assigned as primary instructor or mentor to any active cohorts. Attendance tracking is available once an administrator assigns you to a batch.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <label htmlFor="batch-select" className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Assigned Cohort Batch
                </label>
                <div className="text-xs text-slate-500">
                  Select an assigned batch to inspect attendance and roster records.
                </div>
              </div>
            </div>

            <div className="min-w-[280px] sm:min-w-[380px]">
              <select
                id="batch-select"
                value={selectedBatchId}
                onChange={(e) => handleBatchSelection(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition cursor-pointer"
              >
                {batches.map((b) => {
                  const courseTitle = b.course?.title || b.course?.name || "Program";
                  const code = b.batchCode ? `[${b.batchCode}]` : "";
                  return (
                    <option key={b._id} value={b._id}>
                      {b.batchName} • {courseTitle} {code}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Active Batch Summary Badges */}
          {currentBatch && (
            <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-3 text-xs">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-slate-100 rounded-xl text-slate-700">
                <span className="text-[10px] uppercase font-bold text-slate-400">Batch Code:</span>
                <span className="font-mono font-bold text-indigo-600">{currentBatch.batchCode || "—"}</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-slate-100 rounded-xl text-slate-700">
                <span className="text-[10px] uppercase font-bold text-slate-400">Program:</span>
                <span className="font-bold text-slate-800">{currentBatch.course?.title || currentBatch.course?.name || "—"}</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-slate-100 rounded-xl text-slate-700">
                <span className="text-[10px] uppercase font-bold text-slate-400">Enrolled Students:</span>
                <span className="font-bold text-slate-800">{loadingRoster ? "..." : rosterStudents.length}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Metrics Row (Scoped strictly to selected batch) */}
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
              <option value="half-day">Half-Day</option>
            </select>
          </div>
        </div>

        {loadingRecords ? (
          <div className="text-center py-16 text-xs text-slate-400">Loading attendance records for batch...</div>
        ) : filteredRecords.length === 0 ? (
          <div className="text-center py-16 text-xs text-slate-400 bg-slate-50 rounded-2xl border border-slate-100">
            {records.length === 0
              ? `No attendance records recorded yet for ${currentBatch?.batchName || "this batch"}.`
              : "No attendance records matching your criteria."}
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
                  const recordDate = r.attendanceDate || (r as any).date || r.createdAt;

                  return (
                    <tr key={r._id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3.5">
                        <div className="font-bold text-slate-900">
                          {student?.firstName} {student?.lastName}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">{student?.studentId || "—"}</div>
                      </td>
                      <td className="py-3.5 font-mono text-[11px] text-slate-500">
                        {r.attendanceNumber || "ATT-—"}
                      </td>
                      <td className="py-3.5 text-slate-600">
                        {batch?.batchName || currentBatch?.batchName || "Standard Cohort"}
                      </td>
                      <td className="py-3.5 text-slate-500">
                        {formatAttendanceDate(recordDate)}
                      </td>
                      <td className="py-3.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            r.status === "present"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : r.status === "late"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : r.status === "excused"
                              ? "bg-sky-50 text-sky-700 border border-sky-200"
                              : r.status === "half-day"
                              ? "bg-purple-50 text-purple-700 border border-purple-200"
                              : "bg-rose-50 text-rose-700 border border-rose-200"
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
                  <h3 className="text-lg font-extrabold text-slate-900">Mark Class Attendance</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Record attendance for enrolled students in your assigned batch.
                  </p>
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Assigned Cohort Batch *</label>
                      <select
                        required
                        value={modalBatchId}
                        onChange={(e) => handleModalBatchChange(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">-- Choose Assigned Batch --</option>
                        {batches.map((b) => (
                          <option key={b._id} value={b._id}>
                            {b.batchName} ({b.batchCode || "Cohort"})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Attendance Date *</label>
                      <input
                        type="date"
                        required
                        value={attendanceDateStr}
                        onChange={(e) => handleModalDateChange(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Student Roster Radio Matrix */}
                  {modalBatchId && (
                    <div className="space-y-3 pt-2">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Enrolled Student Roster ({modalStudents.length})
                        </span>
                        {modalStudents.length > 0 && (
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-slate-400">Quick set:</span>
                            <button
                              type="button"
                              onClick={() => handleMarkAll("present")}
                              className="px-2 py-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md transition"
                            >
                              All Present
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMarkAll("absent")}
                              className="px-2 py-0.5 text-[10px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-md transition"
                            >
                              All Absent
                            </button>
                          </div>
                        )}
                      </div>

                      {loadingModalStudents ? (
                        <div className="text-center py-8 text-xs text-slate-400 bg-slate-50 rounded-2xl border border-slate-100">
                          Loading batch student roster...
                        </div>
                      ) : modalStudents.length === 0 ? (
                        <div className="text-center py-8 text-xs text-slate-400 bg-slate-50 rounded-2xl border border-slate-100">
                          No active students enrolled in this batch.
                        </div>
                      ) : (
                        <div className="border border-slate-200 rounded-2xl divide-y divide-slate-100 max-h-72 overflow-y-auto">
                          {modalStudents.map((bs) => {
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

                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {(["present", "late", "absent", "half-day", "excused"] as const).map((statusVal) => (
                                    <button
                                      key={statusVal}
                                      type="button"
                                      onClick={() =>
                                        setStudentMarks({
                                          ...studentMarks,
                                          [st._id]: statusVal,
                                        })
                                      }
                                      className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase transition ${
                                        currentStatus === statusVal
                                          ? statusVal === "present"
                                            ? "bg-emerald-600 text-white shadow-sm"
                                            : statusVal === "late"
                                            ? "bg-amber-500 text-white shadow-sm"
                                            : statusVal === "excused"
                                            ? "bg-sky-600 text-white shadow-sm"
                                            : statusVal === "half-day"
                                            ? "bg-purple-600 text-white shadow-sm"
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
                    disabled={savingAttendance || !modalBatchId || modalStudents.length === 0}
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
