"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParentChild } from "@/components/parent/parent-child-context";
import { ArrowLeft, Clock, Calendar, CheckCircle2, ShieldAlert, Loader2, BookOpen, User, PlayCircle, FileText } from "lucide-react";

interface ClassSummaryData {
  classId: string;
  title: string;
  program?: string;
  module?: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  teacher?: string;
  status: string;
  attendanceStatus: string;
  joinAvailability: boolean;
}

export default function ParentClassSummaryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { selectedChild } = useParentChild();
  const [classId, setClassId] = useState<string | null>(null);
  const [summaryData, setSummaryData] = useState<ClassSummaryData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    params.then(({ id }) => setClassId(id));
  }, [params]);

  useEffect(() => {
    if (!classId || !selectedChild?.studentId) return;

    const fetchSummary = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/parent/children/${selectedChild.studentId}/classes/${classId}/summary`,
          { credentials: "include" }
        );
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || json.message || "Failed to load class summary");
        }
        setSummaryData(json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load class summary");
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [classId, selectedChild?.studentId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        <p className="text-sm font-semibold text-slate-600">Loading class summary...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto py-16 text-center bg-white border border-rose-200 rounded-3xl p-8 shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h1 className="text-lg font-bold text-slate-900">Summary Not Available</h1>
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

  if (!summaryData) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <Link
        href="/parent/live-classes"
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Schedule
      </Link>

      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        {/* Header Section */}
        <div className="bg-slate-900 text-white p-6 md:p-8 relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/20 backdrop-blur-sm rounded-lg text-[10px] font-bold uppercase tracking-wider">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Completed Class
              </span>
              {summaryData.program && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-500/30 backdrop-blur-sm rounded-lg text-[10px] font-bold uppercase tracking-wider text-indigo-100">
                  <BookOpen className="w-3.5 h-3.5" />
                  {summaryData.program}
                </span>
              )}
            </div>
            
            <h1 className="text-2xl md:text-3xl font-extrabold mb-2">{summaryData.title}</h1>
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-300 font-medium">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {new Date(summaryData.date).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                {summaryData.duration} minutes
              </span>
              {summaryData.teacher && (
                <span className="flex items-center gap-1.5">
                  <User className="w-4 h-4" />
                  {summaryData.teacher}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6 md:p-8 grid md:grid-cols-2 gap-8">
          
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
                <ShieldAlert className="w-4 h-4 text-indigo-600" />
                Attendance Status
              </h3>
              <div className={`p-4 rounded-2xl border flex items-center gap-3 ${
                summaryData.attendanceStatus === "present" || summaryData.attendanceStatus === "attended" 
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
                  : "bg-amber-50 border-amber-200 text-amber-800"
              }`}>
                {summaryData.attendanceStatus === "present" || summaryData.attendanceStatus === "attended" ? (
                  <CheckCircle2 className="w-6 h-6 shrink-0" />
                ) : (
                  <Clock className="w-6 h-6 shrink-0" />
                )}
                <div>
                  <p className="font-bold capitalize">{summaryData.attendanceStatus === "attended" ? "Present" : summaryData.attendanceStatus}</p>
                  <p className="text-xs opacity-80 mt-0.5">
                    {summaryData.attendanceStatus === "present" || summaryData.attendanceStatus === "attended" 
                      ? "Student was present for this session."
                      : "Student missed or was marked absent for this session."}
                  </p>
                </div>
              </div>
            </div>

            {summaryData.module && (
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  Topics Covered
                </h3>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{summaryData.module}</p>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
                <PlayCircle className="w-4 h-4 text-indigo-600" />
                Class Recording
              </h3>
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center mx-auto mb-3">
                  <PlayCircle className="w-6 h-6 text-slate-400" />
                </div>
                <h4 className="text-sm font-bold text-slate-700">Recording Unavailable</h4>
                <p className="text-xs text-slate-500 mt-1">This session's recording is currently processing or not available.</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
