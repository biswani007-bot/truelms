"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParentChild } from "@/components/parent/parent-child-context";
import { Video, Calendar, Clock, User, Radio, CheckCircle2, BookOpen } from "lucide-react";

export default function ParentLiveClassesPage() {
  const { selectedChild } = useParentChild();
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const childId = selectedChild?.studentId || (selectedChild as any)?._id;

  useEffect(() => {
    if (childId) {
      setLoading(true);
      fetch(`/api/parent/children/${childId}/schedule`, { credentials: "include" })
        .then((res) => res.json())
        .then((json) => setClasses(json.data || []))
        .finally(() => setLoading(false));
    }
  }, [childId]);

  if (loading) {
    return <div className="h-64 bg-slate-200/60 rounded-3xl animate-pulse" />;
  }

  const now = new Date();
  const upcoming = classes.filter((lc) => {
    const start = lc.startAt ? new Date(lc.startAt) : null;
    return start && start >= new Date(now.getTime() - 60 * 60 * 1000); // include classes started up to 1h ago
  });
  const past = classes.filter((lc) => {
    const start = lc.startAt ? new Date(lc.startAt) : null;
    return !start || start < new Date(now.getTime() - 60 * 60 * 1000);
  });

  const renderStatusBadge = (lc: any) => {
    const status = lc.effectiveStatus || lc.status;
    if (status === "attended") {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase border border-emerald-300 bg-emerald-50 text-emerald-700 shadow-sm">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          Attended {lc.attendance?.durationAttended ? `(${lc.attendance.durationAttended}m)` : ""}
        </span>
      );
    }
    if (status === "missed") {
      return (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase border border-amber-300 bg-amber-50 text-amber-700">
          Missed
        </span>
      );
    }
    if (status === "live") {
      return (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase border border-rose-300 bg-rose-50 text-rose-700 animate-pulse">
          Live Now
        </span>
      );
    }
    if (status === "starting-soon") {
      return (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase border border-indigo-300 bg-indigo-50 text-indigo-700">
          Starting Soon
        </span>
      );
    }
    if (status === "cancelled") {
      return (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase border border-slate-300 bg-slate-100 text-slate-500 line-through">
          Cancelled
        </span>
      );
    }
    return (
      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase border border-slate-200 bg-slate-50 text-slate-600">
        Scheduled
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Live Classroom Schedule</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Real-time lecture timetable, scheduled cohort sessions, and faculty for {selectedChild?.firstName}.
        </p>
      </div>

      {/* Upcoming / Active Classes */}
      {upcoming.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
            <Radio className="w-4 h-4 text-rose-500 animate-pulse" />
            Upcoming &amp; Active Sessions
          </h2>
          {upcoming.map((lc: any) => {
            const canJoin = ["scheduled", "live"].includes(lc.status);

            return (
              <div key={lc.id} className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                      <Video className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        {renderStatusBadge(lc)}
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 mt-0.5">{lc.title}</h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">{lc.course}</p>
                      <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-500 font-medium">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {new Date(lc.startAt).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {new Date(lc.startAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-3">
                    <div className="text-right text-xs">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Faculty</span>
                      <span className="text-xs font-bold text-slate-700 flex items-center justify-end gap-1 mt-0.5">
                        <User className="w-3 h-3 text-slate-400" />
                        {lc.teacher || "N/A"}
                      </span>
                    </div>
                    {canJoin && (
                      <Link
                        href={`/parent/live-classes/${lc.classId}/room`}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                      >
                        <Video className="w-3.5 h-3.5" />
                        Join Live Class
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Past Classes */}
      {past.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Past Sessions</h2>
          {past.map((lc: any) => (
            <div key={lc.id} className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm opacity-75">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center shrink-0">
                    <Video className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      {renderStatusBadge(lc)}
                    </div>
                    <h3 className="text-sm font-bold text-slate-700 mt-0.5">{lc.title}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{lc.course}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-400 font-medium">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(lc.startAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-3 self-end md:self-auto">
                  <Link
                    href={`/parent/live-classes/${lc.classId}/summary`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition shadow-sm"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    View Class Summary
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {classes.length === 0 && (
        <div className="py-12 text-center text-xs text-slate-400 bg-white rounded-3xl border border-slate-200">
          No live classes scheduled for this cohort.
        </div>
      )}
    </div>
  );
}
