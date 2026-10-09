"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, BookOpen, FileText, PlaySquare, Link as LinkIcon, Video, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function LearnerCurriculumViewer() {
  const searchParams = useSearchParams();
  const courseId = searchParams.get("courseId");
  const [curriculum, setCurriculum] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLesson, setSelectedLesson] = useState<any>(null);

  useEffect(() => {
    if (courseId) {
      fetch(`/api/courses/${courseId}/curriculum`, { credentials: "include" })
        .then(res => res.json())
        .then(data => {
          setCurriculum(data.data || []);
          
          // Auto-select first lesson
          if (data.data?.length > 0 && data.data[0].lessons?.length > 0) {
            setSelectedLesson(data.data[0].lessons[0]);
          }
        })
        .finally(() => setLoading(false));
    }
  }, [courseId]);

  if (loading) {
    return <div className="p-12 text-center text-slate-500">Loading curriculum...</div>;
  }

  if (!curriculum.length) {
    return (
      <div className="p-12 text-center text-slate-500">
        <h2 className="text-xl font-bold text-slate-900 mb-2">No Curriculum Available</h2>
        <p>This course does not have any modules or lessons published yet.</p>
        <Link href="/parent/academics" className="mt-4 inline-block text-indigo-600 font-bold">Back to Academics</Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto h-[calc(100vh-100px)]">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-slate-200 pb-4 shrink-0">
        <Link href="/parent/academics" className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Course Curriculum</h1>
          <p className="text-xs text-slate-500">Select a lesson to view its content.</p>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden bg-white border border-slate-200 rounded-2xl shadow-sm">
        {/* Sidebar: Module Tree */}
        <div className="w-80 border-r border-slate-200 overflow-y-auto bg-slate-50/50">
          {curriculum.map((mod, modIdx) => (
            <div key={mod._id || modIdx} className="border-b border-slate-100 last:border-b-0">
              <div className="px-4 py-3 bg-white">
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Module {mod.order}</span>
                <h3 className="font-bold text-slate-900 text-sm">{mod.name}</h3>
              </div>
              <div className="flex flex-col">
                {mod.lessons?.map((les: any, lesIdx: number) => {
                  const isSelected = selectedLesson?._id === les._id;
                  let Icon = FileText;
                  if (les.contentType === "video") Icon = PlaySquare;
                  if (les.contentType === "document") Icon = FileText;
                  if (les.contentType === "link") Icon = LinkIcon;

                  return (
                    <button
                      key={les._id || lesIdx}
                      onClick={() => setSelectedLesson(les)}
                      className={`flex items-start gap-3 px-4 py-3 text-left transition border-l-2 ${
                        isSelected 
                          ? "bg-indigo-50 border-indigo-600" 
                          : "border-transparent hover:bg-slate-100"
                      }`}
                    >
                      <div className={`mt-0.5 shrink-0 ${isSelected ? "text-indigo-600" : "text-slate-400"}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className={`text-sm font-semibold ${isSelected ? "text-indigo-900" : "text-slate-700"}`}>
                          {les.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-semibold text-slate-400 capitalize">{les.contentType || "text"}</span>
                          <span className="text-[10px] text-slate-300">•</span>
                          <span className="text-[10px] font-semibold text-slate-400">{les.durationMinutes} mins</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
                {!mod.lessons?.length && (
                  <div className="px-4 py-3 text-xs text-slate-400 italic">No lessons in this module.</div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto bg-white p-8">
          {selectedLesson ? (
            <div className="max-w-3xl mx-auto space-y-6">
              <div>
                <span className="inline-block px-2.5 py-1 rounded bg-indigo-50 text-indigo-600 text-[10px] font-bold uppercase tracking-wider mb-3">
                  {selectedLesson.contentType || "Text Content"}
                </span>
                <h1 className="text-3xl font-extrabold text-slate-900">{selectedLesson.name}</h1>
                {selectedLesson.description && (
                  <p className="text-sm text-slate-500 mt-2">{selectedLesson.description}</p>
                )}
              </div>

              <div className="pt-6 border-t border-slate-100">
                {selectedLesson.contentType === "video" && selectedLesson.resourceUrl ? (
                  <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-lg border border-slate-800">
                    <iframe
                      src={selectedLesson.resourceUrl.replace("watch?v=", "embed/")}
                      className="w-full h-full"
                      allowFullScreen
                      title={selectedLesson.name}
                    />
                  </div>
                ) : selectedLesson.contentType === "document" && selectedLesson.resourceUrl ? (
                  <div className="h-[600px] border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <iframe
                      src={selectedLesson.resourceUrl}
                      className="w-full h-full"
                      title={selectedLesson.name}
                    />
                  </div>
                ) : selectedLesson.contentType === "image" && selectedLesson.resourceUrl ? (
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm flex items-center justify-center p-4 bg-slate-50">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={selectedLesson.resourceUrl}
                      alt={selectedLesson.name}
                      className="max-w-full max-h-[600px] object-contain rounded"
                    />
                  </div>
                ) : selectedLesson.contentType === "link" && selectedLesson.resourceUrl ? (
                  <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl flex flex-col items-center justify-center text-center gap-4">
                    <LinkIcon className="w-12 h-12 text-slate-400" />
                    <div>
                      <h3 className="font-bold text-slate-900">External Resource</h3>
                      <p className="text-xs text-slate-500 mt-1">This lesson requires visiting an external link.</p>
                    </div>
                    <a
                      href={selectedLesson.resourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold transition shadow-sm"
                    >
                      Open Resource
                    </a>
                  </div>
                ) : (
                  <div className="prose prose-slate max-w-none">
                    {selectedLesson.content ? (
                      <div dangerouslySetInnerHTML={{ __html: selectedLesson.content.replace(/\n/g, "<br/>") }} />
                    ) : (
                      <p className="text-slate-400 italic">No content available for this lesson.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <BookOpen className="w-16 h-16 mb-4 opacity-20" />
              <p className="font-medium text-slate-500">Select a lesson to view its content.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
