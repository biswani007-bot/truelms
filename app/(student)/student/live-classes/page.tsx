// @ts-nocheck
import React from "react";
import Link from "next/link";
import { connectDB } from "../../../../config/db";
import { getAuthenticatedStudent } from "../../../../lib/auth/student-session";
import { batchStudentRepository } from "../../../../repositories/batch-student.repository";
import { liveClassRepository } from "../../../../repositories/live-class.repository";
import { liveClassRecordingRepository } from "../../../../repositories/live-class-recording.repository";
import { Video, Calendar, Clock, User, PlayCircle, Film } from "lucide-react";

export const revalidate = 0;

export const metadata = {
  title: "Live Classes | TrueLern Student",
  description: "Scheduled live cohort sessions, interactive workshops, and class links.",
};

export default async function StudentLiveClassesPage() {
  await connectDB();
  const student = await getAuthenticatedStudent();

  if (!student) {
    return (
      <div className="text-center py-16">
        <h1 className="text-xl font-bold text-slate-900">Please Sign In</h1>
        <p className="text-sm text-slate-500 mt-1">Sign in to view your live cohort schedule.</p>
      </div>
    );
  }

  // Scoped to student's assigned batches
  const batchStudents = await batchStudentRepository.findMany(
    { student: student._id },
    { populate: ["batch"] }
  );
  const batchIds = batchStudents.map((bs) => (bs.batch as any)?._id || bs.batch).filter(Boolean);

  const liveClasses =
    batchIds.length > 0
      ? await liveClassRepository.findMany(
          { batch: { $in: batchIds } },
          { populate: ["teacher", "course", "batch"], sort: "startDate", order: "asc" }
        )
      : [];

  const classIds = liveClasses.map((lc) => lc._id);
  const recordings =
    classIds.length > 0
      ? await liveClassRecordingRepository.findMany({ liveClass: { $in: classIds } })
      : [];

  const recordingsByClassId = new Map(recordings.map((r) => [r.liveClass.toString(), r]));

  const now = new Date();
  const upcoming = liveClasses.filter((lc) => {
    const scheduled = (lc as any).startDate || (lc as any).scheduledAt;
    return scheduled && new Date(scheduled) > now;
  });
  const past = liveClasses.filter((lc) => {
    const scheduled = (lc as any).startDate || (lc as any).scheduledAt;
    return !scheduled || new Date(scheduled) <= now;
  });

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Live Cohort Classes</h1>
        <p className="text-sm text-slate-500 mt-1">
          Join scheduled interactive sessions with your faculty and peer cohort.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Sessions", count: liveClasses.length, color: "text-indigo-600" },
          { label: "Upcoming", count: upcoming.length, color: "text-sky-600" },
          { label: "Completed / Recorded", count: past.length, color: "text-slate-500" },
        ].map((s) => (
          <div key={s.label} className="p-4 rounded-2xl bg-white border border-slate-200 text-center shadow-sm">
            <div className={`text-2xl font-black ${s.color}`}>{s.count}</div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Upcoming Section */}
      <div>
        <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-sky-600" />
          <span>Upcoming Live Sessions</span>
        </h2>

        {upcoming.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center">
            <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No upcoming live classes scheduled</p>
            <p className="text-xs text-slate-400 mt-1">
              Your instructor will publish scheduled sessions for your batch.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcoming.map((cls) => {
              const teacher = cls.teacher as any;
              const course = cls.course as any;

              const classTitle = cls.classTitle || cls.title || "Live Cohort Lecture";
              const classDate = cls.startDate || cls.scheduledAt;

              return (
                <div
                  key={cls._id?.toString()}
                  className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:border-indigo-200 transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-100">
                        {course?.code || "LIVE"}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        {classDate
                          ? new Date(classDate).toLocaleString("en-IN", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })
                          : "Scheduled Session"}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-base">{classTitle}</h3>
                    {cls.description && <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">{cls.description}</p>}
                    {cls.agenda && <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">{cls.agenda}</p>}

                    {teacher && (
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-600">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>Faculty: Prof. {teacher.firstName} {teacher.lastName}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-5">
                    <Link
                      href={`/student/live-classes/${cls._id}/room`}
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition"
                    >
                      <Video className="w-4 h-4" />
                      <span>Join Live Classroom</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Past Sessions & Revisions */}
      {past.length > 0 && (
        <div>
          <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Film className="w-4 h-4 text-slate-500" />
            <span>Past Sessions & Lecture Revision</span>
          </h2>
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
            <div className="divide-y divide-slate-100">
              {past.map((cls) => {
                const recording = recordingsByClassId.get(cls._id.toString());
                const isReady = recording && recording.status === "ready" && recording.isPublished;

                return (
                  <div key={cls._id?.toString()} className="p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs">
                    <div>
                      <span className="font-bold text-slate-900 text-sm block">{cls.title}</span>
                      <span className="text-slate-400">
                        Conducted on {new Date(cls.scheduledAt).toLocaleDateString("en-IN", { dateStyle: "long" })}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {isReady ? (
                        <Link
                          href={`/student/live-classes/${cls._id}/revision`}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl transition"
                        >
                          <PlayCircle className="w-3.5 h-3.5" />
                          <span>Watch Revision</span>
                        </Link>
                      ) : (
                        <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-500 font-semibold text-[11px]">
                          Completed
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
