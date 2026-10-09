/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import Link from "next/link";
import { liveClassRepository } from "../../../../../repositories/live-class.repository";
import { liveClassResourceRepository } from "../../../../../repositories/live-class-resource.repository";
import { liveClassAnnouncementRepository } from "../../../../../repositories/live-class-announcement.repository";
import { liveClassRecordingRepository } from "../../../../../repositories/live-class-recording.repository";
import { liveClassTimelineRepository } from "../../../../../repositories/live-class-timeline.repository";
import { connectDB } from "../../../../../config/db";
import { EditLiveClassModal } from "../../../../../components/admin/edit-live-class-modal";
import { AnnouncementItem } from "../../../../../components/admin/announcement-item";
import { PostAnnouncementModal } from "../../../../../components/admin/post-announcement-modal";
import { DeleteLiveClassButton } from "../../../../../components/admin/delete-live-class-button";

interface LiveClassDetailPageProps {
  params: Promise<{ id: string }>;
}

export const revalidate = 0;

export default async function LiveClassDetailPage({ params }: LiveClassDetailPageProps) {
  await connectDB();
  const { id } = await params;

  const liveClass = await liveClassRepository.findById(id, {
    populate: ["batch", "course", "teacher", "assistantTeacher", "mentor"],
  });

  if (!liveClass) {
    return (
      <div className="py-20 text-center text-gray-500">
        Live class session profile not found. <Link href="/admin/live-classes" className="text-indigo-600 underline">Back</Link>
      </div>
    );
  }

  // Load sub-documents
  const resources = await liveClassResourceRepository.findMany({ liveClass: id });
  const announcements = await liveClassAnnouncementRepository.findMany({ liveClass: id }, { populate: ["sentBy"] });
  const recording = await liveClassRecordingRepository.findOne({ liveClass: id });
  const timeline = await liveClassTimelineRepository.findMany({ liveClass: id }, { sort: "timestamp", order: "desc" } as any);

  const teacherObj = liveClass.teacher as any;
  const assistantObj = liveClass.assistantTeacher as any;
  const courseObj = liveClass.course as any;
  const batchObj = liveClass.batch as any;

  return (
    <div className="flex flex-col gap-10">
      {/* Header */}
      <div className="flex justify-between items-start border-b border-gray-200 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-gray-900">{liveClass.classTitle}</h1>
            <span className="px-2.5 py-1 rounded bg-indigo-50 text-indigo-600 border border-indigo-200 text-xs font-bold uppercase tracking-wider">
              {liveClass.classCode}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">Course: {courseObj?.courseName || courseObj?.name || "Full Stack Software Engineering"} &bull; Batch: {batchObj?.batchName}</p>
        </div>
        <div className="flex gap-2">
          <DeleteLiveClassButton liveClassId={id} classTitle={liveClass.classTitle} />
          <EditLiveClassModal
            liveClassId={id}
            initialTitle={liveClass.classTitle}
            initialDuration={liveClass.duration || 60}
            initialRecordingUrl={recording?.recordingUrl || ""}
          />
          <Link
            href="/admin/live-classes"
            className="px-4 py-2 border border-gray-200 text-gray-600 hover:bg-white hover:text-white rounded-lg text-sm transition flex items-center h-[38px]"
          >
            Back to Listing
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Core Specs, Resources & Announcements */}
        <div className="flex flex-col gap-8 lg:col-span-2">
          {/* Specifications */}
          <div className="bg-gray-50 border border-gray-200 p-6 rounded-2xl">
            <h2 className="text-base font-bold text-gray-900 mb-4">Class Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div>
                <span className="block text-xs font-semibold text-gray-500">Instructor</span>
                <span className="text-gray-900 font-medium mt-0.5 block">{teacherObj ? `Prof. ${teacherObj.firstName} ${teacherObj.lastName}` : "TBD"}</span>
              </div>
              {assistantObj && (
                <div>
                  <span className="block text-xs font-semibold text-gray-500">Assistant Instructor</span>
                  <span className="text-gray-900 font-medium mt-0.5 block">{assistantObj.firstName} {assistantObj.lastName}</span>
                </div>
              )}
              <div>
                <span className="block text-xs font-semibold text-gray-500">Scheduled Date / Time</span>
                <span className="text-gray-900 font-medium mt-0.5 block">{new Date(liveClass.startDate).toLocaleString()}</span>
              </div>
              <div>
                <span className="block text-xs font-semibold text-gray-500">Duration</span>
                <span className="text-gray-900 font-medium mt-0.5 block">{liveClass.duration} Minutes</span>
              </div>
              <div>
                <span className="block text-xs font-semibold text-gray-500">Meeting Platform</span>
                <span className="text-indigo-600 font-medium mt-0.5 block">TrueLern Live Classroom (Self-Hosted Jitsi)</span>
              </div>
              <div>
                <span className="block text-xs font-semibold text-gray-500">Room Identifier</span>
                <span className="text-gray-900 font-medium mt-0.5 block font-mono">truelern-{liveClass._id?.toString()}</span>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-gray-200">
              <Link
                href={`/teacher/live-classes/${liveClass._id?.toString()}/room`}
                className="inline-flex justify-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition shadow-sm"
              >
                Launch TrueLern Studio
              </Link>
            </div>
          </div>

          {/* Attached Resources */}
          <div className="bg-gray-50 border border-gray-200 p-6 rounded-2xl">
            <h2 className="text-base font-bold text-gray-900 mb-4">Attached Worksheets & Presentations</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {resources.map((res) => (
                <div key={res._id?.toString()} className="p-4 bg-white border border-slate-850 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="px-1.5 py-0.5 rounded text-[8px] font-extrabold bg-indigo-50 text-indigo-600 border border-indigo-200 uppercase tracking-wider">
                      {res.type}
                    </span>
                    <h4 className="text-sm font-bold text-gray-900 mt-2">{res.title}</h4>
                  </div>
                  <a
                    href={res.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-indigo-600 hover:text-indigo-500 font-bold"
                  >
                    Open URL
                  </a>
                </div>
              ))}
              {resources.length === 0 && (
                <div className="col-span-full py-4 text-center text-slate-550 text-xs">No worksheets or PDF resources uploaded.</div>
              )}
            </div>
          </div>

          {/* Announcements */}
          <div className="bg-gray-50 border border-gray-200 p-6 rounded-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base font-bold text-gray-900">Class Announcements</h2>
              <PostAnnouncementModal liveClassId={id} />
            </div>
            <div className="flex flex-col gap-4">
              {announcements.map((ann) => (
                <AnnouncementItem key={ann._id?.toString()} announcement={{
                  _id: ann._id?.toString() || "",
                  title: ann.title,
                  content: ann.content,
                  isPinned: ann.isPinned || false,
                  sentBy: ann.sentBy ? { firstName: (ann.sentBy as any).firstName, lastName: (ann.sentBy as any).lastName } : null,
                  createdAt: (ann as any).createdAt || new Date().toISOString()
                }} />
              ))}
              {announcements.length === 0 && (
                <div className="py-4 text-center text-slate-550 text-xs">No notifications posted to students.</div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar: Recordings & Audit Timelines */}
        <div className="flex flex-col gap-8">
          {/* Recordings */}
          <div className="bg-gray-50 border border-gray-200 p-6 rounded-2xl">
            <h2 className="text-base font-bold text-gray-900 mb-4">Recorded Session URLs</h2>
            {recording ? (
              <div className="p-4 bg-white border border-slate-850 rounded-xl flex flex-col gap-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500">Status:</span>
                  <span className="text-emerald-600 font-extrabold capitalize">{recording.status}</span>
                </div>
                <a
                  href={recording.recordingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-indigo-600 hover:text-indigo-500 font-bold truncate block mt-2"
                >
                  {recording.recordingUrl}
                </a>
              </div>
            ) : (
              <div className="py-4 text-center text-slate-550 text-xs">Session has not been archived yet.</div>
            )}
          </div>

          {/* Timeline Audit Log */}
          <div className="bg-gray-50 border border-gray-200 p-6 rounded-2xl">
            <h2 className="text-base font-bold text-gray-900 mb-4">Session Timeline Audit</h2>
            <div className="flex flex-col gap-4 border-l border-gray-200 pl-4 ml-2">
              {timeline.map((item) => (
                <div key={item._id?.toString()} className="relative text-xs">
                  <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-indigo-500 border border-gray-100"></div>
                  <div className="font-bold text-gray-600 capitalize">{item.event}</div>
                  <div className="text-gray-500 mt-0.5">{item.description}</div>
                  <div className="text-slate-550 mt-1 text-[10px]">{new Date(item.timestamp).toLocaleDateString()}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
