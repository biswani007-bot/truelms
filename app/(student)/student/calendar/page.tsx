// @ts-nocheck
import React from "react";
import Link from "next/link";
import { connectDB } from "../../../../config/db";
import { getAuthenticatedStudent } from "../../../../lib/auth/student-session";
import { batchStudentRepository } from "../../../../repositories/batch-student.repository";
import { enrollmentRepository } from "../../../../repositories/enrollment.repository";
import { liveClassRepository } from "../../../../repositories/live-class.repository";
import { assignmentRepository } from "../../../../repositories/assignment.repository";
import { Calendar as CalendarIcon, Clock, Video, ClipboardList, AlertCircle } from "lucide-react";

export const revalidate = 0;

export const metadata = {
  title: "Academic Schedule & Calendar | TrueLern Student",
  description: "Live lecture schedule, assignment deadlines, and cohort milestones.",
};

export default async function StudentCalendarPage() {
  await connectDB();
  const student = await getAuthenticatedStudent();

  if (!student) {
    return (
      <div className="text-center py-16">
        <h1 className="text-xl font-bold text-slate-900">Please Sign In</h1>
        <p className="text-sm text-slate-500 mt-1">Sign in to view your academic calendar.</p>
      </div>
    );
  }

  // Scoped queries
  const [enrollments, batchStudents] = await Promise.all([
    enrollmentRepository.findMany({ student: student._id }),
    batchStudentRepository.findMany({ student: student._id }),
  ]);

  const courseIds = enrollments.map((e) => e.course).filter(Boolean);
  const batchIds = batchStudents.map((b) => b.batch).filter(Boolean);

  const [liveClasses, assignments] = await Promise.all([
    batchIds.length > 0
      ? liveClassRepository.findMany(
          { batch: { $in: batchIds } },
          { populate: ["course", "teacher"], sort: "startDate", order: "asc" }
        )
      : [],
    courseIds.length > 0
      ? assignmentRepository.findMany(
          { course: { $in: courseIds }, status: "published" },
          { populate: ["course"], sort: "dueDate", order: "asc" }
        )
      : [],
  ]);

  // Combine into unified event calendar items
  const events = [];

  for (const lc of liveClasses) {
    const rawDate = lc.startDate || lc.scheduledAt || (lc as any).startDateTime;
    const eventDate = rawDate ? new Date(rawDate) : new Date();
    const validDate = isNaN(eventDate.getTime()) ? new Date() : eventDate;

    events.push({
      id: `lc-${lc._id}`,
      title: lc.classTitle || lc.title || "Live Cohort Lecture",
      type: "class",
      date: validDate,
      formattedDate: validDate.toLocaleDateString("en-IN", {
        weekday: "short",
        month: "short",
        day: "numeric",
      }),
      formattedTime: validDate.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      course: (lc.course as any)?.name || (lc.course as any)?.code || "Lecture",
      link: lc.meetingLink || lc.joinUrl || "/student/live-classes",
      actionText: "Join Live",
    });
  }

  for (const a of assignments) {
    if (a.dueDate) {
      events.push({
        id: `as-${a._id}`,
        title: a.title,
        type: "assignment",
        date: new Date(a.dueDate),
        formattedDate: new Date(a.dueDate).toLocaleDateString("en-IN", {
          weekday: "short",
          month: "short",
          day: "numeric",
        }),
        formattedTime: new Date(a.dueDate).toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        course: (a.course as any)?.name || (a.course as any)?.code || "Assignment",
        link: `/student/assignments/${a._id}`,
        actionText: "Submit",
      });
    }
  }

  // Sort events chronologically
  events.sort((a, b) => a.date.getTime() - b.date.getTime());

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Academic Schedule & Calendar</h1>
        <p className="text-sm text-slate-500 mt-1">
          Synchronized cohort events, live lecture timings, and assignment submission deadlines.
        </p>
      </div>

      {events.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center max-w-xl mx-auto">
          <CalendarIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-900">No scheduled events</h3>
          <p className="text-sm text-slate-500 mt-1">
            There are currently no upcoming lectures or assignment deadlines scheduled on your calendar.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((evt) => (
            <div
              key={evt.id}
              className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm hover:border-indigo-200 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                      evt.type === "class"
                        ? "bg-sky-50 text-sky-700 border border-sky-100"
                        : "bg-amber-50 text-amber-700 border border-amber-100"
                    }`}
                  >
                    {evt.type === "class" ? <Video className="w-3 h-3" /> : <ClipboardList className="w-3 h-3" />}
                    <span>{evt.type === "class" ? "Live Lecture" : "Submission Due"}</span>
                  </span>

                  <span className="text-xs font-bold text-slate-500">{evt.formattedDate}</span>
                </div>

                <span className="text-[11px] font-bold text-indigo-600 block">{evt.course}</span>
                <h3 className="font-bold text-slate-900 text-sm mt-1 leading-snug">{evt.title}</h3>

                <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{evt.formattedTime}</span>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100">
                <Link
                  href={evt.link}
                  className="w-full flex items-center justify-center gap-1.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition shadow-sm"
                >
                  <span>{evt.actionText}</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
