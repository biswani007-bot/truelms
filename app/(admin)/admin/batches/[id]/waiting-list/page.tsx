/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import Link from "next/link";
import { connectDB } from "../../../../../../config/db";
import { batchWaitingListRepository } from "../../../../../../repositories/batch-waiting-list.repository";

interface Props { params: Promise<{ id: string }>; }
export const revalidate = 0;

const PriorityBadge = ({ priority }: { priority: string }) => {
  const colors: Record<string, string> = {
    urgent: "bg-red-950 text-red-400 border-red-500/20",
    high: "bg-amber-50 text-amber-700 border-amber-200",
    normal: "bg-white text-gray-500 border-gray-300",
  };
  return (
    <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded border ${colors[priority] ?? colors.normal}`}>
      {priority}
    </span>
  );
};

export default async function WaitingListPage({ params }: Props) {
  await connectDB();
  const { id } = await params;

  const entries = await batchWaitingListRepository.findMany(
    { batch: id },
    { populate: ["student", "enrollment"] }
  );

  const waiting = entries.filter((e) => e.status === "waiting");
  const priorityOrder: Record<string, number> = { urgent: 0, high: 1, normal: 2 };
  const sorted = waiting.sort((a, b) => {
    const pa = priorityOrder[a.priority] ?? 2;
    const pb = priorityOrder[b.priority] ?? 2;
    if (pa !== pb) return pa - pb;
    return a.position - b.position;
  });

  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Waiting List</h1>
          <p className="text-sm text-gray-500 mt-1">
            {sorted.length} student(s) queued. Auto-promotion activates when a seat is released (if enabled in Platform Settings).
          </p>
        </div>
        <Link href={`/admin/batches/${id}`} className="px-4 py-2 border border-gray-200 text-gray-400 hover:bg-white rounded-lg text-sm transition">← Back</Link>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Queue by Priority → Position</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-xs text-gray-400 uppercase tracking-wider">
                <th className="text-left px-6 py-3">Position</th>
                <th className="text-left px-6 py-3">Priority</th>
                <th className="text-left px-6 py-3">Student</th>
                <th className="text-left px-6 py-3">Enrollment Date</th>
                <th className="text-left px-6 py-3">Auto-Promote</th>
                <th className="text-left px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((entry) => {
                const student = entry.student as any;
                return (
                  <tr key={entry._id?.toString()} className="border-b border-slate-850 hover:bg-white transition">
                    <td className="px-6 py-3">
                      <span className="text-lg font-extrabold text-white">#{entry.position}</span>
                    </td>
                    <td className="px-6 py-3"><PriorityBadge priority={entry.priority} /></td>
                    <td className="px-6 py-3 font-medium text-white">{student?.firstName} {student?.lastName}</td>
                    <td className="px-6 py-3 text-gray-500 text-xs">{new Date(entry.enrollmentDate).toLocaleDateString()}</td>
                    <td className="px-6 py-3">
                      <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border ${entry.autoPromotionEnabled ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-white text-gray-400 border-gray-300"}`}>
                        {entry.autoPromotionEnabled ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <span className="text-purple-400 text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border border-purple-500/20 bg-purple-950">
                        {entry.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {sorted.length === 0 && (
                <tr><td colSpan={6} className="text-center py-10 text-gray-400 text-sm">No students in the waiting list.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
