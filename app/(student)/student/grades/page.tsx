// @ts-nocheck
import React from "react";
import Link from "next/link";
import { connectDB } from "../../../../config/db";
import { getAuthenticatedStudent } from "../../../../lib/auth/student-session";
import { AssessmentResult } from "../../../../models/assessment-result.model";
import { assignmentSubmissionRepository } from "../../../../repositories/assignment-submission.repository";
import { Award, CheckCircle2, AlertCircle, FileText, Download } from "lucide-react";

export const revalidate = 0;

export const metadata = {
  title: "Grades & Academic Transcript | TrueLern Student",
  description: "Official evaluation ledger, test results, and verified grades.",
};

export default async function StudentGradesPage() {
  await connectDB();
  const student = await getAuthenticatedStudent();

  if (!student) {
    return (
      <div className="text-center py-16">
        <h1 className="text-xl font-bold text-slate-900">Please Sign In</h1>
        <p className="text-sm text-slate-500 mt-1">Sign in to view your official gradebook.</p>
      </div>
    );
  }

  // Real data queries scoped strictly to student
  const [assessmentResults, submissions] = await Promise.all([
    AssessmentResult.find({ student: student._id })
      .populate({ path: "assessment", populate: "course" })
      .lean(),
    assignmentSubmissionRepository.findMany(
      { student: student._id },
      { populate: ["assignment"] }
    ),
  ]);

  // Consolidate verified evaluation items
  const ledgerItems = [];

  for (const ar of assessmentResults) {
    const as = ar.assessment as any;
    ledgerItems.push({
      id: ar._id?.toString(),
      title: as?.title || "Assessment Evaluation",
      type: "Assessment / Exam",
      course: as?.course?.name || as?.course?.code || "Course",
      score: `${ar.totalMarksObtained} / ${as?.maximumMarks || 100}`,
      percentage: `${ar.percentage}%`,
      grade: ar.grade || (ar.status === "pass" ? "Pass" : "Fail"),
      status: ar.status || "pass",
    });
  }

  for (const sub of submissions) {
    const a = sub.assignment as any;
    if (sub.status === "accepted" || sub.status === "rejected" || sub.status === "submitted") {
      ledgerItems.push({
        id: sub._id?.toString(),
        title: a?.title || "Coursework Assignment",
        type: "Assignment Submission",
        course: a?.course?.name || "Course",
        score: sub.similarityPercentage ? `Similarity: ${sub.similarityPercentage}%` : "Recorded",
        percentage: sub.status === "accepted" ? "100%" : "-",
        grade: sub.status === "accepted" ? "Accepted" : sub.status === "rejected" ? "Needs Revision" : "Submitted",
        status: sub.status === "accepted" ? "pass" : sub.status === "rejected" ? "fail" : "pass",
      });
    }
  }

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Grades & Performance Transcript</h1>
          <p className="text-sm text-slate-500 mt-1">
            Official academic ledger for student: <strong className="text-slate-800">{student.firstName} {student.lastName}</strong> ({student.studentId})
          </p>
        </div>
      </div>

      {ledgerItems.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center max-w-xl mx-auto">
          <Award className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-900">No grades recorded yet</h3>
          <p className="text-sm text-slate-500 mt-1">
            Once you submit assignments and complete scheduled assessments, your verified evaluation scores will appear here.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              href="/student/assessments"
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-sm"
            >
              Take an Assessment
            </Link>
            <Link
              href="/student/assignments"
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200"
            >
              View Assignments
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
          <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Evaluated Milestones ({ledgerItems.length})
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="p-4">Evaluation Item</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Course</th>
                  <th className="p-4">Score / Metric</th>
                  <th className="p-4">Percentage</th>
                  <th className="p-4">Official Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {ledgerItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition">
                    <td className="p-4 font-bold text-slate-900">{item.title}</td>
                    <td className="p-4 text-slate-500">{item.type}</td>
                    <td className="p-4 text-slate-600">{item.course}</td>
                    <td className="p-4 font-mono font-bold text-slate-800">{item.score}</td>
                    <td className="p-4 text-slate-600">{item.percentage}</td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          item.status === "pass"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-rose-50 text-rose-700"
                        }`}
                      >
                        {item.status === "pass" ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                        <span>{item.grade}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
