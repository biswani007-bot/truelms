// @ts-nocheck
import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connectDB } from "../../../../../../config/db";
import { getAuthenticatedStudent } from "../../../../../../lib/auth/student-session";
import { liveClassRepository } from "../../../../../../repositories/live-class.repository";
import { liveClassRecordingRepository } from "../../../../../../repositories/live-class-recording.repository";
import { batchStudentRepository } from "../../../../../../repositories/batch-student.repository";
import { ArrowLeft, PlayCircle, Clock, Calendar, User, ShieldAlert, Film, RefreshCw, FileText } from "lucide-react";

export const revalidate = 0;

export const metadata = {
  title: "Lecture Revision Archive | TrueLern Student",
  description: "Watch recorded lecture replays, review study materials, and reinforce key concepts.",
};

export default async function StudentClassRevisionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connectDB();
  const student = await getAuthenticatedStudent();
  const { id: classId } = await params;

  if (!student) {
    redirect("/login");
  }

  const liveClass = await liveClassRepository.findById(classId, {
    populate: ["course", "batch", "teacher"],
  });

  if (!liveClass) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center">
        <h1 className="text-xl font-bold text-slate-900">Session Not Found</h1>
        <p className="text-sm text-slate-500 mt-2">The requested lecture revision archive does not exist.</p>
        <Link
          href="/student/live-classes"
          className="inline-flex items-center gap-2 mt-6 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Live Classes</span>
        </Link>
      </div>
    );
  }

  // Verify Student is actively enrolled in this cohort
  const enrollment = await batchStudentRepository.findOne({
    batch: (liveClass.batch as any)?._id || liveClass.batch,
    student: student._id,
    status: "active",
  });

  if (!enrollment) {
    return (
      <div className="max-w-md mx-auto py-16 text-center bg-white border border-red-200 rounded-3xl p-8 shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h1 className="text-lg font-bold text-slate-900">Access Denied</h1>
        <p className="text-xs text-slate-500 mt-2">
          You are not enrolled in the cohort assigned to this lecture archive.
        </p>
        <Link
          href="/student/live-classes"
          className="inline-flex items-center gap-2 mt-6 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Live Classes</span>
        </Link>
      </div>
    );
  }

  const recording = await liveClassRecordingRepository.findOne({
    liveClass: classId,
  });

  const teacher = liveClass.teacher as any;
  const course = liveClass.course as any;
  const batch = liveClass.batch as any;

  const isReady = recording && recording.status === "ready" && recording.isPublished;
  const isProcessing = recording && recording.status === "processing";

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      {/* Header breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/student/live-classes"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Live Classes</span>
        </Link>
        <span className="text-xs text-slate-400 font-medium">
          {batch?.batchName || "Enrolled Cohort"}
        </span>
      </div>

      {/* Main Video Viewport or Status Banner */}
      <div className="bg-slate-950 rounded-3xl overflow-hidden border border-slate-800 shadow-xl">
        {isReady ? (
          <div className="relative aspect-video w-full bg-black flex items-center justify-center">
            <video
              controls
              className="w-full h-full object-contain"
              src={`/api/recordings/${recording._id}/stream`}
              poster="/video-poster.png"
            >
              Your browser does not support the video tag.
            </video>
          </div>
        ) : isProcessing ? (
          <div className="aspect-video w-full flex flex-col items-center justify-center p-8 text-center bg-slate-900">
            <RefreshCw className="w-10 h-10 text-indigo-500 animate-spin mb-3" />
            <h2 className="text-base font-bold text-white">Recording Processing</h2>
            <p className="text-xs text-slate-400 mt-1 max-w-md">
              The recorded session is currently being processed and encoded. It will become available for revision shortly.
            </p>
          </div>
        ) : (
          <div className="aspect-video w-full flex flex-col items-center justify-center p-8 text-center bg-slate-900">
            <Film className="w-10 h-10 text-slate-600 mb-3" />
            <h2 className="text-base font-bold text-slate-200">No Recording Available</h2>
            <p className="text-xs text-slate-400 mt-1 max-w-md">
              A recorded revision archive is not available for this session.
            </p>
          </div>
        )}
      </div>

      {/* Lecture Details and Metadata Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                {course?.code || "COURSE"}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {batch?.batchName}
              </span>
            </div>
            <h1 className="text-xl font-extrabold text-slate-900">
              {liveClass.title || (liveClass as any).classTitle || "Cohort Session"}
            </h1>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>
                {liveClass.scheduledAt
                  ? new Date(liveClass.scheduledAt).toLocaleDateString("en-IN", { dateStyle: "medium" })
                  : "Completed"}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>{recording?.durationMinutes || liveClass.durationMinutes || 60} mins</span>
            </div>
          </div>
        </div>

        {/* Instructor Info */}
        {teacher && (
          <div className="mt-4 flex items-center gap-3 text-xs text-slate-600 bg-slate-50 p-3 rounded-2xl">
            <User className="w-4 h-4 text-slate-400" />
            <span>Instructor: <strong className="text-slate-900">{teacher.firstName} {teacher.lastName}</strong></span>
          </div>
        )}

        {/* Session Agenda / Description */}
        <div className="mt-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" />
            <span>Session Overview & Key Concepts</span>
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
            {liveClass.agenda || (liveClass as any).description || "Topics covered during this interactive cohort workshop."}
          </p>
        </div>
      </div>
    </div>
  );
}
