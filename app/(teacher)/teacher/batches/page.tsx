// @ts-nocheck
import React from "react";
import Link from "next/link";
import { connectDB } from "../../../../config/db";
import { getAuthenticatedTeacher } from "../../../../lib/auth/teacher-session";
import { batchRepository } from "../../../../repositories/batch.repository";
import { BatchTeacher } from "../../../../models/batch-teacher.model";
import { batchStudentRepository } from "../../../../repositories/batch-student.repository";
import { Users, BookOpen, Calendar, Clock, ArrowRight, ShieldCheck, Mail, Phone } from "lucide-react";

export const revalidate = 0;

export const metadata = {
  title: "My Assigned Batches & Rosters | TrueLern Faculty",
  description: "Manage cohort student rosters, batch schedules, and private academic notes.",
};

export default async function TeacherBatchesPage() {
  await connectDB();
  const teacher = await getAuthenticatedTeacher();

  if (!teacher) {
    return (
      <div className="text-center py-16">
        <h1 className="text-xl font-bold text-slate-900">Please Sign In</h1>
        <p className="text-sm text-slate-500 mt-1">Sign in to view your assigned cohorts.</p>
      </div>
    );
  }

  // Find all batches where teacher is assigned
  const [directBatches, assignedBatchTeachers] = await Promise.all([
    batchRepository.findMany(
      {
        $or: [
          { primaryTeacher: teacher._id },
          { assistantTeacher: teacher._id },
          { mentor: teacher._id },
        ],
      },
      { populate: ["course", "cohort"] }
    ),
    BatchTeacher.find({ teacher: teacher._id, status: "active" })
      .populate({ path: "batch", populate: ["course", "cohort"] })
      .lean(),
  ]);

  const batchMap = new Map();
  for (const b of directBatches) {
    batchMap.set(b._id.toString(), b);
  }
  for (const bt of assignedBatchTeachers) {
    if (bt.batch) {
      batchMap.set((bt.batch as any)._id.toString(), bt.batch);
    }
  }

  const batches = Array.from(batchMap.values());
  const batchIds = batches.map((b) => b._id);

  const batchStudents =
    batchIds.length > 0
      ? await batchStudentRepository.findMany(
          { batch: { $in: batchIds }, status: "active" },
          { populate: ["student"] }
        )
      : [];

  return (
    <div className="flex flex-col gap-6 sm:gap-8 w-full max-w-[1500px] mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">My Assigned Cohorts & Student Rosters</h1>
        <p className="text-sm text-slate-500 mt-2 leading-relaxed">
          Manage enrolled students, review attendance histories, and access cohort workspaces.
        </p>
      </div>

      {batches.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center max-w-xl mx-auto">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-900">No batches assigned</h3>
          <p className="text-sm text-slate-500 mt-1">
            You are not currently assigned as primary instructor or mentor to any active cohorts.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {batches.map((b) => {
            const course = b.course as any;
            const cohort = b.cohort as any;
            const studentsInBatch = batchStudents.filter(
              (bs) => String(bs.batch) === String(b._id) || String((bs.batch as any)?._id) === String(b._id)
            );

            return (
              <div
                key={b._id?.toString()}
                id={`batch-${b._id?.toString()}`}
                className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm scroll-mt-6"
              >
                {/* Batch Header */}
                <div className="p-6 bg-slate-50/50 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-mono">
                        {b.batchCode || "BATCH"}
                      </span>
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full capitalize">
                        {b.status || "Active"}
                      </span>
                    </div>
                    <h2 className="text-xl font-extrabold text-slate-900">{b.batchName}</h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {course?.name || "Program"} • Cohort: {cohort?.name || "Standard Session"}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-semibold text-slate-600">
                    <span className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
                      <Users className="w-4 h-4 text-indigo-600" />
                      {studentsInBatch.length} Enrolled Students
                    </span>
                  </div>
                </div>

                {/* Student Roster Table */}
                <div className="p-6">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                    Active Student Roster
                  </h3>

                  {studentsInBatch.length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-400 bg-slate-50 rounded-2xl border border-slate-100">
                      No active student enrollments assigned to this batch yet.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-100 text-slate-400 uppercase font-bold text-[10px] tracking-wider">
                            <th className="pb-3">Student Name</th>
                            <th className="pb-3">Student ID</th>
                            <th className="pb-3">Contact Email</th>
                            <th className="pb-3">Phone</th>
                            <th className="pb-3">Enrolled Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                          {studentsInBatch.map((bs) => {
                            const st = bs.student as any;
                            if (!st) return null;
                            return (
                              <tr key={bs._id?.toString()} className="hover:bg-slate-50/50 transition">
                                <td className="py-3 font-bold text-slate-900">
                                  {st.firstName} {st.lastName}
                                </td>
                                <td className="py-3 font-mono text-slate-500 text-[11px]">{st.studentId}</td>
                                <td className="py-3 text-slate-600">{st.email || `${st.studentId.toLowerCase()}@student.truelern.edu`}</td>
                                <td className="py-3 text-slate-500">{st.phone || "-"}</td>
                                <td className="py-3">
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700">
                                    {bs.status || "Active"}
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
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
