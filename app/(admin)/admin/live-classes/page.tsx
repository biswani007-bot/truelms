/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import Link from "next/link";
import { liveClassRepository } from "../../../../repositories/live-class.repository";
import { courseRepository } from "../../../../repositories/course.repository";
import { batchRepository } from "../../../../repositories/batch.repository";
import { teacherRepository } from "../../../../repositories/teacher.repository";
import { batchTeacherRepository } from "../../../../repositories/batch-teacher.repository";
import { connectDB } from "../../../../config/db";
import { Video, Calendar, Clock, BookOpen, Layers, User, ExternalLink } from "lucide-react";
import { ScheduleLiveClassModal } from "../../../../components/admin/schedule-live-class-modal";
import { AcademicResolver } from "../../../../services/academic/academic.service";

export const revalidate = 0;

export default async function LiveClassesDashboard() {
  await connectDB();
  const [classes, courses, batches, teachers, batchTeachers] = await Promise.all([
    liveClassRepository.findMany({}, { populate: ["batch", "course", "teacher"] }),
    courseRepository.findMany({}, { select: "_id courseCode courseName" } as any),
    batchRepository.findMany({}, { select: "_id batchCode batchName course primaryTeacher assistantTeacher mentor" } as any),
    teacherRepository.findMany({}, { select: "_id firstName lastName designation teacherCode" } as any),
    batchTeacherRepository.findMany({ status: "active" }, { select: "batch teacher" } as any),
  ]);

  const resolvedClasses = classes.map((c: any) => AcademicResolver.resolveLiveClass(c));

  // Compute status cards
  const scheduled = resolvedClasses.filter((c: any) => c.status === "scheduled").length;
  const live = resolvedClasses.filter((c: any) => c.status === "live").length;
  const completed = resolvedClasses.filter((c: any) => c.status === "completed").length;
  const cancelled = resolvedClasses.filter((c: any) => c.status === "cancelled").length;

  const serializableCourses = courses.map((c) => ({
    _id: c._id.toString(),
    courseCode: c.courseCode,
    courseName: c.courseName,
  }));

  const serializableBatches = batches.map((b) => ({
    _id: b._id.toString(),
    batchCode: b.batchCode,
    batchName: b.batchName,
    course: b.course?.toString() || "",
    primaryTeacher: b.primaryTeacher?.toString() || "",
    assistantTeacher: b.assistantTeacher?.toString() || "",
    mentor: b.mentor?.toString() || "",
  }));

  const serializableTeachers = teachers.map((t: any) => ({
    _id: t._id.toString(),
    firstName: t.firstName,
    lastName: t.lastName,
    designation: t.designation,
    teacherCode: t.teacherCode,
  }));

  const serializableBatchTeachers = batchTeachers.map((bt: any) => ({
    batch: bt.batch?.toString() || "",
    teacher: bt.teacher?.toString() || "",
  }));

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Live Classes</h1>
          <p className="text-sm text-slate-500 mt-1">Schedule live interactive classes on TrueLern Classroom, track instructor availability, and manage sessions.</p>
        </div>
        <ScheduleLiveClassModal 
          courses={serializableCourses}
          batches={serializableBatches}
          teachers={serializableTeachers}
          batchTeachers={serializableBatchTeachers}
        />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Scheduled Classes", val: scheduled, color: "text-indigo-600", bg: "bg-indigo-50/50 border-indigo-100" },
          { label: "Active Live Sessions", val: live, color: "text-emerald-600 animate-pulse", bg: "bg-emerald-50/50 border-emerald-100" },
          { label: "Completed Classes", val: completed, color: "text-slate-600", bg: "bg-slate-50 border-slate-200" },
          { label: "Cancelled Sessions", val: cancelled, color: "text-red-500", bg: "bg-red-50/50 border-red-100" },
        ].map((kpi, idx) => (
          <div key={idx} className={`border p-5 rounded-2xl ${kpi.bg} shadow-sm`}>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{kpi.label}</div>
            <div className={`text-3xl font-black mt-2 ${kpi.color}`}>{kpi.val}</div>
          </div>
        ))}
      </div>

      {/* Classes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {resolvedClasses.map((cls: any) => {
          const teacherObj = cls.teacher;
          const courseObj = cls.course;
          const batchObj = cls.batch;
          const courseTitle = courseObj?.name || "Program Lecture";
          const platformLabel = "TrueLern Live Classroom";

          return (
            <div key={cls.id} className="bg-white border border-slate-200 p-6 rounded-3xl flex flex-col justify-between hover:border-indigo-200 transition shadow-sm">
              <div>
                <div className="flex justify-between items-start gap-4">
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] font-bold uppercase tracking-wider">
                    {cls.code}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    cls.status === "scheduled" ? "bg-sky-50 text-sky-700 border border-sky-100" :
                    cls.status === "live" ? "bg-emerald-50 text-emerald-700 border border-emerald-100 animate-pulse" :
                    cls.status === "completed" ? "bg-slate-100 text-slate-600 border border-slate-200" :
                    "bg-red-50 text-red-700 border border-red-100"
                  }`}>
                    {cls.status}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 mt-3 line-clamp-1">{cls.title}</h3>
                
                <div className="mt-2 flex flex-col gap-1 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5 font-medium">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span className="truncate">{courseTitle}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-medium">
                    <Layers className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                    <span className="truncate">{batchObj?.name || "Cohort Cohort"}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col gap-2 text-xs text-slate-600">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Instructor:</span>
                    <span className="font-semibold text-slate-800">
                      {teacherObj ? `Prof. ${teacherObj.name}` : "TBD"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Platform:</span>
                    <span className="font-semibold text-indigo-600">{platformLabel}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Date & Time:</span>
                    <span className="font-semibold text-slate-800">
                      {cls.startDate ? new Date(cls.startDate).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "Scheduled"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Duration:</span>
                    <span className="font-semibold text-slate-800">{cls.duration || 60} Mins</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex gap-2">
                <Link
                  href={`/admin/live-classes/${cls.id}`}
                  className="flex-1 text-center py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition"
                >
                  Manage Session
                </Link>
                <Link
                  href={`/teacher/live-classes/${cls.id}/room`}
                  className="flex-1 text-center py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition shadow-sm flex items-center justify-center gap-1.5"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Open Room</span>
                </Link>
              </div>
            </div>
          );
        })}
        {classes.length === 0 && (
          <div className="col-span-full py-16 bg-white border border-slate-200 rounded-3xl text-center text-slate-500 text-sm">
            <Video className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="font-semibold text-slate-700">No live cohort classes scheduled yet.</p>
            <p className="text-xs text-slate-400 mt-1 mb-4">Live classes are scheduled from inside a Batch detail page.</p>
            <Link
              href="/admin/batches"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
            >
              <span>Schedule Live Class</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

