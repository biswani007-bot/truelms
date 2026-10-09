/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import Link from "next/link";
import { liveClassRepository } from "../../../../../repositories/live-class.repository";
import { batchStudentRepository } from "../../../../../repositories/batch-student.repository";
import { attendanceRepository } from "../../../../../repositories/attendance.repository";
import { attendanceSessionRepository } from "../../../../../repositories/attendance-session.repository";
import { connectDB } from "../../../../../config/db";

interface AttendanceBulkMarkPageProps {
  params: Promise<{ id: string }>;
}

export const revalidate = 0;

export default async function AttendanceBulkMarkPage({ params }: AttendanceBulkMarkPageProps) {
  await connectDB();
  const { id } = await params;

  const liveClass = await liveClassRepository.findById(id, { populate: ["batch", "course", "teacher"] });
  if (!liveClass) {
    return (
      <div className="py-20 text-center text-gray-500">
        Class session not found. <Link href="/admin/live-classes" className="text-indigo-600 underline">Back</Link>
      </div>
    );
  }

  // Load roster
  const batchId = liveClass.batch._id || liveClass.batch;
  const roster = await batchStudentRepository.findMany({ batch: batchId, status: "active" }, { populate: ["student"] });

  // Load current attendance marked
  const currentAttendance = await attendanceRepository.findMany({ liveClass: id });
  const attendanceMap = new Map(currentAttendance.map((a) => [a.student.toString(), a]));

  // Load session locks
  const session = await attendanceSessionRepository.findOne({ liveClass: id });

  const teacherObj = liveClass.teacher as any;
  const courseObj = liveClass.course as any;
  const batchObj = liveClass.batch as any;

  return (
    <div className="flex flex-col gap-10">
      {/* Header */}
      <div className="flex justify-between items-start border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Attendance Sheet: {liveClass.classTitle}</h1>
          <p className="text-sm text-gray-500 mt-1">
            Course: {courseObj?.name} &bull; Batch: {batchObj?.batchName} &bull; Instructor: {teacherObj ? `${teacherObj.firstName} ${teacherObj.lastName}` : "TBD"}
          </p>
        </div>
        <Link
          href={`/admin/live-classes/${id}`}
          className="px-4 py-2 border border-gray-200 text-gray-600 hover:bg-white hover:text-white rounded-lg text-sm transition"
        >
          Back to Class
        </Link>
      </div>

      {/* Session Lock Panel */}
      <div className="bg-gray-50 border border-gray-200 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider block">Session Status</span>
          <span className={`text-base font-bold mt-1 block capitalize ${
            session?.status === "frozen" ? "text-red-400" :
            session?.status === "closed" ? "text-amber-700" : "text-emerald-600"
          }`}>
            {session?.status || "Open"}
          </span>
        </div>
        <div className="flex gap-2">
          {session?.status !== "frozen" ? (
            <button className="px-3 py-1.5 bg-red-950 text-red-400 border border-red-500/20 text-xs font-bold rounded-lg hover:bg-red-900 transition">
              Freeze Session (Lock Edit)
            </button>
          ) : (
            <button className="px-3 py-1.5 bg-gray-100 text-gray-600 border border-gray-300 text-xs font-bold rounded-lg hover:bg-slate-700 transition">
              Re-open Session
            </button>
          )}
        </div>
      </div>

      {/* Roster Listing */}
      <div className="bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-base font-bold text-gray-900">Student Attendance Register</h2>
        </div>
        <div className="divide-y divide-slate-850">
          {roster.map((r) => {
            const student = r.student as any;
            const currentMark = attendanceMap.get(student?._id?.toString());
            const status = currentMark?.status || "no-response";

            return (
              <div key={r._id?.toString()} className="px-6 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-gray-50/50 transition">
                <div>
                  <h4 className="text-sm font-bold text-gray-900">{student?.firstName} {student?.lastName}</h4>
                  <p className="text-xs text-gray-400 font-mono mt-0.5">{student?.studentId || "—"}</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {["present", "absent", "late", "excused"].map((option) => (
                    <label key={option} className={`px-2.5 py-1 rounded text-xs font-bold border capitalize cursor-pointer transition ${
                      status === option
                        ? option === "present" ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
                          option === "absent" ? "bg-red-950 text-red-400 border-red-500/20" :
                          option === "late" ? "bg-amber-50 text-amber-700 border-amber-200" :
                          "bg-purple-950 text-purple-400 border-purple-500/20"
                        : "bg-white text-gray-400 border-gray-200 hover:text-gray-500"
                    }`}>
                      <input type="radio" name={`status-${student?._id?.toString()}`} className="hidden" defaultChecked={status === option} disabled={session?.status === "frozen"} />
                      {option}
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
          {roster.length === 0 && (
            <div className="py-10 text-center text-gray-400 text-sm">No students assigned to this batch.</div>
          )}
        </div>
      </div>
    </div>
  );
}
