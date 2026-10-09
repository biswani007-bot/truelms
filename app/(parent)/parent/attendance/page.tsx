"use client";

import React, { useEffect, useState } from "react";
import { useParentChild } from "@/components/parent/parent-child-context";
import { CalendarCheck, CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react";

export default function ParentAttendancePage() {
  const { selectedChild } = useParentChild();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedChild?.studentId) {
      setLoading(true);
      setError(null);
      fetch(`/api/parent/children/${selectedChild.studentId}/attendance`, { credentials: "include" })
        .then((res) => {
          if (!res.ok) {
            if (res.status === 401 || res.status === 403) {
              throw new Error("Unauthorized access to student records.");
            }
            throw new Error("Failed to load attendance records.");
          }
          return res.json();
        })
        .then((json) => {
          if (!json.success && json.error) throw new Error(json.error);
          setData(json.data);
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [selectedChild?.studentId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-20 bg-slate-200/60 rounded-3xl animate-pulse" />
        <div className="h-64 bg-slate-200/60 rounded-3xl animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center bg-white border border-rose-200 rounded-3xl text-rose-600">
        <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="font-bold">{error}</p>
      </div>
    );
  }

  if (!selectedChild?.studentId) {
    return (
      <div className="p-8 text-center bg-white border border-slate-200 rounded-3xl text-slate-500">
        <p className="font-bold">No child selected</p>
        <p className="text-sm mt-1">Please select a child to view attendance records.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Attendance Monitoring</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Real-time classroom session presence and attendance logs for {selectedChild?.firstName}.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80">
          <p className="text-xs font-semibold text-slate-500">Attendance Rate</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">
            {data?.summary?.attendancePercentage != null ? `${data.summary.attendancePercentage}%` : "--"}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Calculated across sessions</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80">
          <p className="text-xs font-semibold text-slate-500">Present Sessions</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{data?.summary?.presentCount ?? 0}</p>
          <p className="text-[10px] text-emerald-600 mt-0.5">Attended on time</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80">
          <p className="text-xs font-semibold text-slate-500">Late Sessions</p>
          <p className="text-2xl font-black text-amber-600 mt-1">{data?.summary?.lateCount ?? 0}</p>
          <p className="text-[10px] text-amber-600 mt-0.5">Late check-in</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80">
          <p className="text-xs font-semibold text-slate-500">Absences</p>
          <p className="text-2xl font-black text-rose-600 mt-1">{data?.summary?.absentCount ?? 0}</p>
          <p className="text-[10px] text-rose-500 mt-0.5">Unexcused / missed</p>
        </div>
      </div>

      {/* Attendance Log Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-900">Session Attendance Log</h2>
        </div>

        {data?.records && data.records.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {data.records.map((r: any) => (
              <div key={r.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition">
                <div className="flex items-center gap-3">
                  {r.status === "present" ? (
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  ) : r.status === "late" ? (
                    <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                      <Clock className="w-4 h-4" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                      <XCircle className="w-4 h-4" />
                    </div>
                  )}
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{r.classTitle}</h4>
                    <p className="text-[10px] text-slate-400 font-medium">{new Date(r.date).toLocaleDateString()}</p>
                  </div>
                </div>

                <span
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                    r.status === "present"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : r.status === "late"
                      ? "bg-amber-50 text-amber-700 border border-amber-200"
                      : "bg-rose-50 text-rose-700 border border-rose-200"
                  }`}
                >
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-slate-400">
            No attendance records recorded yet for this student.
          </div>
        )}
      </div>
    </div>
  );
}
