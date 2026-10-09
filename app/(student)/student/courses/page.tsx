// @ts-nocheck
import React from "react";
import Link from "next/link";
import { connectDB } from "../../../../config/db";
import { getAuthenticatedStudent } from "../../../../lib/auth/student-session";
import { enrollmentRepository } from "../../../../repositories/enrollment.repository";
import { ProgressService } from "../../../../services/academic/progress.service";
import { BookOpen, ArrowRight, Clock, Award, CheckCircle2 } from "lucide-react";

export const revalidate = 0;

export const metadata = {
  title: "My Enrolled Courses | TrueLern Student",
  description: "View your enrolled programs, curriculum modules, and progress.",
};

export default async function StudentCoursesPage() {
  await connectDB();
  const student = await getAuthenticatedStudent();

  if (!student) {
    return (
      <div className="text-center py-16">
        <h1 className="text-xl font-bold text-slate-900">Please Sign In</h1>
        <p className="text-sm text-slate-500 mt-1">Sign in to view your enrolled courses.</p>
        <Link href="/login?redirect=/student/courses" className="mt-4 inline-block px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold">
          Sign In
        </Link>
      </div>
    );
  }

  const enrollments = await enrollmentRepository.findMany(
    { student: student._id },
    { populate: ["course"] }
  );

  const enrollmentsWithProgress = await Promise.all(
    enrollments.map(async (enr) => {
      const course = enr.course as any;
      const courseId = course?._id || enr.course;
      const progress = await ProgressService.getStudentCourseProgress(student._id, courseId);
      return { ...enr, progress };
    })
  );

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">My Enrolled Courses</h1>
        <p className="text-sm text-slate-500 mt-1">
          Access your interactive curriculum, video modules, and downloadable study materials.
        </p>
      </div>

      {enrollments.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center max-w-xl mx-auto">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-900">No active course enrollments</h3>
          <p className="text-sm text-slate-500 mt-1">
            You are not currently enrolled in any courses. Explore our programs catalog to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {enrollmentsWithProgress.map((enr) => {
            const course = enr.course as any;
            const courseId = course?._id || enr.course;
            return (
              <div
                key={enr._id?.toString()}
                className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-mono">
                      {course?.code || "COURSE"}
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full capitalize">
                      {enr.status || "Active"}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-lg leading-snug">
                    {course?.name || "Program"}
                  </h3>
                  
                  <div className="mt-4">
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-slate-600">Course Progress</span>
                      <span className="text-indigo-600">{enr.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div 
                        className="bg-indigo-600 h-2 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${enr.progress}%` }}
                      ></div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 mt-4 line-clamp-3 leading-relaxed">
                    {course?.description || "Structured practical skills program designed for real-world mastery."}
                  </p>

                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {course?.durationWeeks || 8} Weeks
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-amber-500" />
                      {course?.credits || 3} Credits
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100">
                  <Link
                    href={`/student/courses/${courseId}`}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition"
                  >
                    <span>Open Curriculum</span>
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
