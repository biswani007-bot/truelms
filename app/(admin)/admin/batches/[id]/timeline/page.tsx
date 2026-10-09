/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import Link from "next/link";
import { connectDB } from "../../../../../../config/db";
import { batchTimelineRepository } from "../../../../../../repositories/batch-timeline.repository";

interface Props { params: Promise<{ id: string }>; }
export const revalidate = 0;

const eventColor: Record<string, string> = {
  "created": "bg-indigo-500",
  "student-assigned": "bg-emerald-500",
  "student-removed": "bg-red-500",
  "student-transferred": "bg-amber-500",
  "student-swapped": "bg-cyan-500",
  "teacher-assigned": "bg-blue-500",
  "teacher-removed": "bg-orange-500",
  "waiting-list-added": "bg-purple-500",
  "waiting-list-promoted": "bg-teal-500",
  "waiting-list-cancelled": "bg-rose-500",
  "capacity-changed": "bg-yellow-500",
  "status-changed": "bg-slate-400",
  "recommendation-generated": "bg-amber-400",
  "rule-applied": "bg-violet-500",
};

export default async function BatchTimelinePage({ params }: Props) {
  await connectDB();
  const { id } = await params;

  const timeline = await batchTimelineRepository.findMany(
    { batch: id },
    { populate: ["performedBy"] }
  );

  // Sort descending by timestamp
  const sorted = (timeline as any[]).sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Audit Timeline</h1>
          <p className="text-sm text-gray-500 mt-1">{sorted.length} events recorded for this batch.</p>
        </div>
        <Link href={`/admin/batches/${id}`} className="px-4 py-2 border border-gray-200 text-gray-400 hover:bg-white rounded-lg text-sm transition">← Back</Link>
      </div>

      <div className="relative flex flex-col gap-0 border-l-2 border-gray-200 ml-4 pl-8">
        {sorted.map((item, idx) => {
          const dotColor = eventColor[item.event] ?? "bg-slate-500";
          const performer = item.performedBy as any;
          return (
            <div key={item._id?.toString()} className={`relative pb-8 ${idx === sorted.length - 1 ? "pb-0" : ""}`}>
              <div className={`absolute -left-[42px] top-1 w-4 h-4 rounded-full border-2 border-gray-100 ${dotColor}`} />
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                  <span className="text-[9px] uppercase font-extrabold tracking-wider text-gray-400 capitalize">
                    {item.event.replace(/-/g, " ")}
                  </span>
                  <span className="text-[9px] text-gray-500">{new Date(item.timestamp).toLocaleString()}</span>
                </div>
                <p className="text-sm text-gray-900 font-medium">{item.description}</p>
                {performer?.email && (
                  <p className="text-xs text-gray-400">By: {performer.email}</p>
                )}
              </div>
            </div>
          );
        })}
        {sorted.length === 0 && (
          <div className="text-gray-400 text-sm py-10">No timeline events recorded.</div>
        )}
      </div>
    </div>
  );
}
