/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { cohortRepository } from "../../../../../repositories/cohort.repository";
import { cohortCalendarRepository } from "../../../../../repositories/cohort-calendar.repository";
import { cohortTimelineRepository } from "../../../../../repositories/cohort-timeline.repository";
import { connectDB } from "../../../../../config/db";
import Link from "next/link";

interface CohortDetailsPageProps {
  params: Promise<{ id: string }>;
}

export const revalidate = 0; // Fresh details each time

export default async function CohortDetailsPage({ params }: CohortDetailsPageProps) {
  await connectDB();
  const { id } = await params;

  const cohort = await cohortRepository.findById(id, { populate: ["course", "academicSession", "primaryInstructor"] });
  if (!cohort) {
    return (
      <div className="py-20 text-center text-gray-500">
        Cohort profile not found. <Link href="/admin/cohorts" className="text-indigo-600 underline">Back to Listing</Link>
      </div>
    );
  }

  // Load sub-documents
  const calendar = await cohortCalendarRepository.findOne({ cohort: id });
  const timeline = await cohortTimelineRepository.findMany({ cohort: id }, { sort: "timestamp", order: "desc" } as any);

  const primaryTeacher = cohort.primaryInstructor as unknown as { firstName: string; lastName: string; designation: string };
  const courseRef = cohort.course as unknown as { name: string; courseCode: string };

  return (
    <div className="flex flex-col gap-10">
      {/* Header */}
      <div className="flex justify-between items-start border-b border-gray-200 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-gray-900">
              {cohort.cohortName}
            </h1>
            <span className="px-2.5 py-1 rounded bg-indigo-50 text-indigo-600 border border-indigo-200 text-xs font-bold uppercase tracking-wider">
              {cohort.cohortCode}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">Course: {courseRef?.name} &bull; Delivery: {cohort.deliveryMode}</p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/admin/cohorts/${id}/edit`}
            className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg text-sm transition"
          >
            Edit
          </Link>
          <Link
            href="/admin/cohorts"
            className="px-4 py-2 border border-gray-200 text-gray-600 hover:bg-white hover:text-gray-900 rounded-lg text-sm transition"
          >
            Back
          </Link>
        </div>
      </div>

      {/* Grid of specifications and calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Core details and settings flags */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          {/* Details */}
          <div className="bg-gray-50 border border-gray-200 p-6 rounded-2xl">
            <h2 className="text-base font-bold text-gray-900 mb-4">Program Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="block text-xs font-semibold text-gray-500">Primary Instructor</span>
                <span className="text-gray-900 font-medium mt-0.5 block">{primaryTeacher ? `${primaryTeacher.firstName} ${primaryTeacher.lastName} (${primaryTeacher.designation})` : "TBD"}</span>
              </div>
              <div>
                <span className="block text-xs font-semibold text-gray-500">Academic Session</span>
                <span className="text-gray-900 font-medium mt-0.5 block">{(cohort.academicSession as any)?.name}</span>
              </div>
              <div>
                <span className="block text-xs font-semibold text-gray-500">Orientation Date</span>
                <span className="text-gray-900 font-medium mt-0.5 block">{cohort.orientationDate ? new Date(cohort.orientationDate).toLocaleDateString() : "TBD"}</span>
              </div>
              <div>
                <span className="block text-xs font-semibold text-gray-500">Seat Capacity limits</span>
                <span className="text-gray-900 font-medium mt-0.5 block">{cohort.currentEnrollment} / {cohort.maxCapacity} Seats</span>
              </div>
            </div>
          </div>

          {/* Academic Settings flags */}
          <div className="bg-gray-50 border border-gray-200 p-6 rounded-2xl">
            <h2 className="text-base font-bold text-gray-900 mb-4">Academic Configurations</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
              {[
                { label: "Recording Enabled", val: cohort.settings.recordingEnabled },
                { label: "Attendance Required", val: cohort.settings.attendanceRequired },
                { label: "Certificate Enabled", val: cohort.settings.certificateEnabled },
                { label: "Assignments Enabled", val: cohort.settings.assignmentEnabled },
                { label: "Assessments Enabled", val: cohort.settings.assessmentEnabled },
                { label: "Discussion Enabled", val: cohort.settings.discussionEnabled },
              ].map((flag, idx) => (
                <div key={idx} className="p-3 bg-white border border-slate-850 rounded-lg flex justify-between items-center">
                  <span className="font-semibold text-gray-500">{flag.label}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase ${
                    flag.val ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-red-950 text-red-400 border border-red-500/20"
                  }`}>
                    {flag.val ? "Yes" : "No"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar: Calendars & Timelines */}
        <div className="flex flex-col gap-6">
          {/* Calendar orientations */}
          <div className="bg-gray-50 border border-gray-200 p-6 rounded-2xl">
            <h2 className="text-base font-bold text-gray-900 mb-4">Calendar Schedule</h2>
            <div className="flex flex-col gap-3">
              {calendar?.events.map((event: any, idx: number) => (
                <div key={idx} className="p-3 bg-white border border-slate-850 rounded-lg text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-white capitalize">{event.title}</span>
                    <span className="px-1.5 py-0.5 rounded text-[8px] font-extrabold bg-indigo-50 text-indigo-600">{event.type}</span>
                  </div>
                  <div className="text-gray-500 mt-1">{new Date(event.eventDate).toLocaleDateString()}</div>
                </div>
              ))}
              {(!calendar || calendar.events.length === 0) && (
                <div className="text-slate-550 text-xs py-4 text-center">No orientation classes mapped.</div>
              )}
            </div>
          </div>

          {/* Timeline audits */}
          <div className="bg-gray-50 border border-gray-200 p-6 rounded-2xl">
            <h2 className="text-base font-bold text-gray-900 mb-4">Audited Timeline</h2>
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
