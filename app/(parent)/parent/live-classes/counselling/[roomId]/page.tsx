// @ts-nocheck
import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connectDB } from "../../../../../../config/db";
import { getAuthenticatedParent } from "../../../../../../lib/auth/parent-auth";
import { CounsellingRequest } from "../../../../../../models/counselling-request.model";
import { generateJitsiToken } from "../../../../../../lib/jitsi/token";
import { JitsiMeetRoom } from "../../../../../../components/jitsi/jitsi-meet-room";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { Parent } from "../../../../../../models/parent.model";

export const revalidate = 0;

export const metadata = {
  title: "Counselling Session | TrueLern Parent",
  description: "Private counselling session.",
};

export default async function ParentCounsellingRoomPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  await connectDB();
  const parentAuth = await getAuthenticatedParent();
  if (!parentAuth || !parentAuth.parent) {
    redirect("/login");
  }
  const parent = parentAuth.parent;
  const { roomId } = await params;

  const request = await CounsellingRequest.findOne({ jitsiRoomId: roomId });

  if (!request) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center">
        <h1 className="text-xl font-bold text-slate-900">Session Not Found</h1>
        <p className="text-sm text-slate-500 mt-2">The requested counselling session does not exist.</p>
        <Link
          href="/parent/counselling"
          className="inline-flex items-center gap-2 mt-6 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Requests</span>
        </Link>
      </div>
    );
  }

  // ONLY the requesting parent can enter
  if (request.parent.toString() !== parent._id.toString()) {
    return (
      <div className="max-w-md mx-auto py-16 text-center bg-white border border-red-200 rounded-3xl p-8 shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h1 className="text-lg font-bold text-slate-900">Access Denied</h1>
        <p className="text-xs text-slate-500 mt-2">
          You are not authorized to join this private session.
        </p>
        <Link
          href="/parent/counselling"
          className="inline-flex items-center gap-2 mt-6 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Dashboard</span>
        </Link>
      </div>
    );
  }

  // Token Generation - Parent is NOT a moderator, Recording is strictly disabled
  const token = generateJitsiToken({
    roomName: request.jitsiRoomId,
    userName: `${parent.firstName} ${parent.lastName}`,
    userEmail: parent.email,
    userAvatar: "",
    isModerator: false,
    recordingEnabled: false,
  });

  return (
    <div className="h-[calc(100vh-64px)] w-full relative">
      <JitsiMeetRoom
        roomName={request.jitsiRoomId}
        jwt={token}
        userInfo={{
          displayName: `${parent.firstName} ${parent.lastName}`,
          email: parent.email,
        }}
        configOverwrite={{
          startWithAudioMuted: false,
          startWithVideoMuted: false,
          disableModeratorIndicator: true,
          toolbarButtons: [
            "microphone", "camera", "closedcaptions", "desktop", "fullscreen",
            "fodeviceselection", "hangup", "profile", "chat",
            "videoquality", "filmstrip", "tileview", "shortcuts",
            "toggle-camera"
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
