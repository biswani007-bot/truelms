// @ts-nocheck
import React from "react";
import Link from "next/link";
import { connectDB } from "../../../../config/db";
import { getAuthenticatedStudent } from "../../../../lib/auth/student-session";
import { Attendance } from "../../../../models/attendance.model";
import { CheckCircle2, XCircle, Clock, Calendar, AlertCircle } from "lucide-react";

export const revalidate = 0;

export const metadata = {
  title: "My Attendance Ledger | TrueLern Student",
  description: "Cohort lecture attendance records, participation rates, and absence history.",
};

export default async function StudentAttendancePage() {
  await connectDB();
  const student = await getAuthenticatedStudent();

  if (!student) {
    return (
      <div className="text-center py-16">
        <h1 className="text-xl font-bold text-slate-900">Please Sign In</h1>
        <p className="text-sm text-slate-500 mt-1">Sign in to view your attendance history.</p>
      </div>
    );
  }

  // Scoped strictly to student
  const records = await Attendance.find({ student: student._id })
    .populate({ path: "liveClass", populate: "course" })
    .populate("batch")
    .sort({ attendanceDate: -1 })
    .lean();

  const total = records.length;
  const present = records.filter((r) => r.status === "present").length;
  const late = records.filter((r) => r.status === "late").length;
  const absent = records.filter((r) => r.status === "absent" || r.status === "no-response").length;

  const attendancePercentage = total > 0 ? Math.round(((present + late) / total) * 100) : 100;

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Attendance & Participation Ledger</h1>
        <p className="text-sm text-slate-500 mt-1">
          Track verified lecture attendance, check-in timestamps, and overall cohort participation.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Overall Rate", value: `${attendancePercentage}%`, color: "text-indigo-600", bg: "bg-indigo-50" },
          { label: "Present", value: present, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Late Check-ins", value: late, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Absences", value: absent, color: "text-rose-600", bg: "bg-rose-50" },
        ].map((s) => (
          <div key={s.label} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{s.label}</span>
            <div className={`text-2xl font-black ${s.color} mt-1`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Attendance Records Table */}
      {records.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center max-w-xl mx-auto">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-900">No attendance sessions logged</h3>
          <p className="text-sm text-slate-500 mt-1">
            As your instructors conduct live classes and log attendance rosters, your verified attendance will appear here.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
          <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Lecture Attendance Logs ({records.length})
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="p-4">Class / Lecture</th>
                  <th className="p-4">Batch</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Duration</th>
                  <th className="p-4">Verification Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {records.map((rec) => {
                  const lc = rec.liveClass as any;
                  const batch = rec.batch as any;

                  return (
                    <tr key={rec._id?.toString()} className="hover:bg-slate-50/50 transition">
                      <td className="p-4 font-bold text-slate-900">{lc?.title || "Scheduled Lecture"}</td>
                      <td className="p-4 text-slate-600">{batch?.name || "Cohort"}</td>
                      <td className="p-4 text-slate-500">
                        {new Date(rec.attendanceDate).toLocaleDateString("en-IN", {
                          dateStyle: "medium",
                        })}
                      </td>
                      <td className="p-4 text-slate-600">{rec.durationAttended ? `${rec.durationAttended} mins` : "Full session"}</td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            rec.status === "present"
                              ? "bg-emerald-50 text-emerald-700"
                              : rec.status === "late"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-rose-50 text-rose-700"
                          }`}
                        >
                          {rec.status === "present" ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : rec.status === "late" ? (
                            <Clock className="w-3 h-3" />
                          ) : (
                            <XCircle className="w-3 h-3" />
                          )}
                          <span className="capitalize">{rec.status}</span>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
