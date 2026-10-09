// @ts-nocheck
import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connectDB } from "../../../../../../config/db";
import { getAuthenticatedTeacher } from "../../../../../../lib/auth/teacher-session";
import { liveClassRepository } from "../../../../../../repositories/live-class.repository";
import { BatchTeacher } from "../../../../../../models/batch-teacher.model";
import { generateJitsiToken } from "../../../../../../lib/jitsi/token";
import { JitsiMeetRoom } from "../../../../../../components/jitsi/jitsi-meet-room";
import { ArrowLeft, ShieldAlert, BookOpen, Layers, UserCheck, Calendar, Clock } from "lucide-react";

export const revalidate = 0;

export const metadata = {
  title: "Faculty Classroom Studio | TrueLern Teacher",
  description: "Conduct live cohort lectures, manage student participation, and record sessions.",
};

export default async function TeacherClassroomRoomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connectDB();
  const teacher = await getAuthenticatedTeacher();
  const { id: classId } = await params;

  if (!teacher) {
    redirect("/login");
  }

  const liveClass = await liveClassRepository.findById(classId, {
    populate: ["course", "batch"],
  });

  if (!liveClass) {
    const cleanDemoId = classId.startsWith("demo-") ? classId.replace(/^demo-/, "") : classId;
    let demoSession = null;
    if (/^[0-9a-fA-F]{24}$/.test(cleanDemoId)) {
      const { DemoSession } = await import("../../../../../../models/demo-session.model");
      const { DemoTeacherService } = await import("../../../../../../services/demo/demo-teacher.service");
      demoSession = await DemoSession.findById(cleanDemoId)
        .populate("course", "courseName courseCode slug")
        .populate("student", "firstName lastName studentId")
        .populate("parent", "firstName lastName email phone")
        .populate("teacher", "firstName lastName email");

      if (demoSession && !demoSession.isDeleted) {
        // 1. Verify Teacher Authorization
        const isAuthorized = await DemoTeacherService.isTeacherAuthorizedForDemo(
          teacher._id,
          demoSession,
          teacher.user
        );

        if (!isAuthorized) {
          return (
            <div className="max-w-md mx-auto py-16 text-center bg-white border border-red-200 rounded-3xl p-8 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h1 className="text-lg font-bold text-slate-900">Access Denied</h1>
              <p className="text-xs text-slate-500 mt-2">
                You are not authorized as an instructor for this demo session.
              </p>
              <Link
                href="/teacher/live-classes"
                className="inline-flex items-center gap-2 mt-6 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition shadow-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Faculty Portal</span>
              </Link>
            </div>
          );
        }

        // 2. Verify T-15 Join Window
        const eligibility = DemoTeacherService.getTeacherDemoJoinStatus(demoSession);
        if (!eligibility.canJoin) {
          return (
            <div className="max-w-md mx-auto py-16 text-center bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4">
                <Clock className="w-6 h-6" />
              </div>
              <h1 className="text-lg font-bold text-slate-900">Demo Join Unavailable</h1>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                {eligibility.reason}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Scheduled: {new Date(demoSession.scheduledStart).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - {new Date(demoSession.scheduledEnd).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
              <Link
                href="/teacher/live-classes"
                className="inline-flex items-center gap-2 mt-6 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition shadow-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Live Classes</span>
              </Link>
            </div>
          );
        }

        // 3. Generate Teacher Moderator Token
        const { tokenPayload } = await DemoTeacherService.generateTeacherDemoToken(
          teacher,
          cleanDemoId
        );

        const teacherName = `${teacher.firstName || ""} ${teacher.lastName || ""}`.trim() || teacher.email || "Faculty";
        const childName = demoSession.student
          ? `${(demoSession.student as any).firstName || ""} ${(demoSession.student as any).lastName || ""}`.trim()
          : "Student";
        const courseTitle = (demoSession.course as any)?.courseName || demoSession.interestedCourse || "Curriculum Demo";

        return (
          <div className="flex flex-col gap-3.5 max-w-7xl mx-auto pb-6">
            {/* Demo Studio Outer Header */}
            <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800/80 rounded-2xl px-5 py-3 flex flex-wrap items-center justify-between gap-4 shadow-lg">
              <div className="flex items-center gap-4">
                <Link
                  href="/teacher/live-classes"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/90 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition border border-slate-700/60 shadow-sm"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Exit Studio</span>
                </Link>
                <div>
                  <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs tracking-wider uppercase">
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>TrueLern Demo Studio</span>
                  </div>
                  <h1 className="text-sm md:text-base font-extrabold text-white tracking-tight">
                    Demo with {childName}
                  </h1>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-slate-800/60 rounded-xl text-slate-300 border border-slate-700/40">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="font-semibold">{courseTitle}</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-950/80 rounded-xl text-indigo-300 border border-indigo-800/50">
                  <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="font-semibold">Instructor: Prof. {teacherName}</span>
                </div>
              </div>
            </div>

            {/* Embedded Video Room */}
            <JitsiMeetRoom
              roomName={tokenPayload.roomName}
              jwtToken={tokenPayload.token}
              jitsiDomain={tokenPayload.jitsiDomain}
              serverUrl={tokenPayload.serverUrl}
              isModerator={true}
              userName={`Prof. ${teacherName}`}
              classTitle={`TrueLern Demo: ${childName} - ${courseTitle}`}
              liveClassId={`demo-${cleanDemoId}`}
              onConferenceLeft="/teacher/live-classes"
            />
          </div>
        );
      }
    }

    return (
      <div className="max-w-xl mx-auto py-16 text-center">
        <h1 className="text-xl font-bold text-slate-900">Lecture Session Not Found</h1>
        <p className="text-sm text-slate-500 mt-2">The requested live lecture session does not exist.</p>
        <Link
          href="/teacher/live-classes"
          className="inline-flex items-center gap-2 mt-6 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Live Classes</span>
        </Link>
      </div>
    );
  }

  // Verify Teacher is assigned to this live class or its batch
  const isDirectTeacher =
    liveClass.teacher?.toString() === teacher._id.toString() ||
    liveClass.assistantTeacher?.toString() === teacher._id.toString() ||
    liveClass.mentor?.toString() === teacher._id.toString();

  let isAssignedBatchTeacher = false;
  if (!isDirectTeacher && liveClass.batch) {
    const batchTeacher = await BatchTeacher.findOne({
      batch: (liveClass.batch as any)?._id || liveClass.batch,
      teacher: teacher._id,
      status: "active",
    });
    if (batchTeacher) isAssignedBatchTeacher = true;
  }

  if (!isDirectTeacher && !isAssignedBatchTeacher) {
    return (
      <div className="max-w-md mx-auto py-16 text-center bg-white border border-red-200 rounded-3xl p-8 shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h1 className="text-lg font-bold text-slate-900">Access Denied</h1>
        <p className="text-xs text-slate-500 mt-2">
          You are not assigned as an instructor or mentor for this cohort session.
        </p>
        <Link
          href="/teacher/live-classes"
          className="inline-flex items-center gap-2 mt-6 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Faculty Portal</span>
        </Link>
      </div>
    );
  }

  // Allow teacher to join at any time before class, no early restriction here.

  if (liveClass.status === "completed" || liveClass.status === "archived") {
    return (
      <div className="max-w-md mx-auto py-16 text-center bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-600 flex items-center justify-center mx-auto mb-4">
          <BookOpen className="w-6 h-6" />
        </div>
        <h1 className="text-lg font-bold text-slate-900">Session Completed</h1>
        <p className="text-xs text-slate-500 mt-2">
          This live lecture has already concluded. You can view it in your Past Lecture History.
        </p>
        <Link
          href="/teacher/live-classes"
          className="inline-flex items-center gap-2 mt-6 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>View Past Lectures</span>
        </Link>
      </div>
    );
  }

  const teacherName = `${teacher.firstName || ""} ${teacher.lastName || ""}`.trim() || teacher.email;
  const tokenData = generateJitsiToken(classId, {
    id: teacher._id.toString(),
    name: `Prof. ${teacherName}`,
    email: teacher.email,
    isModerator: true,
  });

  const courseTitle = (liveClass.course as any)?.title || "Advanced Curriculum";
  const batchName = (liveClass.batch as any)?.batchName || "Academic Cohort";
  const classTitle = liveClass.title || (liveClass as any).classTitle || "Live Lecture Session";

  return (
    <div className="flex flex-col gap-3.5 max-w-7xl mx-auto pb-6">
      {/* TrueLern Classroom Outer Header */}
      <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800/80 rounded-2xl px-5 py-3 flex flex-wrap items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-4">
          <Link
            href="/teacher/live-classes"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/90 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition border border-slate-700/60 shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Exit Studio</span>
          </Link>
          <div>
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs tracking-wider uppercase">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>TrueLern Classroom Studio</span>
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
            <span className="font-semibold">Instructor: Prof. {teacherName}</span>
          </div>
        </div>
      </div>

      {/* Embedded Video Area */}
      <JitsiMeetRoom
        roomName={tokenData.roomName}
        jwtToken={tokenData.token}
        jitsiDomain={tokenData.jitsiDomain}
        serverUrl={tokenData.serverUrl}
        isModerator={true}
        userName={`Prof. ${teacherName}`}
        classTitle={classTitle}
        liveClassId={classId}
        onConferenceLeft="/teacher/live-classes"
      />
    </div>
  );
}
