// @ts-nocheck
import React from "react";
import Link from "next/link";
import { connectDB } from "../../../../config/db";
import { getAuthenticatedTeacher } from "../../../../lib/auth/teacher-session";
import { batchRepository } from "../../../../repositories/batch.repository";
import { BatchTeacher } from "../../../../models/batch-teacher.model";
import { liveClassRepository } from "../../../../repositories/live-class.repository";
import { assignmentRepository } from "../../../../repositories/assignment.repository";
import { Calendar, Clock, Video, BookOpen, ChevronRight, ExternalLink } from "lucide-react";

export const revalidate = 0;

export const metadata = {
  title: "Faculty Teaching Schedule | TrueLern Teacher",
  description: "Schedule of upcoming live lectures, cohort classes, and coursework deadlines.",
};

export default async function TeacherCalendarPage() {
  await connectDB();
  const teacher = await getAuthenticatedTeacher();

  if (!teacher) {
    return (
      <div className="text-center py-16">
        <h1 className="text-xl font-bold text-slate-900">Please Sign In</h1>
        <p className="text-sm text-slate-500 mt-1">Sign in to view your teaching schedule.</p>
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

  const [liveClasses, assignments] = await Promise.all([
    batchIds.length > 0
      ? liveClassRepository.findMany(
          { $or: [{ teacher: teacher._id }, { batch: { $in: batchIds } }] },
          { populate: ["batch", "course"], sort: "startDate", order: "asc" }
        )
      : [],
    assignmentRepository.findMany(
      { $or: [{ teacher: teacher._id }, { batch: { $in: batchIds } }] },
      { populate: ["batch", "course"] }
    ),
  ]);

  // Unify events
  const events = [
    ...liveClasses.map((lc) => {
      const rawDate = lc.startDate || lc.scheduledAt || (lc as any).startDateTime;
      const validDate = rawDate ? new Date(rawDate) : new Date();
      return {
        id: lc._id.toString(),
        type: "live_class",
        title: lc.classTitle || lc.title || "Live Cohort Lecture",
        date: isNaN(validDate.getTime()) ? new Date() : validDate,
        batchName: (lc.batch as any)?.batchName || "Assigned Cohort",
        link: lc.meetingLink || lc.joinUrl || "#",
        status: lc.status || "scheduled",
      };
    }),
    ...assignments.map((asm) => {
      const rawDate = asm.dueDate;
      const validDate = rawDate ? new Date(rawDate) : new Date();
      return {
        id: asm._id.toString(),
        type: "assignment_due",
        title: `${asm.title} (Due)`,
        date: isNaN(validDate.getTime()) ? new Date() : validDate,
        batchName: (asm.batch as any)?.batchName || "Cohort Task",
        link: "/teacher/assignments",
        status: asm.status || "published",
      };
    }),
  ].sort((a, b) => a.date.getTime() - b.date.getTime());

  return (
    <div className="flex flex-col gap-6 sm:gap-8 w-full max-w-[1500px] mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Faculty Academic Schedule</h1>
        <p className="text-sm text-slate-500 mt-2 leading-relaxed">
          Internal academic calendar showing scheduled live lecture sessions and student submission deadlines.
        </p>
      </div>

      {events.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center max-w-xl mx-auto">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-900">No scheduled events</h3>
          <p className="text-sm text-slate-500 mt-1">
            There are no upcoming live classes or assignment deadlines on your schedule.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
            Chronological Academic Timeline ({events.length} Events)
          </h2>

          <div className="space-y-3">
            {events.map((ev) => (
              <div
                key={`${ev.type}-${ev.id}`}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-indigo-200 transition"
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      ev.type === "live_class"
                        ? "bg-indigo-50 text-indigo-600"
                        : "bg-amber-50 text-amber-600"
                    }`}
                  >
                    {ev.type === "live_class" ? (
                      <Video className="w-5 h-5" />
                    ) : (
                      <BookOpen className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono">
                        {ev.batchName}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          ev.type === "live_class"
                            ? "bg-sky-50 text-sky-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {ev.type === "live_class" ? "Live Classroom" : "Coursework Deadline"}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900">{ev.title}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        {ev.date.toLocaleString("en-IN", {
                          dateStyle: "full",
                          timeStyle: "short",
                        })}
                      </span>
                    </p>
                  </div>
                </div>

                <div>
                  {ev.type === "live_class" ? (
                    <a
                      href={ev.link}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition"
                    >
                      <span>Join Lecture</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  ) : (
                    <Link
                      href={ev.link}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
                    >
                      <span>View Tasks</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
