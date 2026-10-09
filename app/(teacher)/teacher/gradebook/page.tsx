// @ts-nocheck
import React from "react";
import Link from "next/link";
import { connectDB } from "../../../../config/db";
import { getAuthenticatedTeacher } from "../../../../lib/auth/teacher-session";
import { batchRepository } from "../../../../repositories/batch.repository";
import { BatchTeacher } from "../../../../models/batch-teacher.model";
import { batchStudentRepository } from "../../../../repositories/batch-student.repository";
import { AssessmentResult } from "../../../../models/assessment-result.model";
import { assignmentSubmissionRepository } from "../../../../repositories/assignment-submission.repository";
import { AssignmentEvaluation } from "../../../../models/assignment-evaluation.model";
import "../../../../models/assessment.model";
import "../../../../models/assignment.model";
import "../../../../models/student.model";
import "../../../../models/course.model";
import { formatDateSafe } from "../../../../lib/utils/date-formatter";
import { Award, GraduationCap, Users, BookOpen, ChevronRight } from "lucide-react";

export const revalidate = 0;

export const metadata = {
  title: "Faculty Gradebook | TrueLern Teacher",
  description: "Official gradebook ledger for assigned cohorts derived from assessments and assignment submissions.",
};

export default async function TeacherGradebookPage() {
  await connectDB();
  const teacher = await getAuthenticatedTeacher();

  if (!teacher) {
    return (
      <div className="text-center py-16">
        <h1 className="text-xl font-bold text-slate-900">Please Sign In</h1>
        <p className="text-sm text-slate-500 mt-1">Sign in to view your cohort gradebook.</p>
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

  const batchStudents =
    batchIds.length > 0
      ? await batchStudentRepository.findMany(
          { batch: { $in: batchIds }, status: "active" },
          { populate: ["student", "batch"] }
        )
      : [];

  const studentIds = batchStudents.map((bs) => (bs.student as any)?._id).filter(Boolean);

  const [assessmentResults, assignmentSubmissions] = await Promise.all([
    studentIds.length > 0
      ? AssessmentResult.find({ student: { $in: studentIds } })
          .populate("assessment")
          .populate("student")
          .lean()
      : [],
    studentIds.length > 0
      ? assignmentSubmissionRepository.findMany(
          { student: { $in: studentIds } },
          { populate: ["assignment", "student"] }
        )
      : [],
  ]);

  const submissionIds = assignmentSubmissions.map((s) => s._id);
  const evaluations = await AssignmentEvaluation.find({ submission: { $in: submissionIds } }).lean();
  const evalMap = new Map(evaluations.map((e) => [e.submission.toString(), e]));

  // Aggregate student grades

  const allRecords = [];
  
  for (const ar of assessmentResults) {
    const student = ar.student as any;
    if (!student) continue;
    const assessment = ar.assessment as any;
    allRecords.push({
      studentId_obj: student._id?.toString(),
      studentName: student.firstName + ' ' + student.lastName,
      studentId: student.studentId,
      assessmentTitle: assessment?.title || "Unknown Assessment",
      type: "Test",
      date: ar.createdAt || new Date(),
      maxMarks: assessment?.totalMarks || assessment?.maximumMarks || 100,
      awardedMarks: ar.score !== undefined ? ar.score : ar.totalMarksObtained,
      grade: ar.grade,
      status: ar.status
    });
  }

  for (const as of assignmentSubmissions) {
    const student = as.student as any;
    if (!student) continue;
    const assignment = as.assignment as any;
    
    const ev = evalMap.get(as._id.toString());
    let grade = "Pending";
    let marks = undefined;
    if (ev) {
      marks = ev.marksObtained;
      grade = ev.grade || "Pending";
    }

    allRecords.push({
      studentId_obj: student._id?.toString(),
      studentName: student.firstName + ' ' + student.lastName,
      studentId: student.studentId,
      assessmentTitle: assignment?.title || "Unknown Assignment",
      type: "Task",
      date: ev?.evaluatedAt || as.submittedAt || as.createdAt || new Date(),
      maxMarks: assignment?.totalMarks || 100,
      awardedMarks: marks,
      grade,
      status: as.status
    });
  }
  
  allRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());


  const studentLedgerMap = new Map();

  for (const bs of batchStudents) {
    const st = bs.student as any;
    const batch = bs.batch as any;
    if (!st) continue;

    const studentKey = st._id.toString();
    if (!studentLedgerMap.has(studentKey)) {
      studentLedgerMap.set(studentKey, {
        student: st,
        batchName: batch?.batchName || "Standard Cohort",
        assessmentScores: [],
        assignmentScores: [],
      });
    }
  }

  for (const ar of assessmentResults) {
    const studentId = (ar.student as any)?._id?.toString() || ar.student?.toString();
    if (studentLedgerMap.has(studentId) && ar.percentage !== undefined) {
      studentLedgerMap.get(studentId).assessmentScores.push(ar.percentage);
    }
  }

  for (const as of assignmentSubmissions) {
    const studentId = (as.student as any)?._id?.toString() || as.student?.toString();
    if (studentLedgerMap.has(studentId) && as.marksObtained !== undefined) {
      const totalMarks = (as.assignment as any)?.totalMarks || 100;
      const pct = Math.round((as.marksObtained / totalMarks) * 100);
      studentLedgerMap.get(studentId).assignmentScores.push(pct);
    }
  }

  const studentLedger = Array.from(studentLedgerMap.values()).map((row) => {
    const allScores = [...row.assessmentScores, ...row.assignmentScores];
    const average =
      allScores.length > 0
        ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
        : null;

    const grade =
      average === null
        ? "Pending"
        : average >= 90
        ? "A+"
        : average >= 80
        ? "A"
        : average >= 70
        ? "B"
        : average >= 60
        ? "C"
        : average >= 50
        ? "D"
        : "F";

    return {
      ...row,
      average,
      grade,
      assessmentsCount: row.assessmentScores.length,
      assignmentsCount: row.assignmentScores.length,
    };
  });

  return (
    <div className="flex flex-col gap-6 sm:gap-8 w-full max-w-[1500px] mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Faculty Cohort Gradebook</h1>
        <p className="text-sm text-slate-500 mt-2 leading-relaxed">
          Unified academic performance ledger derived from verified tests and coursework evaluations.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Enrolled Students", value: studentLedger.length, icon: <Users className="w-5 h-5 text-indigo-600" /> },
          { label: "Graded Tests", value: assessmentResults.length, icon: <GraduationCap className="w-5 h-5 text-sky-600" /> },
          { label: "Graded Assignments", value: assignmentSubmissions.length, icon: <BookOpen className="w-5 h-5 text-emerald-600" /> },
          { label: "Passing Rate", value: `${studentLedger.filter((s) => s.grade !== "F" && s.grade !== "Pending").length}/${studentLedger.filter((s) => s.grade !== "Pending").length || 0}`, icon: <Award className="w-5 h-5 text-amber-600" /> },
        ].map((stat) => (
          <div key={stat.label} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{stat.label}</span>
              <div className="text-2xl font-black text-slate-900 mt-1">{stat.value}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50">{stat.icon}</div>
          </div>
        ))}
      </div>

      {/* Gradebook Table */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col gap-5">
        <h2 className="text-sm font-bold text-slate-900">Official Student Marks Ledger</h2>

        {allRecords.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs bg-slate-50 rounded-2xl border border-slate-100">
            No graded records found for your assigned cohorts.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 text-slate-400 uppercase font-bold text-[10px] tracking-wider">
                <tr>
                  <th className="pb-3">Student Name</th>
                  <th className="pb-3">Student ID</th>
                  <th className="pb-3">Assessment / Task</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Awarded / Max</th>
                  <th className="pb-3">Grade</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {allRecords.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition group">
                    <td className="py-3.5 font-bold text-slate-900 group-hover:text-indigo-600 transition">
                      <Link href={`/teacher/gradebook/${row.studentId_obj}`} className="hover:underline flex items-center gap-1.5">
                        <span>{row.studentName}</span>
                        <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-indigo-500 transition-opacity" />
                      </Link>
                    </td>
                    <td className="py-3.5 font-mono text-[11px] text-slate-500">
                      {row.studentId}
                    </td>
                    <td className="py-3.5 text-slate-600">{row.assessmentTitle} <span className="text-[9px] uppercase ml-2 bg-slate-100 px-1.5 py-0.5 rounded">{row.type}</span></td>
                    <td className="py-3.5 text-slate-500">{formatDateSafe(row.date)}</td>
                    <td className="py-3.5 font-bold text-slate-900">
                      {row.awardedMarks !== undefined && row.awardedMarks !== null ? row.awardedMarks : "—"} / {row.maxMarks}
                    </td>
                    <td className="py-3.5 font-bold text-slate-900">
                      {row.grade || "—"}
                    </td>
                    <td className="py-3.5 pr-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-600">
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
