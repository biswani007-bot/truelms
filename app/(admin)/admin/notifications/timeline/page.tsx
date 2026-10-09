/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import Link from "next/link";
import { notificationTimelineRepository } from "../../../../../repositories/notification-timeline.repository";
import { connectDB } from "../../../../../config/db";

export const revalidate = 0;

const TIMELINE_EVENT_COLORS: Record<string, string> = {
  queued: "bg-amber-500",
  sent: "bg-indigo-500",
  delivered: "bg-emerald-500",
  read: "bg-teal-500",
  failed: "bg-red-500",
  retried: "bg-blue-500",
  cancelled: "bg-slate-655",
};

export default async function TimelinePage() {
  await connectDB();

  const timeline = await notificationTimelineRepository.findMany(
    {},
    { sort: "timestamp", order: "desc" } as any
  );

  return (
    <div className="flex flex-col gap-10">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Notification Timeline</h1>
          <p className="text-sm text-gray-500 mt-1">
            Historic audit trail of all dispatch events.
          </p>
        </div>
        <Link
          href="/admin/notifications"
          className="px-4 py-2 border border-gray-200 text-gray-600 hover:bg-white hover:text-white rounded-lg text-sm transition"
        >
          ← Dashboard Home
        </Link>
      </div>

      {/* Feed */}
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
        <h2 className="text-base font-bold text-gray-900 mb-6">Trace Logs</h2>
        <div className="flex flex-col gap-0 border-l-2 border-gray-200 ml-3">
          {timeline.map((item) => (
            <div key={item._id?.toString()} className="relative flex gap-4 pb-8 last:pb-0">
              <div className={`absolute -left-[9px] top-0.5 w-4 h-4 rounded-full border-2 border-gray-100 ${TIMELINE_EVENT_COLORS[item.event] || "bg-slate-600"} flex-shrink-0`} />
              <div className="ml-6 flex flex-col gap-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-white capitalize">{item.event}</span>
                  <span className="text-[10px] text-gray-400 font-mono">
                    {new Date(item.timestamp).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-gray-500">{item.description}</p>
                <p className="text-[10px] text-slate-655 font-mono">
                  Ref: {item.referenceId?.toString()}
                </p>
              </div>
            </div>
          ))}
          {timeline.length === 0 && (
            <div className="ml-6 text-xs text-slate-550 py-4">No notification events tracked yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
