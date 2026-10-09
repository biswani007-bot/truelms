"use client";

import React, { useEffect, useState } from "react";
import { useParentChild } from "@/components/parent/parent-child-context";
import { PlaySquare, Calendar, Clock, User, Play, X } from "lucide-react";

export default function ParentRevisionPage() {
  const { selectedChild } = useParentChild();
  const [recordings, setRecordings] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activePlayback, setActivePlayback] = useState<any>(null);

  useEffect(() => {
    if (selectedChild?.studentId) {
      setLoading(true);
      fetch(`/api/parent/children/${selectedChild.studentId}/recordings`, { credentials: "include" })
        .then((res) => res.json())
        .then((json) => setRecordings(json.data || []))
        .finally(() => setLoading(false));
    }
  }, [selectedChild?.studentId]);

  if (loading) {
    return <div className="h-64 bg-slate-200/60 rounded-3xl animate-pulse" />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Lecture Recordings & Revision</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Archive of completed live class video recordings for revision and learning review for {selectedChild?.firstName}.
        </p>
      </div>

      {/* Video Modal / Player */}
      {activePlayback && (
        <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-800/40">
                Playing Recording
              </span>
              <h2 className="text-lg font-bold mt-1">{activePlayback.title}</h2>
              <p className="text-xs text-slate-400">{activePlayback.instructor} • {activePlayback.courseName}</p>
            </div>
            <button
              onClick={() => setActivePlayback(null)}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black border border-slate-800">
            <video
              src={activePlayback.streamUrl}
              controls
              autoPlay
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      )}

      {/* Recordings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {recordings.length > 0 ? (
          recordings.map((rec: any) => (
            <div key={rec.id} className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-start gap-4 mb-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <PlaySquare className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400">{rec.classCode}</span>
                    <h3 className="text-base font-bold text-slate-900 mt-0.5">{rec.title}</h3>
                    <p className="text-xs text-slate-500">{rec.courseName}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 py-3 border-y border-slate-100 font-medium">
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-400" /> {rec.instructor}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" /> {rec.durationMinutes} minutes
                  </span>
                </div>
              </div>

              <button
                onClick={() => setActivePlayback(rec)}
                className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm shadow-emerald-600/20"
              >
                <Play className="w-3.5 h-3.5 fill-current" /> Watch Lecture Revision
              </button>
            </div>
          ))
        ) : (
          <div className="col-span-2 py-12 text-center text-xs text-slate-400 bg-white rounded-3xl border border-slate-200">
            No video recordings available for this cohort.
          </div>
        )}
      </div>
    </div>
  );
}
