// @ts-nocheck
import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connectDB } from "../../../../../../config/db";
import { getAuthenticatedTeacher } from "../../../../../../lib/auth/teacher-session";
import { CounsellingRequest } from "../../../../../../models/counselling-request.model";
import { generateJitsiToken } from "../../../../../../lib/jitsi/token";
import { JitsiMeetRoom } from "../../../../../../components/jitsi/jitsi-meet-room";
import { ArrowLeft, ShieldAlert } from "lucide-react";

export const revalidate = 0;

export const metadata = {
  title: "Counselling Session | TrueLern Teacher",
  description: "Private counselling session.",
};

export default async function TeacherCounsellingRoomPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  await connectDB();
  const teacher = await getAuthenticatedTeacher();
  const { roomId } = await params;

  if (!teacher) {
    redirect("/login");
  }

  const request = await CounsellingRequest.findOne({ jitsiRoomId: roomId }).populate("student", "firstName lastName");

  if (!request) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center">
        <h1 className="text-xl font-bold text-slate-900">Session Not Found</h1>
        <p className="text-sm text-slate-500 mt-2">The requested counselling session does not exist.</p>
        <Link
          href="/teacher/counselling"
          className="inline-flex items-center gap-2 mt-6 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Requests</span>
        </Link>
      </div>
    );
  }

  // ONLY the assigned counsellor can enter
  if (request.counsellor.toString() !== teacher._id.toString()) {
    return (
      <div className="max-w-md mx-auto py-16 text-center bg-white border border-red-200 rounded-3xl p-8 shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h1 className="text-lg font-bold text-slate-900">Access Denied</h1>
        <p className="text-xs text-slate-500 mt-2">
          You are not the assigned counsellor for this session.
        </p>
        <Link
          href="/teacher/counselling"
          className="inline-flex items-center gap-2 mt-6 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Dashboard</span>
        </Link>
      </div>
    );
  }

  // Token Generation - Counsellor is Moderator, Recording is strictly disabled
  const token = generateJitsiToken({
    roomName: request.jitsiRoomId,
    userName: `${teacher.firstName} ${teacher.lastName}`,
    userEmail: teacher.email,
    userAvatar: "",
    isModerator: true,
    recordingEnabled: false,
  });

  return (
    <div className="h-[calc(100vh-64px)] w-full relative">
      <JitsiMeetRoom
        roomName={request.jitsiRoomId}
        jwt={token}
        userInfo={{
          displayName: `${teacher.firstName} ${teacher.lastName}`,
          email: teacher.email,
        }}
        configOverwrite={{
          startWithAudioMuted: false,
          startWithVideoMuted: false,
          disableModeratorIndicator: false,
          toolbarButtons: [
            "microphone", "camera", "closedcaptions", "desktop", "fullscreen",
            "fodeviceselection", "hangup", "profile", "chat",
            "etherpad", "settings", "videoquality", "filmstrip", "tileview", "shortcuts",
            "shareaudio", "sharedvideo", "toggle-camera"
          ],
        }}
        interfaceConfigOverwrite={{
          DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
          SHOW_CHROME_EXTENSION_BANNER: false,
        }}
        onReadyToClose={() => {
          // Can be handled client-side to redirect
        }}
      />
    </div>
  );
}
