// @ts-nocheck
import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connectDB } from "../../../../../../config/db";
import { getAuthenticatedStudent } from "../../../../../../lib/auth/student-session";
import { liveClassRepository } from "../../../../../../repositories/live-class.repository";
import { batchStudentRepository } from "../../../../../../repositories/batch-student.repository";
import { generateJitsiToken } from "../../../../../../lib/jitsi/token";
import { JitsiMeetRoom } from "../../../../../../components/jitsi/jitsi-meet-room";
import { ArrowLeft, ShieldAlert, BookOpen, Layers, UserCheck } from "lucide-react";

export const revalidate = 0;

export const metadata = {
  title: "Live Classroom | TrueLern Student",
  description: "Interactive live cohort lecture and workshop session.",
};

export default async function StudentClassroomRoomPage({
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
        <p className="text-sm text-slate-500 mt-2">The requested live class session does not exist.</p>
        <Link
          href="/student/live-classes"
          className="inline-flex items-center gap-2 mt-6 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Live Classes</span>
        </Link>
      </div>
    );
  }

  // Verify Student is actively enrolled in the batch
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
          You are not enrolled in the cohort assigned to this live session.
        </p>
        <Link
          href="/student/live-classes"
          className="inline-flex items-center gap-2 mt-6 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to My Schedule</span>
        </Link>
      </div>
    );
  }

  const studentName = `${student.firstName || ""} ${student.lastName || ""}`.trim() || student.email;
  const tokenData = generateJitsiToken(classId, {
    id: student._id.toString(),
    name: studentName,
    email: student.email,
    isModerator: false,
  });

  const courseTitle = (liveClass.course as any)?.title || "Curriculum Session";
  const batchName = (liveClass.batch as any)?.batchName || "Academic Cohort";
  const classTitle = liveClass.title || (liveClass as any).classTitle || "Interactive Cohort Lecture";
  const teacherObj = liveClass.teacher as any;
  const teacherName = teacherObj ? `${teacherObj.firstName || ""} ${teacherObj.lastName || ""}`.trim() || teacherObj.email : "Assigned Faculty";

  return (
    <div className="flex flex-col gap-3.5 max-w-7xl mx-auto pb-6">
      {/* TrueLern Classroom Outer Header */}
      <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800/80 rounded-2xl px-5 py-3 flex flex-wrap items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-4">
          <Link
            href="/student/live-classes"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/90 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition border border-slate-700/60 shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Leave Class</span>
          </Link>
          <div>
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs tracking-wider uppercase">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>TrueLern Live Classroom</span>
            </div>
            <h1 className="text-sm md:text-base font-extrabold text-white tracking-tight">{classTitle}</h1>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-slate-800/60 rounded-xl text-slate-300 border border-slate-700/40">
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            <span className="font-semibold">{courseTitle}</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-800/60 rounded-xl text-slate-300 border border-slate-700/40">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>{batchName}</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-950/80 rounded-xl text-indigo-300 border border-indigo-800/50">
            <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span className="font-semibold">Instructor: {teacherName}</span>
          </div>
        </div>
      </div>

      {/* Embedded Video Area */}
      <JitsiMeetRoom
        roomName={tokenData.roomName}
        jwtToken={tokenData.token}
        jitsiDomain={tokenData.jitsiDomain}
        serverUrl={tokenData.serverUrl}
        isModerator={false}
        userName={studentName}
        classTitle={classTitle}
        onConferenceLeft="/student/live-classes"
      />
    </div>
  );
}
