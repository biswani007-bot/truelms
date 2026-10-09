// @ts-nocheck
import React from "react";
import Link from "next/link";
import { connectDB } from "../../../../config/db";
import { getAuthenticatedTeacher } from "../../../../lib/auth/teacher-session";
import { batchRepository } from "../../../../repositories/batch.repository";
import { BatchTeacher } from "../../../../models/batch-teacher.model";
import { liveClassRepository } from "../../../../repositories/live-class.repository";
import { AcademicResolver } from "../../../../services/academic/academic.service";
import { DemoTeacherService } from "../../../../services/demo/demo-teacher.service";
import {
  Video,
  Calendar,
  Clock,
  ArrowRight,
  Users,
  BookOpen,
  Sparkles,
  CheckCircle2,
  GraduationCap,
  ShieldAlert,
  User,
} from "lucide-react";

export const revalidate = 0;

export const metadata = {
  title: "Faculty Live Classes & Demos | TrueLern Teacher",
  description: "Schedule, launch, and conduct live cohort sessions and prospective student demo sessions.",
};

export default async function TeacherLiveClassesPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  await connectDB();
  const teacher = await getAuthenticatedTeacher();
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const currentTab = resolvedSearchParams?.tab === "demos" ? "demos" : "classes";

  if (!teacher) {
    return (
      <div className="text-center py-16">
        <h1 className="text-xl font-bold text-slate-900">Please Sign In</h1>
        <p className="text-sm text-slate-500 mt-1">Sign in to view your scheduled classroom sessions.</p>
      </div>
    );
  }

  // 1. Live Classes scoped to teacher batches
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

  const liveClasses =
    batchIds.length > 0
      ? (await liveClassRepository.findMany(
          { $or: [{ teacher: teacher._id }, { batch: { $in: batchIds } }] },
          { populate: ["course", "batch"], sort: "startDate", order: "asc" }
        )).map((lc: any) => AcademicResolver.resolveLiveClass(lc))
      : [];

  const now = new Date();
  const upcomingClasses = liveClasses.filter((lc: any) => {
    if (lc.status === "completed" || lc.status === "archived") return false;
    const end = lc.endDateTime;
    return end ? new Date(end) > now : true;
  });
  const pastClasses = liveClasses.filter((lc: any) => {
    if (lc.status === "completed" || lc.status === "archived") return true;
    const end = lc.endDateTime;
    return end ? new Date(end) <= now : false;
  });

  // 2. Assigned Demo Sessions scoped to this teacher
  const demoSessions = await DemoTeacherService.getTeacherAssignedDemos(
    teacher._id,
    teacher.user
  );

  const upcomingDemos = demoSessions.filter((d: any) => {
    if (d.status === "completed" || d.status === "cancelled") return false;
    const end = new Date(d.scheduledEnd);
    return end > now || d.status === "live";
  });

  const pastDemos = demoSessions.filter((d: any) => {
    if (d.status === "completed" || d.status === "cancelled") return true;
    const end = new Date(d.scheduledEnd);
    return end <= now && d.status !== "live";
  });

  return (
    <div className="flex flex-col gap-6 sm:gap-8 w-full max-w-[1500px] mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Faculty Live Classroom Sessions
        </h1>
        <p className="text-sm text-slate-500 mt-2 leading-relaxed">
          Launch cohort lectures and conduct live prospective student demo sessions using the TrueLern Classroom Studio.
        </p>
      </div>

      {/* Tabs Selector: Live Classes vs Assigned Demo Sessions */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
        <Link
          href="/teacher/live-classes?tab=classes"
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            currentTab === "classes"
              ? "bg-indigo-600 text-white shadow-sm"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <Video className="w-4 h-4" />
          <span>Cohort Live Classes</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              currentTab === "classes"
                ? "bg-indigo-500 text-white"
                : "bg-slate-200 text-slate-700"
            }`}
          >
            {liveClasses.length}
          </span>
        </Link>

        <Link
          href="/teacher/live-classes?tab=demos"
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            currentTab === "demos"
              ? "bg-indigo-600 text-white shadow-sm"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Assigned Demo Sessions</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              currentTab === "demos"
                ? "bg-indigo-500 text-white"
                : "bg-slate-200 text-slate-700"
            }`}
          >
            {demoSessions.length}
          </span>
        </Link>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: COHORT LIVE CLASSES                                */}
      {/* ========================================================= */}
      {currentTab === "classes" && (
        <div className="flex flex-col gap-6 sm:gap-8">
          {/* Metrics Row */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Total Sessions", value: liveClasses.length, color: "text-slate-900" },
              { label: "Upcoming Classes", value: upcomingClasses.length, color: "text-indigo-600" },
              { label: "Completed / Past", value: pastClasses.length, color: "text-slate-400" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="p-5 rounded-2xl bg-white border border-slate-200 text-center shadow-sm"
              >
                <div className={`text-2xl font-black ${stat.color}`}>{stat.value}</div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mt-1">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {/* Upcoming Live Classes Section */}
          <div className="space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <span>Upcoming Scheduled Classes</span>
            </h2>

            {upcomingClasses.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm bg-white border border-slate-200 rounded-3xl">
                <Video className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="font-semibold text-slate-600">No upcoming live classes scheduled</p>
                <p className="text-xs text-slate-400 mt-1">
                  New lecture sessions scheduled for your cohorts will appear here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {upcomingClasses.map((cls) => {
                  const batch = cls.batch as any;
                  const course = cls.course as any;
                  const classTitle = cls.classTitle || cls.title || "Live Cohort Lecture";
                  const classDate = cls.startDateTime;

                  return (
                    <div
                      key={cls._id?.toString()}
                      className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                            {batch?.batchName || "Assigned Cohort"}
                          </span>
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                            {cls.status || "Scheduled"}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-slate-900">{classTitle}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">{course?.name || "Program Lecture"}</p>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-3">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {classDate
                              ? new Date(classDate).toLocaleString("en-IN", {
                                  dateStyle: "medium",
                                  timeStyle: "short",
                                })
                              : "Scheduled Session"}
                          </span>
                        </div>
                      </div>

                      <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[11px] text-slate-400">
                          Duration: {cls.duration || 60} mins
                        </span>
                        <Link
                          href={`/teacher/live-classes/${cls._id}/room`}
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>Launch Classroom Studio</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Past Cohort Lectures History */}
          <div className="space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>Past Lecture History</span>
            </h2>

            {pastClasses.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs bg-white border border-slate-200 rounded-2xl">
                No completed lecture history records found.
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 uppercase font-bold text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Lecture Title</th>
                      <th className="py-3 px-4">Batch</th>
                      <th className="py-3 px-4">Date & Time</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Recording</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {pastClasses.map((cls) => {
                      const batch = cls.batch as any;
                      return (
                        <tr key={cls._id?.toString()} className="hover:bg-slate-50/50 transition">
                          <td className="py-3 px-4 font-bold text-slate-900">{cls.title}</td>
                          <td className="py-3 px-4 text-slate-600">{batch?.batchName || "-"}</td>
                          <td className="py-3 px-4 text-slate-500">
                            {cls.startDateTime
                              ? new Date(cls.startDateTime).toLocaleDateString("en-IN", {
                                  dateStyle: "medium",
                                })
                              : "-"}
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-600">
                              {cls.status || "Completed"}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            {cls.recordingUrl ? (
                              <a
                                href={cls.recordingUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[10px] rounded-lg transition"
                              >
                                <Video className="w-3 h-3" />
                                View Recording
                              </a>
                            ) : (
                              <span className="text-[10px] text-slate-400">Unavailable</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: ASSIGNED DEMO SESSIONS                             */}
      {/* ========================================================= */}
      {currentTab === "demos" && (
        <div className="flex flex-col gap-6 sm:gap-8">
          {/* Demo Metrics Row */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Total Assigned Demos", value: demoSessions.length, color: "text-slate-900" },
              { label: "Active / Upcoming", value: upcomingDemos.length, color: "text-emerald-600" },
              { label: "Completed Demos", value: pastDemos.filter((d) => d.status === "completed").length, color: "text-indigo-600" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="p-5 rounded-2xl bg-white border border-slate-200 text-center shadow-sm"
              >
                <div className={`text-2xl font-black ${stat.color}`}>{stat.value}</div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mt-1">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {/* Upcoming Assigned Demo Sessions */}
          <div className="space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span>Upcoming Assigned Demo Sessions</span>
            </h2>

            {upcomingDemos.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm bg-white border border-slate-200 rounded-3xl">
                <GraduationCap className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="font-semibold text-slate-600">No upcoming demo sessions assigned</p>
                <p className="text-xs text-slate-400 mt-1">
                  Prospective student demos scheduled for your courses will appear here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {upcomingDemos.map((demo: any) => {
                  const student = demo.student as any;
                  const parent = demo.parent as any;
                  const course = demo.course as any;
                  const childName = student
                    ? `${student.firstName || ""} ${student.lastName || ""}`.trim()
                    : "Student Lead";
                  const parentName = parent
                    ? `${parent.firstName || ""} ${parent.lastName || ""}`.trim()
                    : "Parent / Guardian";
                  const courseName = course?.courseName || demo.interestedCourse || "Program Demo";
                  const scheduledStart = new Date(demo.scheduledStart);
                  const scheduledEnd = new Date(demo.scheduledEnd);
                  const eligibility = DemoTeacherService.getTeacherDemoJoinStatus(demo);

                  return (
                    <div
                      key={demo._id?.toString()}
                      className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:border-slate-300 transition"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                            Demo Code: {demo.demoCode}
                          </span>
                          <span
                            className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                              demo.status === "live"
                                ? "bg-red-50 text-red-600 animate-pulse"
                                : demo.status === "completed"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {demo.status === "live" ? "● Live Now" : demo.status}
                          </span>
                        </div>

                        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                          <User className="w-4 h-4 text-emerald-600" />
                          <span>Child: {childName}</span>
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5 font-medium">
                          Program: {courseName}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Parent: {parentName}
                        </p>

                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-3 bg-slate-50 p-2.5 rounded-xl">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {scheduledStart.toLocaleDateString("en-IN", { dateStyle: "medium" })} at{" "}
                            {scheduledStart.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} -{" "}
                            {scheduledEnd.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      </div>

                      <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                        <span className="text-[11px] text-slate-400">
                          Duration: {demo.duration || 45} mins
                        </span>

                        {eligibility.canJoin ? (
                          <Link
                            href={`/teacher/live-classes/${demo._id}/room`}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition"
                          >
                            <Video className="w-3.5 h-3.5" />
                            <span>Join Demo</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-500 font-semibold text-xs rounded-xl">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>{eligibility.reason}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Past / Concluded Demo Sessions */}
          <div className="space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>Concluded Demo History</span>
            </h2>

            {pastDemos.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs bg-white border border-slate-200 rounded-2xl">
                No concluded demo sessions found.
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 uppercase font-bold text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Demo Code</th>
                      <th className="py-3 px-4">Student</th>
                      <th className="py-3 px-4">Program</th>
                      <th className="py-3 px-4">Scheduled Date</th>
                      <th className="py-3 px-4">Child Participation</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {pastDemos.map((demo: any) => {
                      const student = demo.student as any;
                      const course = demo.course as any;
                      const childName = student
                        ? `${student.firstName || ""} ${student.lastName || ""}`.trim()
                        : "Student";
                      const courseName = course?.courseName || demo.interestedCourse || "-";
                      const actualMins = Math.floor((demo.actualDurationSeconds || 0) / 60);

                      return (
                        <tr key={demo._id?.toString()} className="hover:bg-slate-50/50 transition">
                          <td className="py-3 px-4 font-bold text-slate-900">{demo.demoCode}</td>
                          <td className="py-3 px-4 text-slate-900 font-semibold">{childName}</td>
                          <td className="py-3 px-4 text-slate-600">{courseName}</td>
                          <td className="py-3 px-4 text-slate-500">
                            {demo.scheduledStart
                              ? new Date(demo.scheduledStart).toLocaleDateString("en-IN", {
                                  dateStyle: "medium",
                                })
                              : "-"}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                (demo.actualDurationSeconds || 0) >= 540
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {actualMins}m ({demo.actualDurationSeconds || 0}s)
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                demo.status === "completed"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {demo.status || "Completed"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
