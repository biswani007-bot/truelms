"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, ShieldAlert, Loader2, BookOpen, Users } from "lucide-react";
import { JitsiMeetRoom } from "@/components/jitsi/jitsi-meet-room";

interface TokenData {
  token: string;
  roomName: string;
  jitsiDomain: string;
  serverUrl: string;
  isModerator: boolean;
  expiresAt: number;
  liveClass: {
    id: string;
    title: string;
    scheduledAt: string;
    duration: number;
    status: string;
  };
}

function DemoJoinContent() {
  const searchParams = useSearchParams();
  const demoId = searchParams.get("demoId") || searchParams.get("leadId");
  const joinAs = searchParams.get("joinAs") || "parent"; // 'child' or 'parent'
  
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!demoId) {
      setError("No Demo ID provided");
      setLoading(false);
      return;
    }

    const fetchToken = async () => {
      try {
        const endpoint = joinAs === "child" 
          ? `/api/parent/demo/${demoId}/child-token` 
          : `/api/parent/demo/${demoId}/token`;
          
        const res = await fetch(endpoint, {
          method: "POST",
          credentials: "include",
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || "Failed to obtain demo class access token");
        }
        setTokenData(json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to access demo classroom");
      } finally {
        setLoading(false);
      }
    };

    fetchToken();
  }, [demoId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        <p className="text-sm font-semibold text-slate-600">Verifying demo schedule and joining room...</p>
        <p className="text-xs text-slate-400">Setting up your private session</p>
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
          href="/parent/dashboard"
          className="inline-flex items-center gap-2 mt-6 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Dashboard</span>
        </Link>
      </div>
    );
  }

  if (!tokenData) return null;

  const classTitle = tokenData.liveClass?.title || "TrueLern Demo Session";

  return (
    <div className="flex flex-col gap-3.5 max-w-[1600px] mx-auto pb-6">
      <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800/80 rounded-2xl px-5 py-3 flex flex-wrap items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-4">
          <Link
            href="/parent/dashboard"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/90 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition border border-slate-700/60 shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Leave Demo</span>
          </Link>
          <div>
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs tracking-wider uppercase">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>TrueLern Demo Session</span>
            </div>
            <h1 className="text-sm md:text-base font-extrabold text-white tracking-tight">{classTitle}</h1>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-slate-800/60 rounded-xl text-slate-300 border border-slate-700/40">
            <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-semibold">{joinAs === 'child' ? "Child Participant" : "Demo Participant"}</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-950/80 rounded-xl text-emerald-300 border border-emerald-800/50">
            <Users className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-semibold">{joinAs === 'child' ? "Child Attendance Tracked" : "Parent Access Verified"}</span>
          </div>
        </div>
      </div>

      <JitsiMeetRoom
        roomName={tokenData.roomName}
        jwtToken={tokenData.token}
        jitsiDomain={tokenData.jitsiDomain}
        serverUrl={tokenData.serverUrl}
        isModerator={false}
        userName={joinAs === 'child' ? "Student (Demo Participant)" : "Guardian (Observation)"}
        classTitle={classTitle}
        onConferenceLeft="/parent/dashboard"
      />
    </div>
  );
}

export default function DemoJoinPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-400" /></div>}>
      <DemoJoinContent />
    </Suspense>
  );
}
