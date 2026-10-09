// @ts-nocheck
import React from "react";
import Link from "next/link";
import { connectDB } from "../../../../config/db";
import { getAuthenticatedStudent } from "../../../../lib/auth/student-session";
import { enrollmentRepository } from "../../../../repositories/enrollment.repository";
import { assessmentRepository } from "../../../../repositories/assessment.repository";
import { assessmentAttemptRepository } from "../../../../repositories/assessment-attempt.repository";
import { AssessmentResult } from "../../../../models/assessment-result.model";
import {
  GraduationCap,
  Clock,
  Award,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  PlayCircle,
} from "lucide-react";

export const revalidate = 0;

export const metadata = {
  title: "Assessments & Quizzes | TrueLern Student",
  description: "Take practical quizzes, written exams, and review evaluation scores.",
};

export default async function StudentAssessmentsPage() {
  await connectDB();
  const student = await getAuthenticatedStudent();

  if (!student) {
    return (
      <div className="text-center py-16">
        <h1 className="text-xl font-bold text-slate-900">Please Sign In</h1>
        <p className="text-sm text-slate-500 mt-1">Sign in to view your assessments.</p>
      </div>
    );
  }

  // Scoped to student's enrolled courses
  const enrollments = await enrollmentRepository.findMany({ student: student._id });
  const courseIds = enrollments.map((e) => e.course).filter(Boolean);

  const [assessments, attempts, results] = await Promise.all([
    courseIds.length > 0
      ? assessmentRepository.findMany(
          { course: { $in: courseIds }, status: { $in: ["running", "published"] } },
          { populate: ["course", "teacher"], sort: "createdAt", order: "desc" }
        )
      : [],
    assessmentAttemptRepository.findMany({ student: student._id }),
    AssessmentResult.find({ student: student._id }).lean(),
  ]);

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Assessments & Quizzes</h1>
        <p className="text-sm text-slate-500 mt-1">
          Demonstrate practical competence through timed quizzes, objective evaluations, and written tests.
        </p>
      </div>

      {assessments.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center max-w-xl mx-auto">
          <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-900">No active assessments available</h3>
          <p className="text-sm text-slate-500 mt-1">
            There are currently no active tests published for your enrolled courses.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {assessments.map((as) => {
            const course = as.course as any;
            const testAttempts = attempts.filter((att) => String(att.assessment) === String(as._id));
            const testResult = results.find((r) => String(r.assessment) === String(as._id));
            const attemptCount = testAttempts.length;
            const attemptLimit = as.attemptLimit || 1;
            const isCompleted = attemptCount >= attemptLimit;

            return (
              <div
                key={as._id?.toString()}
                className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-mono">
                      {as.assessmentCode}
                    </span>
                    {testResult ? (
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full capitalize ${
                          testResult.status === "pass"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-rose-50 text-rose-700"
                        }`}
                      >
                        {testResult.status} ({testResult.percentage}%)
                      </span>
                    ) : isCompleted ? (
                      <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
                        Attempts Used
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-full">
                        Ready to Take
                      </span>
                    )}
                  </div>

                  <span className="text-xs text-slate-400 font-semibold block">{course?.name || "Course"}</span>
                  <h3 className="font-bold text-slate-900 text-lg mt-1">{as.title}</h3>
                  <p className="text-xs text-slate-500 mt-2 line-clamp-2">{as.description}</p>

                  <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 rounded-xl bg-slate-50">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Duration</span>
                      <span className="font-bold text-slate-800">{as.duration || 60} mins</span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Max Marks</span>
                      <span className="font-bold text-slate-800">{as.maximumMarks || 100}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Attempts</span>
                      <span className="font-bold text-slate-800">
                        {attemptCount}/{attemptLimit}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100">
                  <Link
                    href={`/student/assessments/${as._id}`}
                    className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs shadow-sm transition ${
                      testResult || isCompleted
                        ? "bg-slate-100 hover:bg-slate-200 text-slate-800"
                        : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100"
                    }`}
                  >
                    <PlayCircle className="w-4 h-4" />
                    <span>{testResult ? "Review Assessment & Results" : "Launch Assessment Runner"}</span>
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
