"use client";

import React, { useEffect, useState } from "react";
import { useParentChild } from "@/components/parent/parent-child-context";
import { CheckCircle2, Award, Calendar, Play, Clock } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ParentAssessmentsPage() {
  const { selectedChild } = useParentChild();
  const [assessments, setAssessments] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [launching, setLaunching] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (selectedChild?.studentId) {
      setLoading(true);
      fetch(`/api/parent/children/${selectedChild.studentId}/assessments`, { credentials: "include" })
        .then((res) => res.json())
        .then((json) => setAssessments(json.data || []))
        .finally(() => setLoading(false));
    }
  }, [selectedChild?.studentId]);

  const handleLaunch = async (assessmentId: string) => {
    if (!selectedChild?.studentId) return;
    setLaunching(assessmentId);
    try {
      const res = await fetch(`/api/parent/children/${selectedChild.studentId}/assessments/${assessmentId}/launch`, {
        method: "POST",
        credentials: "include"
      });
      const data = await res.json();
      if (res.ok && data.success) {
        window.location.href = data.data.redirectUrl;
      } else {
        alert(data.message || "Failed to launch assessment");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred launching the assessment");
    } finally {
      setLaunching(null);
    }
  };

  if (loading) {
    return <div className="h-64 bg-slate-200/60 rounded-3xl animate-pulse" />;
  }

  const pendingAssessments = assessments.filter(a => a.status === "pending");
  const evaluatedAssessments = assessments.filter(a => a.status !== "pending");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Assessments & Examination Results</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Official assessment marks, pass/fail status, and exam milestones for {selectedChild?.firstName}.
        </p>
      </div>

      {pendingAssessments.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-600" /> Pending Assessments
          </h2>
          {pendingAssessments.map((ass: any) => (
            <div key={ass.id} className="bg-indigo-50/50 rounded-3xl border border-indigo-100 p-6 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                    <Play className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{ass.title}</h3>
                    {ass.description && <p className="text-xs text-slate-600 mt-1">{ass.description}</p>}
                    <p className="text-xs text-slate-500 mt-2 font-medium">
                      Max Marks: {ass.maximumMarks} • Duration: {ass.duration} mins
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleLaunch(ass.assessmentId)}
                    disabled={launching === ass.assessmentId}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-sm disabled:opacity-50 transition"
                  >
                    {launching === ass.assessmentId ? "Launching..." : "Take Assessment"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Award className="w-5 h-5 text-emerald-600" /> Evaluated Results
        </h2>
        {evaluatedAssessments.length > 0 ? (
          evaluatedAssessments.map((ass: any) => (
            <div key={ass.id} className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{ass.title}</h3>
                    {ass.description && <p className="text-xs text-slate-500 mt-1">{ass.description}</p>}
                    <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> Evaluated: {new Date(ass.evaluatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xl font-extrabold text-slate-900">
                      {ass.scoreObtained} / {ass.maximumMarks}
                    </p>
                    <p className="text-xs text-slate-500 font-semibold">{ass.percentage}% Grade</p>
                  </div>
                  <span
                    className={`px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider ${
                      ass.isPassed
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-rose-50 text-rose-700 border border-rose-200"
                    }`}
                  >
                    {ass.isPassed ? "Passed" : "Needs Retake"}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="py-12 text-center text-xs text-slate-400 bg-white rounded-3xl border border-slate-200">
            No graded assessments recorded yet.
          </div>
        )}
      </div>
    </div>
  );
}
