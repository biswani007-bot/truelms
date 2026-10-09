"use client";

import React, { useEffect, useState } from "react";
import { useParentChild } from "@/components/parent/parent-child-context";
import { BookOpen, FileText, CheckCircle2, PlaySquare, MessageCircle, ChevronRight, Award } from "lucide-react";
import Link from "next/link";
import { formatDateSafe } from "@/lib/utils/date-formatter";

export default function ParentAcademicsHubPage() {
  const { selectedChild } = useParentChild();
  const [data, setData] = useState<any>({
    course: null,
    assignments: [],
    assessments: [],
    revisions: [],
    feedbacks: [],
  });
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (selectedChild?.studentId) {
      setLoading(true);
      Promise.all([
        fetch(`/api/parent/children/${selectedChild.studentId}/program`, { credentials: "include" }).then(r => r.json()),
        fetch(`/api/parent/children/${selectedChild.studentId}/assignments`, { credentials: "include" }).then(r => r.json()),
        fetch(`/api/parent/children/${selectedChild.studentId}/assessments`, { credentials: "include" }).then(r => r.json()),
        fetch(`/api/parent/children/${selectedChild.studentId}/recordings`, { credentials: "include" }).then(r => r.json()),
      ])
        .then(([prog, assigns, assess, recs]) => {
          const course = prog.data || null;
          const assignments = assigns.data || [];
          const assessments = assess.data || [];
          const revisions = recs.data || [];
          
          // Aggregate teacher feedback
          const feedbacks: any[] = [];
          
          assignments.forEach((a: any) => {
            if (a.submission?.feedback) {
              feedbacks.push({
                type: "Assignment",
                title: a.title,
                feedback: a.submission.feedback,
                date: a.submission.submittedAt,
                grade: a.submission.grade || `${a.submission.marksAwarded}/${a.totalMarks}`
              });
            }
          });

          assessments.forEach((a: any) => {
            if (a.feedback) {
              feedbacks.push({
                type: "Assessment",
                title: a.title,
                feedback: a.feedback,
                date: a.evaluatedAt,
                grade: `${a.percentage}%`
              });
            }
          });

          // Sort feedbacks by date descending
          feedbacks.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

          setData({
            course,
            assignments,
            assessments,
            revisions,
            feedbacks,
          });
        })
        .finally(() => setLoading(false));
    }
  }, [selectedChild?.studentId]);

  if (loading) {
    return <div className="h-64 bg-slate-200/60 rounded-3xl animate-pulse" />;
  }

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Academics Hub</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Overview of courses, assignments, assessments, and feedback for {selectedChild?.firstName}.
        </p>
      </div>

      {/* 1. Course / Program Overview */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600" /> Current Program
          </h2>
        </div>
        {data.course ? (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm flex items-start gap-5">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
              <BookOpen className="w-8 h-8" />
            </div>
            <div className="flex-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                {data.course.courseCode}
              </span>
              <h3 className="text-lg font-bold text-slate-900 mt-1">{data.course.courseName}</h3>
              <p className="text-xs text-slate-500 mt-1">{data.course.description}</p>
              
              <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-slate-100">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Duration</span>
                  <span className="text-sm font-bold text-slate-700">{data.course.duration && data.course.duration.trim() !== "undefined" ? data.course.duration.replace("undefined", "").trim() : "—"}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Difficulty</span>
                  <span className="text-sm font-bold text-slate-700 capitalize">{data.course.difficulty || "Standard"}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Progress</span>
                  <span className="text-sm font-bold text-slate-700">{data.course.progress}%</span>
                </div>
              </div>
              
              <div className="mt-5">
                <Link
                  href={`/parent/academics/curriculum?courseId=${data.course._id || data.course.courseId}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                >
                  View Full Curriculum <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-slate-400 bg-white rounded-3xl border border-slate-200">
            No active program found.
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* 2. Assignments Summary */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-600" /> Recent Assignments
            </h2>
            <Link href="/parent/assignments" className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center">
              View All <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="space-y-3">
            {data.assignments.slice(0, 3).length > 0 ? (
              data.assignments.slice(0, 3).map((a: any) => (
                <div key={a.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex justify-between items-center">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{a.title}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Status: <span className="font-semibold">{a.status || a.submission?.status || 'Pending'}</span></p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-700 block">{a.submission?.grade || '-'}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
                No assignments found.
              </div>
            )}
          </div>
        </section>

        {/* 3. Assessments Summary */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" /> Recent Assessments
            </h2>
            <Link href="/parent/assessments" className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center">
              View All <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="space-y-3">
            {data.assessments.slice(0, 3).length > 0 ? (
              data.assessments.slice(0, 3).map((a: any) => (
                <div key={a.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex justify-between items-center">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{a.title}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Type: <span className="font-semibold capitalize">{a.type}</span></p>
                  </div>
                  <div className="text-right">
                    <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-wider ${a.isPassed ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                      {a.isPassed ? 'Pass' : 'Fail'}
                    </span>
                    <span className="text-xs font-bold text-slate-700 block mt-1">{a.percentage}%</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
                No assessments found.
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* 4. Revisions Summary */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <PlaySquare className="w-5 h-5 text-blue-600" /> Recent Revisions
            </h2>
            <Link href="/parent/revision" className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center">
              View All <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="space-y-3">
            {data.revisions.slice(0, 3).length > 0 ? (
              data.revisions.slice(0, 3).map((r: any) => (
                <div key={r.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex justify-between items-center">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{r.title}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">{formatDateSafe(r.startDate || r.date)}</p>
                  </div>
                  <PlaySquare className="w-4 h-4 text-slate-400" />
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
                No revisions available.
              </div>
            )}
          </div>
        </section>

        {/* 5. Teacher Feedback */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-purple-600" /> Teacher Feedback
            </h2>
          </div>
          <div className="space-y-3">
            {data.feedbacks.length > 0 ? (
              data.feedbacks.slice(0, 3).map((f: any, i: number) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">{f.type}</span>
                      <h4 className="text-xs font-bold text-slate-900 mt-0.5">{f.title}</h4>
                    </div>
                    <span className="text-[10px] text-slate-400 font-semibold">{formatDateSafe(f.date)}</span>
                  </div>
                  <p className="text-sm text-slate-700 italic border-l-2 border-purple-200 pl-3 py-1">
                    "{f.feedback}"
                  </p>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
                No recent teacher feedback.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
