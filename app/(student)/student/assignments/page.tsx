// @ts-nocheck
import React from "react";
import Link from "next/link";
import { connectDB } from "../../../../config/db";
import { getAuthenticatedStudent } from "../../../../lib/auth/student-session";
import { enrollmentRepository } from "../../../../repositories/enrollment.repository";
import { assignmentRepository } from "../../../../repositories/assignment.repository";
import { assignmentSubmissionRepository } from "../../../../repositories/assignment-submission.repository";
import {
  ClipboardList,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
  FileText,
} from "lucide-react";

export const revalidate = 0;

export const metadata = {
  title: "My Assignments | TrueLern Student",
  description: "Coursework tasks, lab submissions, and instructor feedback.",
};

export default async function StudentAssignmentsPage() {
  await connectDB();
  const student = await getAuthenticatedStudent();

  if (!student) {
    return (
      <div className="text-center py-16">
        <h1 className="text-xl font-bold text-slate-900">Please Sign In</h1>
        <p className="text-sm text-slate-500 mt-1">Sign in to view your assignments.</p>
      </div>
    );
  }

  // Scoped to student's enrolled courses
  const enrollments = await enrollmentRepository.findMany({ student: student._id });
  const courseIds = enrollments.map((e) => e.course).filter(Boolean);

  const [assignments, submissions] = await Promise.all([
    courseIds.length > 0
      ? assignmentRepository.findMany(
          { course: { $in: courseIds }, status: { $in: ["published", "closed"] } },
          { populate: ["course", "teacher"], sort: "dueDate", order: "asc" }
        )
      : [],
    assignmentSubmissionRepository.findMany({ student: student._id }),
  ]);

  const now = new Date();

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Assignments & Lab Submissions</h1>
        <p className="text-sm text-slate-500 mt-1">
          Complete practical coursework, submit files or project repositories, and review instructor feedback.
        </p>
      </div>

      {assignments.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center max-w-xl mx-auto">
          <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-900">No assignments assigned</h3>
          <p className="text-sm text-slate-500 mt-1">
            Your instructors haven't released any assignments for your enrolled courses yet.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {assignments.map((a) => {
            const course = a.course as any;
            const sub = submissions.find((s) => String(s.assignment) === String(a._id));
            const isSubmitted = !!sub;
            const isLate = a.dueDate && new Date(a.dueDate) < now && !isSubmitted;

            return (
              <div
                key={a._id?.toString()}
                className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:border-indigo-200 transition flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
              >
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {course?.code || "COURSE"}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-mono">
                      {a.assignmentCode}
                    </span>

                    {isSubmitted ? (
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Submitted
                      </span>
                    ) : isLate ? (
                      <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Overdue
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Due Soon
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-slate-900 text-lg">{a.title}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{a.description}</p>

                  <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-500 font-medium">
                    <span>Max Marks: <strong className="text-slate-800">{a.totalMarks || 100}</strong></span>
                    <span>Pass Marks: <strong className="text-slate-800">{a.passingMarks || 40}</strong></span>
                    {a.dueDate && (
                      <span className="text-slate-600">
                        Deadline: <strong>{new Date(a.dueDate).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</strong>
                      </span>
                    )}
                  </div>
                </div>

                <div className="shrink-0 w-full md:w-auto">
                  <Link
                    href={`/student/assignments/${a._id}`}
                    className={`w-full md:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs shadow-sm transition ${
                      isSubmitted
                        ? "bg-slate-100 hover:bg-slate-200 text-slate-800"
                        : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100"
                    }`}
                  >
                    <span>{isSubmitted ? "View Submission" : "Submit Assignment"}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
