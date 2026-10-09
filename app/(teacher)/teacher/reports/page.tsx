// @ts-nocheck
import React from "react";
import Link from "next/link";
import { connectDB } from "../../../../config/db";
import { getAuthenticatedTeacher } from "../../../../lib/auth/teacher-session";
import { batchRepository } from "../../../../repositories/batch.repository";
import { BatchTeacher } from "../../../../models/batch-teacher.model";
import { batchStudentRepository } from "../../../../repositories/batch-student.repository";
import { attendanceRepository } from "../../../../repositories/attendance.repository";
import { assignmentRepository } from "../../../../repositories/assignment.repository";
import { assignmentSubmissionRepository } from "../../../../repositories/assignment-submission.repository";
import { AssessmentResult } from "../../../../models/assessment-result.model";
import { BarChart3, Users, CheckCircle2, TrendingUp, BookOpen, Award } from "lucide-react";

export const revalidate = 0;

export const metadata = {
  title: "Faculty Batch Analytics | TrueLern Teacher",
  description: "Verified cohort attendance trends, coursework submission rates, and exam pass metrics.",
};

export default async function TeacherReportsPage() {
  await connectDB();
  const teacher = await getAuthenticatedTeacher();

  if (!teacher) {
    return (
      <div className="text-center py-16">
        <h1 className="text-xl font-bold text-slate-900">Please Sign In</h1>
        <p className="text-sm text-slate-500 mt-1">Sign in to view batch analytics.</p>
      </div>
    );
  }

  // Scoped to teacher batches
  const [directBatches, assignedBatchTeachers] = await Promise.all([
    batchRepository.findMany({
      $or: [
        { primaryTeacher: teacher._id },
        { assistantTeacher: teacher._id },
        { mentor: teacher._id },
      ],
    }),
    BatchTeacher.find({ teacher: teacher._id, status: "active" }).lean(),
  ]);

  const batchIds = [
    ...directBatches.map((b) => b._id),
    ...assignedBatchTeachers.map((bt) => bt.batch),
  ];

  const [batchStudents, attendanceRecords, assignments] = await Promise.all([
    batchIds.length > 0
      ? batchStudentRepository.findMany({ batch: { $in: batchIds }, status: "active" })
      : [],
    batchIds.length > 0
      ? attendanceRepository.findMany({ batch: { $in: batchIds } })
      : [],
    assignmentRepository.findMany({
      $or: [{ teacher: teacher._id }, { batch: { $in: batchIds } }],
    }),
  ]);

  const studentIds = batchStudents.map((bs) => bs.student).filter(Boolean);
  const assignmentIds = assignments.map((a) => a._id);

  const [submissions, assessmentResults] = await Promise.all([
    assignmentIds.length > 0
      ? assignmentSubmissionRepository.findMany({ assignment: { $in: assignmentIds } })
      : [],
    studentIds.length > 0
      ? AssessmentResult.find({ student: { $in: studentIds } }).lean()
      : [],
  ]);

  // Derive real statistics
  const presentCount = attendanceRecords.filter((a) => a.status === "present").length;
  const attendanceRate =
    attendanceRecords.length > 0
      ? Math.round((presentCount / attendanceRecords.length) * 100)
      : null;

  const totalPossibleSubmissions = assignments.length * batchStudents.length;
  const submissionRate =
    totalPossibleSubmissions > 0
      ? Math.min(100, Math.round((submissions.length / totalPossibleSubmissions) * 100))
      : null;

  const passedTests = assessmentResults.filter((ar) => ar.status === "pass" || (ar.percentage && ar.percentage >= 40)).length;
  const testPassRate =
    assessmentResults.length > 0
      ? Math.round((passedTests / assessmentResults.length) * 100)
      : null;

  return (
    <div className="flex flex-col gap-6 sm:gap-8 w-full max-w-[1500px] mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Faculty Batch Analytics & Insights</h1>
        <p className="text-sm text-slate-500 mt-2 leading-relaxed">
          Real-time academic performance trends derived from live cohort attendance, coursework, and assessments.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Attendance Metric */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between h-48">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Attendance Presence Rate
              </span>
              <Users className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-3xl font-black text-emerald-600 mt-2">
              {attendanceRate !== null ? `${attendanceRate}%` : "—"}
            </div>
          </div>
          <p className="text-xs text-slate-500">
            Calculated across {attendanceRecords.length} recorded class attendance logs.
          </p>
        </div>

        {/* Coursework Metric */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between h-48">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Assignment Turn-in Rate
              </span>
              <BookOpen className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-3xl font-black text-indigo-600 mt-2">
              {submissionRate !== null ? `${submissionRate}%` : "—"}
            </div>
          </div>
          <p className="text-xs text-slate-500">
            {submissions.length} completed submissions across {assignments.length} published coursework tasks.
          </p>
        </div>

        {/* Assessment Metric */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between h-48">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Test Pass Ratio
              </span>
              <Award className="w-4 h-4 text-sky-600" />
            </div>
            <div className="text-3xl font-black text-sky-600 mt-2">
              {testPassRate !== null ? `${testPassRate}%` : "—"}
            </div>
          </div>
          <p className="text-xs text-slate-500">
            {passedTests} passing results recorded out of {assessmentResults.length} student attempts.
          </p>
        </div>
      </div>
    </div>
  );
}
