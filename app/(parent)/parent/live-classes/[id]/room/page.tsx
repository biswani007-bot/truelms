"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ShieldAlert, Loader2, BookOpen, Users } from "lucide-react";
import { JitsiMeetRoom } from "@/components/jitsi/jitsi-meet-room";

interface TokenData {
  token: string;
  roomName: string;
  jitsiDomain: string;
  serverUrl: string;
  isModerator: boolean;
  expiresAt: number;
  studentId?: string;
  liveClass: {
    id: string;
    title: string;
    scheduledAt: string;
    duration: number;
    status: string;
  };
}

export default function ParentLiveClassroomRoomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [classId, setClassId] = useState<string | null>(null);
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Resolve params
  useEffect(() => {
    params.then(({ id }) => setClassId(id));
  }, [params]);

  // Fetch Jitsi token once classId is known
  useEffect(() => {
    if (!classId) return;

    const fetchToken = async () => {
      try {
        const res = await fetch(`/api/live-classes/${classId}/token`, {
          method: "POST",
          credentials: "include",
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || "Failed to obtain live class access token");
        }
        setTokenData(json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to access live classroom");
      } finally {
        setLoading(false);
      }
    };

    fetchToken();
  }, [classId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
        <p className="text-sm font-semibold text-slate-600">Verifying access and joining classroom...</p>
        <p className="text-xs text-slate-400">Confirming your child&apos;s enrollment</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto py-16 text-center bg-white border border-red-200 rounded-3xl p-8 shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h1 className="text-lg font-bold text-slate-900">Access Denied</h1>
        <p className="text-xs text-slate-500 mt-2 leading-relaxed">{error}</p>
        <Link
          href="/parent/live-classes"
          className="inline-flex items-center gap-2 mt-6 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Live Classes</span>
        </Link>
      </div>
    );
  }

  if (!tokenData) return null;

  const classTitle = tokenData.liveClass?.title || "Live Cohort Lecture";

  return (
    <div className="flex flex-col gap-3.5 max-w-[1600px] mx-auto pb-6">
      {/* Parent Classroom Header */}
      <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800/80 rounded-2xl px-5 py-3 flex flex-wrap items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-4">
          <Link
            href="/parent/live-classes"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/90 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition border border-slate-700/60 shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Leave Class</span>
          </Link>
          <div>
            <div className="flex items-center gap-2 text-rose-400 font-bold text-xs tracking-wider uppercase">
              <span className="inline-block w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span>TrueLern Parent Observation</span>
            </div>
            <h1 className="text-sm md:text-base font-extrabold text-white tracking-tight">{classTitle}</h1>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-slate-800/60 rounded-xl text-slate-300 border border-slate-700/40">
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            <span className="font-semibold">Viewing as Guardian</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-950/80 rounded-xl text-indigo-300 border border-indigo-800/50">
            <Users className="w-3.5 h-3.5 text-indigo-400" />
            <span className="font-semibold">Parent Access Verified</span>
          </div>
        </div>
      </div>

      {/* Embedded Jitsi Video Room */}
      <JitsiMeetRoom
        roomName={tokenData.roomName}
        jwtToken={tokenData.token}
        jitsiDomain={tokenData.jitsiDomain}
        serverUrl={tokenData.serverUrl}
        isModerator={false}
        userName="Guardian"
        classTitle={classTitle}
        liveClassId={classId || undefined}
        studentId={tokenData.studentId}
        onConferenceLeft="/parent/live-classes"
      />
    </div>
  );
}
