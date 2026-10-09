// @ts-nocheck
import React from "react";
import Link from "next/link";
import { connectDB } from "../../../../../config/db";
import { getAuthenticatedTeacher } from "../../../../../lib/auth/teacher-session";
import { studentRepository } from "../../../../../repositories/student.repository";
import { ParentStudentLink } from "../../../../../models/parent-student-link.model";
import { Parent } from "../../../../../models/parent.model";
import { AssessmentResult } from "../../../../../models/assessment-result.model";
import { assignmentSubmissionRepository } from "../../../../../repositories/assignment-submission.repository";
import { BatchStudent } from "../../../../../models/batch-student.model";
import { Batch } from "../../../../../models/batch.model";
import "../../../../../models/assessment.model";
import "../../../../../models/assignment.model";
import "../../../../../models/student.model";
import { formatDateSafe } from "../../../../../lib/utils/date-formatter";
import { ChevronLeft, GraduationCap, Mail, Phone, BookOpen, Clock, Activity, CheckCircle2 } from "lucide-react";

export const revalidate = 0;

export default async function StudentAcademicProfilePage({ params }: { params: Promise<{ studentId: string }> }) {
  await connectDB();
  const teacher = await getAuthenticatedTeacher();
  const { studentId } = await params;

  if (!teacher) {
    return <div className="text-center py-16">Please Sign In</div>;
  }

  // 1. Fetch Student Core Data
  const student = await studentRepository.findById(studentId);
  if (!student) {
    return <div className="text-center py-16 text-slate-500">Student not found.</div>;
  }

  // 2. Fetch Parent Context
  const link = await ParentStudentLink.findOne({ student: studentId }).populate({ path: "parent", model: Parent }).lean();
  const parent = link?.parent;

  // 3. Fetch Batch Context
  const batchStudents = await BatchStudent.find({ student: studentId, status: "active" }).populate({ path: "batch", model: Batch }).lean();
  const activeBatches = batchStudents.map(bs => bs.batch);

  // 4. Fetch Academics (Assessments & Assignments)
  const [assessmentResults, assignmentSubmissions] = await Promise.all([
    AssessmentResult.find({ student: studentId }).populate("assessment").lean(),
    assignmentSubmissionRepository.findMany({ student: studentId }, { populate: ["assignment"] })
  ]);

  return (
    <div className="flex flex-col gap-8 w-full max-w-[1500px] mx-auto">
      {/* Navigation & Header */}
      <div>
        <Link href="/teacher/gradebook" className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-indigo-600 mb-4 transition">
          <ChevronLeft className="w-4 h-4" />
          Back to Gradebook
        </Link>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-black text-2xl">
              {student.firstName[0]}{student.lastName[0]}
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900">{student.firstName} {student.lastName}</h1>
              <div className="text-sm font-mono text-slate-500 mt-0.5">{student.studentId} • {student.email}</div>
            </div>
          </div>
          <div className="text-right flex flex-col items-end">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Guardian Contact</span>
            {parent ? (
              <div className="text-sm font-semibold text-slate-700 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm">
                {parent.firstName} {parent.lastName} <br />
                <span className="text-[11px] font-normal text-slate-500">{parent.email}</span>
              </div>
            ) : (
              <span className="text-xs italic text-slate-400">No guardian linked</span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Academic Overview */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-sky-500" />
              Active Enrollments
            </h3>
            <div className="space-y-3">
              {activeBatches.length > 0 ? (
                activeBatches.map((b: any) => (
                  <div key={b._id} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">{b.batchName}</div>
                    <div className="text-xs font-semibold text-slate-700 mt-1">{b.course?.name || "Program Enrollment"}</div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-400 italic">No active enrollments.</div>
              )}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-indigo-500" />
              Academic KPIs
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                <div className="text-2xl font-black text-slate-900">{assessmentResults.length}</div>
                <div className="text-[10px] uppercase font-bold text-slate-400 mt-1">Tests Taken</div>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                <div className="text-2xl font-black text-slate-900">{assignmentSubmissions.length}</div>
                <div className="text-[10px] uppercase font-bold text-slate-400 mt-1">Assignments</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Detailed Ledger */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Assignments */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-500" />
              Coursework & Assignments
            </h3>
            {assignmentSubmissions.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-100">No submissions recorded.</div>
            ) : (
              <div className="space-y-3">
                {assignmentSubmissions.map((sub: any) => (
                  <div key={sub._id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition">
                    <div>
                      <div className="font-bold text-sm text-slate-800">{sub.assignment?.title || "Unknown Assignment"}</div>
                      <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mt-0.5">Submitted: {formatDateSafe(sub.submittedAt)}</div>
                    </div>
                    <div className="text-right">
                      <div className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full inline-block mb-1 ${sub.status === "accepted" ? "bg-emerald-100 text-emerald-700" : "bg-sky-100 text-sky-700"}`}>
                        {sub.status}
                      </div>
                      <div className="text-xs font-bold text-slate-900">
                        {sub.marksObtained !== undefined ? `${sub.marksObtained} / ${sub.assignment?.totalMarks || 100}` : "In Review"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Assessments */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-indigo-500" />
              Assessments & Quizzes
            </h3>
            {assessmentResults.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-100">No test attempts recorded.</div>
            ) : (
              <div className="space-y-3">
                {assessmentResults.map((ar: any) => (
                  <div key={ar._id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition">
                    <div>
                      <div className="font-bold text-sm text-slate-800">{ar.assessment?.title || "Unknown Test"}</div>
                      <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mt-0.5">Tested: {formatDateSafe(ar.startedAt)}</div>
                    </div>
                    <div className="text-right">
                      <div className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full inline-block mb-1 ${["evaluated", "published", "completed"].includes(ar.status.toLowerCase()) ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                        {ar.status.replace(/_/g, " ")}
                      </div>
                      <div className="text-xs font-bold text-slate-900">
                        {ar.score !== undefined ? `${ar.score} pts` : "Pending"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
