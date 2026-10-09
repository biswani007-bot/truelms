// @ts-nocheck
import React from "react";
import Link from "next/link";
import { connectDB } from "../../../../config/db";
import { getAuthenticatedStudent } from "../../../../lib/auth/student-session";
import { enrollmentRepository } from "../../../../repositories/enrollment.repository";
import { liveClassRepository } from "../../../../repositories/live-class.repository";
import { assignmentRepository } from "../../../../repositories/assignment.repository";
import { assignmentSubmissionRepository } from "../../../../repositories/assignment-submission.repository";
import { assessmentRepository } from "../../../../repositories/assessment.repository";
import { assessmentAttemptRepository } from "../../../../repositories/assessment-attempt.repository";
import { batchStudentRepository } from "../../../../repositories/batch-student.repository";
import { ProgressService } from "../../../../services/academic/progress.service";
import {
  BookOpen,
  Video,
  ClipboardCheck,
  Award,
  ArrowRight,
  Clock,
  Sparkles,
  Calendar,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export const revalidate = 0;

export const metadata = {
  title: "Student Learning Dashboard | TrueLern",
  description: "Live cohort schedule, assignments, assessments, and learning progress.",
};

export default async function StudentDashboardPage() {
  await connectDB();
  const student = await getAuthenticatedStudent();

  // If no student session is found, show clean unauthenticated state
  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
        <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-4">
          <BookOpen className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Welcome to TrueLern Student Hub</h1>
        <p className="text-slate-500 max-w-md mt-2 text-sm">
          Please sign in to access your enrolled courses, upcoming live lectures, assignments, and test scores.
        </p>
        <Link
          href="/login?redirect=/student/dashboard"
          className="mt-6 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm shadow-md shadow-indigo-100 transition"
        >
          Sign In to Your Account
        </Link>
      </div>
    );
  }

  // Real data queries strictly scoped to authenticated student
  const [enrollments, batchStudents, submissions, attempts] = await Promise.all([
    enrollmentRepository.findMany({ student: student._id }, { populate: ["course"] }),
    batchStudentRepository.findMany({ student: student._id }, { populate: ["batch"] }),
    assignmentSubmissionRepository.findMany({ student: student._id }),
    assessmentAttemptRepository.findMany({ student: student._id }),
  ]);

  const enrollmentsWithProgress = await Promise.all(
    enrollments.map(async (enr) => {
      const course = enr.course as any;
      const courseId = course?._id || enr.course;
      const progress = await ProgressService.getStudentCourseProgress(student._id, courseId);
      return { ...enr, progress };
    })
  );

  const courseIds = enrollments.map((e) => (e.course as any)?._id || e.course).filter(Boolean);
  const batchIds = batchStudents.map((bs) => (bs.batch as any)?._id || bs.batch).filter(Boolean);

  const [liveClasses, assignments, assessments] = await Promise.all([
    batchIds.length > 0
      ? liveClassRepository.findMany({ batch: { $in: batchIds } })
      : Promise.resolve([]),
    courseIds.length > 0
      ? assignmentRepository.findMany({ course: { $in: courseIds }, status: "published" })
      : Promise.resolve([]),
    courseIds.length > 0
      ? assessmentRepository.findMany({ course: { $in: courseIds }, status: { $in: ["running", "published"] } })
      : Promise.resolve([]),
  ]);

  const now = new Date();
  const upcomingClasses = liveClasses.filter((lc) => {
    const scheduled = (lc as any).startDate || (lc as any).scheduledAt;
    return scheduled && new Date(scheduled) > now;
  });

  const pendingAssignments = assignments.filter((a) => {
    return !submissions.some((s) => String(s.assignment) === String(a._id));
  });

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto">
      {/* Hero Welcome Banner */}
      <section className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-lg shadow-indigo-100">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md mb-3">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Student Learning Experience</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Hello, {student.firstName} {student.lastName}!
            </h1>
            <p className="text-indigo-100 text-sm mt-1.5 max-w-xl">
              Student ID: <span className="font-mono font-bold text-white">{student.studentId}</span> • Track your active cohort progress and join your scheduled live classes.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/student/courses"
              className="px-5 py-2.5 bg-white text-indigo-700 font-bold rounded-xl text-sm shadow hover:bg-indigo-50 transition"
            >
              My Courses
            </Link>
          </div>
        </div>
      </section>

      {/* Metrics Row */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Enrolled Courses", value: enrollments.length, icon: <BookOpen className="w-5 h-5 text-indigo-600" />, bg: "bg-indigo-50" },
          { label: "Upcoming Classes", value: upcomingClasses.length, icon: <Video className="w-5 h-5 text-sky-600" />, bg: "bg-sky-50" },
          { label: "Pending Tasks", value: pendingAssignments.length, icon: <ClipboardCheck className="w-5 h-5 text-amber-600" />, bg: "bg-amber-50" },
          { label: "Tests Taken", value: attempts.length, icon: <Award className="w-5 h-5 text-emerald-600" />, bg: "bg-emerald-50" },
        ].map((stat) => (
          <div key={stat.label} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{stat.label}</span>
              <div className="text-2xl font-black text-slate-900 mt-1">{stat.value}</div>
            </div>
            <div className={`p-3 rounded-xl ${stat.bg}`}>{stat.icon}</div>
          </div>
        ))}
      </section>

      {/* Main Grid: Upcoming Classes & Pending Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Upcoming Live Classes */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Video className="w-4 h-4 text-indigo-600" />
              <span>Upcoming Live Cohort Classes</span>
            </h2>
            <Link href="/student/live-classes" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {upcomingClasses.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center">
              <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No upcoming live classes scheduled</p>
              <p className="text-xs text-slate-400 mt-1">Your instructor will schedule live sessions for your enrolled batches.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingClasses.slice(0, 3).map((lc) => (
                <div key={lc._id?.toString()} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-indigo-200 transition flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                      Live Cohort
                    </span>
                    <h3 className="font-bold text-slate-900 text-base mt-1.5">{lc.classTitle || lc.title || "Live Cohort Lecture"}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {(() => {
                        const raw = (lc as any).startDate || (lc as any).scheduledAt;
                        const d = raw ? new Date(raw) : null;
                        return d && !isNaN(d.getTime())
                          ? d.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
                          : "Scheduled Session";
                      })()}
                    </p>
                  </div>
                  <a
                    href={lc.meetingLink || lc.joinUrl || "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition shrink-0"
                  >
                    Join Live Lecture
                  </a>
                </div>
              ))}
            </div>
          )}

          {/* Enrolled Courses Preview */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                <span>My Enrolled Courses</span>
              </h2>
              <Link href="/student/courses" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                View Catalog <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {enrollments.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center text-xs text-slate-500">
                You are not currently enrolled in any active course.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {enrollmentsWithProgress.map((enr) => {
                  const course = enr.course as any;
                  return (
                    <div key={enr._id?.toString()} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {course?.code || "COURSE"}
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm mt-1 mb-2">{course?.name || "Program"}</h4>
                      
                      <div className="w-full bg-slate-100 rounded-full h-1.5 mb-1.5">
                        <div 
                          className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${enr.progress}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-[10px] font-semibold text-slate-500 mb-3">
                        <span>Progress</span>
                        <span className="text-indigo-600">{enr.progress}%</span>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
                        <span className="text-emerald-600 font-semibold capitalize">{enr.status}</span>
                        <Link href={`/student/courses/${course?._id || enr.course}`} className="text-indigo-600 font-bold hover:underline">
                          Open Course →
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Pending Tasks & Assessments */}
        <div className="flex flex-col gap-6">
          {/* Pending Assignments */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 mb-3">
              <ClipboardCheck className="w-4 h-4 text-amber-600" />
              <span>Pending Assignments</span>
            </h3>

            {pendingAssignments.length === 0 ? (
              <div className="text-center py-4">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1" />
                <p className="text-xs font-semibold text-slate-700">All caught up!</p>
                <p className="text-[11px] text-slate-400">No pending assignments due.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {pendingAssignments.slice(0, 3).map((a) => (
                  <Link
                    key={a._id?.toString()}
                    href={`/student/assignments/${a._id}`}
                    className="block p-3 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-slate-50 transition"
                  >
                    <div className="font-bold text-slate-900 text-xs">{a.title}</div>
                    <div className="text-[11px] text-rose-600 font-medium mt-1">
                      Due: {a.dueDate ? new Date(a.dueDate).toLocaleDateString("en-IN") : "No date"}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Available Assessments */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 mb-3">
              <Award className="w-4 h-4 text-indigo-600" />
              <span>Available Assessments</span>
            </h3>

            {assessments.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-3">No active tests running.</p>
            ) : (
              <div className="space-y-2.5">
                {assessments.slice(0, 3).map((as) => (
                  <Link
                    key={as._id?.toString()}
                    href={`/student/assessments/${as._id}`}
                    className="block p-3 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-slate-50 transition"
                  >
                    <div className="font-bold text-slate-900 text-xs">{as.title}</div>
                    <div className="text-[11px] text-indigo-600 font-medium mt-1">
                      {as.duration || 60} mins • Max Marks: {as.maximumMarks || 100}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
