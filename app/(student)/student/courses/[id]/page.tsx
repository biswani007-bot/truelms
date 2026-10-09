"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  PlayCircle,
  FileText,
  CheckCircle2,
  Clock,
  Download,
  AlertCircle,
  Layers,
} from "lucide-react";

export default function StudentCoursePlayer() {
  const params = useParams() || {};
  const id = (params.id || "") as string;

  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<any>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [activeLesson, setActiveLesson] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    Promise.all([
      fetch(`/api/courses/${id}`).then((res) => res.json()),
      fetch(`/api/courses/${id}/curriculum`).then((res) => res.json()),
    ])
      .then(([courseRes, curriculumRes]) => {
        if (courseRes?.data) {
          setCourse(courseRes.data);
        } else {
          setError("Course not found or unavailable.");
        }

        if (curriculumRes?.data && Array.isArray(curriculumRes.data)) {
          setModules(curriculumRes.data);
          if (curriculumRes.data.length > 0 && curriculumRes.data[0].lessons?.length > 0) {
            setActiveLesson(curriculumRes.data[0].lessons[0]);
          }
        } else {
          setModules([]);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load curriculum:", err);
        setError("Unable to load course curriculum.");
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-slate-500 text-sm">
        <div className="animate-spin w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full mr-3" />
        Loading course curriculum...
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="max-w-xl mx-auto text-center py-16">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-2" />
        <h2 className="text-lg font-bold text-slate-900">{error || "Course Not Found"}</h2>
        <Link
          href="/student/courses"
          className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to My Courses
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200">
        <div>
          <Link
            href="/student/courses"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 mb-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> All Courses
          </Link>
          <h1 className="text-2xl font-extrabold text-slate-900">{course.name || course.title}</h1>
          <p className="text-xs text-slate-500 font-mono mt-0.5">Code: {course.code || "CS"}</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100">
            Enrolled
          </span>
        </div>
      </div>

      {/* Curriculum & Lesson Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Lesson Content / Details */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
            {activeLesson ? (
              <div>
                <div className="flex items-center justify-between gap-2 pb-4 border-b border-slate-100">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                      Active Lesson
                    </span>
                    <h2 className="text-xl font-extrabold text-slate-900 mt-2">
                      {activeLesson.name || activeLesson.title}
                    </h2>
                  </div>
                  {activeLesson.durationMinutes && (
                    <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {activeLesson.durationMinutes} mins
                    </span>
                  )}
                </div>

                <div className="mt-6 text-sm text-slate-600 leading-relaxed space-y-4">
                  <p>{activeLesson.description || "Review the lesson materials and complete practical exercises."}</p>

                  {/* Topics List */}
                  {activeLesson.topics && activeLesson.topics.length > 0 && (
                    <div className="mt-6">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                        Key Lesson Topics
                      </h4>
                      <ul className="space-y-2">
                        {activeLesson.topics.map((t: any) => (
                          <li
                            key={t._id?.toString() || t.name}
                            className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs font-medium text-slate-700"
                          >
                            <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold text-slate-900">{t.name}</span>
                              {t.description && <p className="text-slate-500 mt-0.5">{t.description}</p>}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Resource Download if URL exists */}
                  {activeLesson.resourceUrl && (
                    <div className="mt-6 p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-indigo-600" />
                        <div>
                          <p className="text-xs font-bold text-slate-900">Supplementary Material</p>
                          <p className="text-[11px] text-slate-500">Download lesson resources and notes.</p>
                        </div>
                      </div>
                      <a
                        href={activeLesson.resourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">Select a lesson from the curriculum</p>
                <p className="text-xs text-slate-400 mt-1">Click any lesson in the syllabus to view its details.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Curriculum Syllabus Tree */}
        <div className="flex flex-col gap-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>Curriculum Syllabus</span>
            </h3>

            {modules.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">
                No published modules available for this course yet.
              </p>
            ) : (
              <div className="space-y-4">
                {modules.map((mod, modIdx) => (
                  <div key={mod._id?.toString() || modIdx} className="space-y-2">
                    <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5 text-slate-700">
                      <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center text-[10px]">
                        {modIdx + 1}
                      </span>
                      <span>{mod.name || `Module ${modIdx + 1}`}</span>
                    </div>

                    <div className="pl-6 space-y-1.5">
                      {mod.lessons && mod.lessons.length > 0 ? (
                        mod.lessons.map((les: any, lesIdx: number) => {
                          const isActive = activeLesson?._id === les._id;
                          return (
                            <button
                              key={les._id?.toString() || lesIdx}
                              onClick={() => setActiveLesson(les)}
                              className={`w-full text-left p-2.5 rounded-xl text-xs font-medium transition flex items-center justify-between gap-2 ${
                                isActive
                                  ? "bg-indigo-600 text-white font-bold shadow-sm shadow-indigo-100"
                                  : "hover:bg-slate-50 text-slate-700"
                              }`}
                            >
                              <span className="truncate">{les.name || `Lesson ${lesIdx + 1}`}</span>
                              <PlayCircle
                                className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-white" : "text-slate-400"}`}
                              />
                            </button>
                          );
                        })
                      ) : (
                        <p className="text-[11px] text-slate-400 italic">No lessons in this module.</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
