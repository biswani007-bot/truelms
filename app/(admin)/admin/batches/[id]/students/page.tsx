/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import Link from "next/link";
import { connectDB } from "../../../../../../config/db";
import { batchStudentRepository } from "../../../../../../repositories/batch-student.repository";
import { batchRepository } from "../../../../../../repositories/batch.repository";
import { AddStudentModal } from "./AddStudentModal";
import { TransferStudentModal } from "@/components/admin/TransferStudentModal";

function getStudentColor(firstName: string, lastName: string) {
  const name = `${firstName} ${lastName}`;
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = ["bg-red-500", "bg-blue-500", "bg-green-500", "bg-yellow-500", "bg-indigo-500", "bg-purple-500", "bg-pink-500", "bg-emerald-500", "bg-teal-500", "bg-cyan-500"];
  return colors[Math.abs(hash) % colors.length];
}

interface Props { params: Promise<{ id: string }>; }
export const revalidate = 0;

export default async function BatchStudentsPage({ params }: Props) {
  await connectDB();
  const { id } = await params;

  const students = await batchStudentRepository.findMany(
    { batch: id },
    { populate: ["student", "enrollment"] }
  );

  const currentBatch = (await batchRepository.findById(id, {
    populate: ["course", "cohort"],
  })) as any;

  const otherBatches = await batchRepository.findMany(
    { _id: { $ne: id }, isDeleted: { $ne: true } },
    { select: "_id batchName batchCode currentStrength maxCapacity status" } as any
  );

  const active = students.filter((s) => s.status === "active");
  const others = students.filter((s) => s.status !== "active");

  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-gray-900">Student Roster</h1>
            {currentBatch?.batchCode && (
              <span className="font-mono text-xs px-2.5 py-1 bg-gray-100 text-gray-700 font-semibold rounded-md border border-gray-200">
                {currentBatch.batchCode}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {active.length} / {currentBatch?.maxCapacity ?? "—"} active students in this batch
            {currentBatch?.course && (
              <span className="ml-2 font-medium text-indigo-600">
                • {currentBatch.course.courseName || currentBatch.course.name}
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <AddStudentModal
            batchId={id}
            batchInfo={{
              batchCode: currentBatch?.batchCode,
              batchName: currentBatch?.batchName,
              courseName: currentBatch?.course?.courseName || currentBatch?.course?.name,
              cohortName: currentBatch?.cohort?.cohortName || currentBatch?.cohort?.name,
            }}
          />
          <Link href={`/admin/batches/${id}`} className="px-4 py-2 border border-gray-200 text-gray-400 hover:bg-white rounded-lg text-sm transition">← Back</Link>
        </div>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Active Students ({active.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-xs text-gray-400 uppercase tracking-wider">
                <th className="text-left px-6 py-3">Student</th>
                <th className="text-left px-6 py-3">Enrollment</th>
                <th className="text-left px-6 py-3">Type</th>
                <th className="text-left px-6 py-3">Seat #</th>
                <th className="text-left px-6 py-3">Assigned</th>
                <th className="text-left px-6 py-3">Status</th>
                <th className="text-right px-6 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {active.map((s) => {
                const student = s.student as any;
                const enrollment = s.enrollment as any;
                return (
                  <tr key={s._id?.toString()} className="border-b border-slate-850 hover:bg-white transition">
                    <td className="px-6 py-3 font-medium text-gray-900 flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold uppercase ${getStudentColor(student?.firstName || "", student?.lastName || "")}`}>
                        {student?.firstName?.charAt(0)}{student?.lastName?.charAt(0)}
                      </div>
                      {student?.firstName} {student?.lastName}
                    </td>
                    <td className="px-6 py-3 text-gray-500 font-mono text-xs">{enrollment?.enrollmentNumber ?? "—"}</td>
                    <td className="px-6 py-3">
                      <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border ${s.assignmentType === "automatic" ? "bg-blue-950 text-blue-400 border-blue-500/20" : "bg-white text-gray-500 border-gray-300"}`}>
                        {s.assignmentType}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-gray-500">{s.seatNumber ?? "—"}</td>
                    <td className="px-6 py-3 text-gray-500 text-xs">{new Date(s.assignedAt).toLocaleDateString()}</td>
                    <td className="px-6 py-3">
                      <span className="text-emerald-600 text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border border-emerald-200 bg-emerald-50">{s.status}</span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <TransferStudentModal
                        currentBatchId={id}
                        studentId={student?._id?.toString() || s.student?.toString()}
                        studentName={`${student?.firstName || ""} ${student?.lastName || ""}`}
                        availableBatches={JSON.parse(JSON.stringify(otherBatches))}
                      />
                    </td>
                  </tr>
                );
              })}
              {active.length === 0 && (
                <tr><td colSpan={7} className="text-center py-10 text-gray-400 text-sm">No active students assigned.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {others.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Transferred / Removed ({others.length})</h2>
          </div>
          <div className="divide-y divide-slate-850">
            {others.map((s) => {
              const student = s.student as any;
              return (
                <div key={s._id?.toString()} className="px-6 py-3 flex justify-between items-center text-sm">
                  <span className="text-gray-500">{student?.firstName} {student?.lastName}</span>
                  <span className="text-[9px] uppercase font-bold text-gray-400 border border-gray-300 px-1.5 py-0.5 rounded">{s.status}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
