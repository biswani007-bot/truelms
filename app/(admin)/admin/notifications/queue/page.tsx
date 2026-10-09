/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import Link from "next/link";
import { notificationQueueRepository } from "../../../../../repositories/notification-queue.repository";
import { connectDB } from "../../../../../config/db";

export const revalidate = 0;

export default async function QueueMonitorPage() {
  await connectDB();

  const queue = await notificationQueueRepository.findMany(
    {},
    { populate: ["recipient", "template"], sort: "nextAttemptAt", order: "asc" } as any
  );

  return (
    <div className="flex flex-col gap-10">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Queue Monitor</h1>
          <p className="text-sm text-gray-500 mt-1">
            Real-time delivery manager showing scheduled attempts, error logs, and administrative controls.
          </p>
        </div>
        <Link
          href="/admin/notifications"
          className="px-4 py-2 border border-gray-200 text-gray-600 hover:bg-white hover:text-white rounded-lg text-sm transition"
        >
          ← Dashboard Home
        </Link>
      </div>

      {/* Queue Table */}
      <div className="bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-base font-bold text-gray-900">Active Delivery Queue</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-xs text-gray-400 uppercase tracking-wider">
                <th className="text-left px-6 py-3">Recipient</th>
                <th className="text-left px-6 py-3">Template</th>
                <th className="text-left px-6 py-3">Channel</th>
                <th className="text-left px-6 py-3">Attempts</th>
                <th className="text-left px-6 py-3">Next Attempt</th>
                <th className="text-left px-6 py-3">Status</th>
                <th className="text-left px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {queue.map((item) => {
                const recObj = item.recipient as any;
                const tplObj = item.template as any;
                return (
                  <tr key={item._id?.toString()} className="border-b border-slate-850 hover:bg-white transition">
                    <td className="px-6 py-4">
                      <div className="text-white text-xs font-semibold">
                        {recObj ? `${recObj.firstName} ${recObj.lastName}` : "User"}
                      </div>
                      <div className="text-[10px] text-gray-400 font-mono mt-0.5">{recObj?.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-500 text-xs font-mono">{tplObj?.slug || "alert-template"}</span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs uppercase text-gray-500">{item.channel}</td>
                    <td className="px-6 py-4 font-mono text-xs text-gray-500">
                      {item.retryCount} / {item.maxRetries}
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs">
                      {new Date(item.nextAttemptAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                        item.status === "queued" ? "bg-indigo-50 text-indigo-600 border-indigo-200" :
                        item.status === "delivered" ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
                        item.status === "failed" ? "bg-red-950 text-red-400 border-red-500/20" :
                        "bg-amber-50 text-amber-700 border-amber-200"
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {item.status !== "delivered" && item.status !== "cancelled" && (
                        <div className="flex gap-2">
                          <span className="text-xs text-indigo-600 font-bold hover:text-indigo-500 cursor-pointer transition">
                            Retry
                          </span>
                          <span className="text-xs text-red-400 font-bold hover:text-red-300 cursor-pointer transition">
                            Cancel
                          </span>
                        </div>
                      )}
                      {(item.status === "delivered" || item.status === "cancelled") && (
                        <span className="text-xs text-gray-500 capitalize">{item.status}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {queue.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-550 text-xs">No active queue records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
