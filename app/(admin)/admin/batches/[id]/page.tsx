/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import Link from "next/link";
import { connectDB } from "../../../../../config/db";
import { batchRepository } from "../../../../../repositories/batch.repository";
import { batchStudentRepository } from "../../../../../repositories/batch-student.repository";
import { batchTeacherRepository } from "../../../../../repositories/batch-teacher.repository";
import { batchRecommendationRepository } from "../../../../../repositories/batch-recommendation.repository";
import { CapacityService } from "../../../../../services/batch/capacity.service";
import { ScheduleLiveClassModal } from "../../../../../components/admin/schedule-live-class-modal";
import { BatchTeacherManager } from "../../../../../components/admin/BatchTeacherManager";
import { teacherRepository } from "../../../../../repositories/teacher.repository";

interface Props { params: Promise<{ id: string }>; }
export const revalidate = 0;

export default async function BatchDetailPage({ params }: Props) {
  await connectDB();
  const { id } = await params;

  const [batch, students, teachers, recs, allTeachers] = await Promise.all([
    batchRepository.findById(id, { populate: ["cohort", "course", "primaryTeacher", "assistantTeacher", "mentor"] }),
    batchStudentRepository.findMany({ batch: id, status: "active" }, { populate: ["student"] }),
    batchTeacherRepository.findMany({ batch: id, status: "active" }, { populate: ["teacher"] }),
    batchRecommendationRepository.findMany({ batch: id, isResolved: false }),
    teacherRepository.findMany({ status: "active" }, { select: "_id firstName lastName designation teacherCode" } as any),
  ]);

  if (!batch) {
    return (
      <div className="py-20 text-center text-gray-500">
        Batch not found. <Link href="/admin/batches" className="text-indigo-600 underline">Back</Link>
      </div>
    );
  }

  const capacity = await CapacityService.getSnapshot(id);
  const teacher = batch.primaryTeacher as any;
  const course = batch.course as any;
  const cohort = batch.cohort as any;

  const statusColor: Record<string, string> = {
    "planning": "text-gray-500", "open": "text-emerald-600", "active": "text-blue-400",
    "full": "text-amber-700", "waiting-list": "text-purple-400", "completed": "text-gray-400",
  };

  const serializableCourses = [{ _id: course?._id?.toString() || "", courseCode: course?.courseCode || "", courseName: course?.courseName || course?.name || "" }];
  const serializableBatches = [{ _id: batch._id.toString(), batchCode: batch.batchCode, batchName: batch.batchName, course: course?._id?.toString() || "", primaryTeacher: teacher?._id?.toString() || "" }];
  
  // Serialise teachers for modal dropdown (batch-scoped)
  const serializableTeachers = (teachers as any[]).map((t) => ({
    _id: t.teacher?._id?.toString() || "",
    firstName: t.teacher?.firstName || "",
    lastName: t.teacher?.lastName || "",
    designation: t.teacher?.designation || "",
    teacherCode: t.teacher?.teacherCode || "",
  }));

  // Serialise all active teachers for the assign dropdown
  const serializableAllTeachers = (allTeachers as any[]).map((t) => ({
    _id: t._id.toString(),
    firstName: t.firstName || "",
    lastName: t.lastName || "",
    designation: t.designation || "",
    teacherCode: t.teacherCode || "",
  }));

  // Serialise BatchTeacher assignments for the manager
  const serializableAssignments = (teachers as any[]).map((t) => ({
    _id: t._id.toString(),
    teacher: {
      _id: t.teacher?._id?.toString() || "",
      firstName: t.teacher?.firstName || "",
      lastName: t.teacher?.lastName || "",
      designation: t.teacher?.designation || "",
      teacherCode: t.teacher?.teacherCode || "",
    },
    role: t.role,
    isOverride: t.isOverride,
    notes: t.notes,
    assignedAt: t.assignedAt?.toString(),
  }));

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex justify-between items-start border-b border-gray-200 pb-6">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-extrabold text-gray-900">{batch.batchName}</h1>
            <span className="font-mono text-xs text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-1 rounded">{batch.batchCode}</span>
            <span className={`text-xs font-bold uppercase ${statusColor[batch.status] ?? "text-gray-500"}`}>{batch.status}</span>
          </div>
          <p className="text-sm text-gray-500 mt-1">Course: {course?.name} • Cohort: {cohort?.cohortName ?? "—"}</p>
        </div>
        <div className="flex gap-2">
          <ScheduleLiveClassModal
            courses={serializableCourses}
            batches={serializableBatches}
            teachers={serializableTeachers}
          />
          <Link href={`/admin/batches/${id}/edit`} className="px-3 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg text-xs transition">
            Edit Batch
          </Link>
          <Link href={`/admin/batches/${id}/recommendations`} className="px-3 py-2 border border-gray-300 text-gray-600 hover:bg-white hover:text-gray-900 rounded-lg text-xs transition">
            {recs.length > 0 ? `⚠ ${recs.length} Recommendations` : "Recommendations"}
          </Link>
          <Link href="/admin/batches" className="px-3 py-2 border border-gray-200 text-gray-500 hover:bg-white hover:text-gray-900 rounded-lg text-xs transition">
            Back
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Capacity Monitor */}
          <div className="bg-gray-50 border border-gray-200 p-6 rounded-2xl">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Capacity Monitor (Live from Platform Settings)</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
              {[
                { label: "Enrolled", value: capacity.currentStrength, color: "text-blue-400" },
                { label: "Available", value: capacity.availableSeats, color: "text-emerald-600" },
                { label: "Reserved", value: capacity.reservedSeats, color: "text-amber-700" },
                { label: "Waiting", value: capacity.waitingCount, color: "text-purple-400" },
              ].map((m, i) => (
                <div key={i} className="bg-white border border-slate-850 rounded-xl p-4 text-center">
                  <div className={`text-2xl font-extrabold ${m.color}`}>{m.value}</div>
                  <div className="text-[10px] text-gray-400 mt-1 uppercase font-semibold">{m.label}</div>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs text-gray-400 mb-1.5">
              <span>Utilization</span>
              <span className="font-bold text-white">{capacity.utilizationPercent}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${capacity.utilizationPercent > 90 ? "bg-red-500" : capacity.utilizationPercent > 70 ? "bg-amber-500" : "bg-emerald-500"}`}
                style={{ width: `${capacity.utilizationPercent}%` }}
              />
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
              <div className={`p-2 rounded-lg border text-center ${capacity.waitingListEnabled ? "border-emerald-800 text-emerald-600 bg-emerald-50" : "border-gray-200 text-gray-400"}`}>
                Waiting List: {capacity.waitingListEnabled ? "Enabled" : "Disabled"}
              </div>
              <div className={`p-2 rounded-lg border text-center ${capacity.autoAllocationEnabled ? "border-blue-800 text-blue-400 bg-blue-950/30" : "border-gray-200 text-gray-400"}`}>
                Auto-Allocation: {capacity.autoAllocationEnabled ? "Enabled" : "Disabled"}
              </div>
            </div>
          </div>

          {/* Student Roster Preview */}
          <div className="bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Student Roster ({students.length})</h2>
              <Link href={`/admin/batches/${id}/students`} className="text-xs text-indigo-600 hover:text-indigo-500">View All →</Link>
            </div>
            <div className="divide-y divide-slate-850">
              {(students as any[]).slice(0, 5).map((s) => (
                <div key={s._id?.toString()} className="px-6 py-3 flex justify-between items-center text-sm">
                  <span className="text-gray-900 font-medium">
                    {s.student?.firstName} {s.student?.lastName}
                  </span>
                  <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border ${s.assignmentType === "automatic" ? "bg-blue-950 text-blue-400 border-blue-500/20" : "bg-white text-gray-500 border-gray-300"}`}>
                    {s.assignmentType}
                  </span>
                </div>
              ))}
              {students.length === 0 && (
                <div className="px-6 py-6 text-sm text-gray-400 text-center">No students assigned yet.</div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-6">
          {/* Batch Info */}
          <div className="bg-gray-50 border border-gray-200 p-5 rounded-2xl">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Batch Info</h2>
            <div className="flex flex-col gap-3 text-xs">
              {[
                { label: "Primary Teacher", value: teacher ? `${teacher.firstName} ${teacher.lastName}` : "TBD" },
                { label: "Language", value: batch.language },
                { label: "Timezone", value: batch.timezone },
                { label: "Start Date", value: new Date(batch.batchStart).toLocaleDateString() },
                { label: "End Date", value: new Date(batch.batchEnd).toLocaleDateString() },
                { label: "Max Capacity (Settings)", value: `${capacity.maxCapacity} seats` },
              ].map((item, i) => (
                <div key={i} className="flex justify-between">
                  <span className="text-gray-500">{item.label}</span>
                  <span className="text-gray-900 font-medium">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Teachers — Interactive Manager */}
          <BatchTeacherManager
            batchId={id}
            assignments={serializableAssignments}
            allTeachers={serializableAllTeachers}
          />

          {/* Quick Links */}
          <div className="flex flex-col gap-2">
            {[
              { href: `/admin/batches/${id}/students`, label: "→ Student Roster" },
              { href: `/admin/batches/${id}/waiting-list`, label: "→ Waiting List" },
              { href: `/admin/batches/${id}/recommendations`, label: "→ Recommendations" },
              { href: `/admin/batches/${id}/timeline`, label: "→ Audit Timeline" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-4 py-2.5 border border-gray-200 text-gray-600 hover:bg-white hover:text-white rounded-lg text-xs font-semibold transition"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
