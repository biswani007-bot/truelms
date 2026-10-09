/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import Link from "next/link";
import { financeTimelineRepository } from "../../../../../repositories/finance-timeline.repository";
import { connectDB } from "../../../../../config/db";

export const revalidate = 0;

const EVENT_COLORS: Record<string, string> = {
  "invoice-generated": "bg-indigo-500",
  "payment-recorded": "bg-emerald-500",
  "receipt-issued": "bg-teal-500",
  "refund-requested": "bg-amber-500",
  "refund-approved": "bg-violet-500",
  "invoice-closed": "bg-blue-500",
};

const EVENT_LABELS: Record<string, string> = {
  "invoice-generated": "Invoice Generated",
  "payment-recorded": "Payment Recorded",
  "receipt-issued": "Receipt Issued",
  "refund-requested": "Refund Requested",
  "refund-approved": "Refund Approved",
  "invoice-closed": "Invoice Closed",
};

export default async function FinanceTimelinePage() {
  await connectDB();

  const timeline = await financeTimelineRepository.findMany(
    {},
    { sort: "timestamp", order: "desc" } as any
  );

  return (
    <div className="flex flex-col gap-10">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Finance Activity Timeline</h1>
          <p className="text-sm text-gray-500 mt-1">
            Complete audit trail of all financial operations across the platform.
          </p>
        </div>
        <Link
          href="/admin/finance"
          className="px-4 py-2 border border-gray-200 text-gray-600 hover:bg-white hover:text-white rounded-lg text-sm transition"
        >
          ← Finance Home
        </Link>
      </div>

      {/* Event Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Object.entries(EVENT_LABELS).map(([key, label]) => {
          const count = timeline.filter(t => t.event === key).length;
          return (
            <div key={key} className="bg-gray-50 border border-gray-200 p-4 rounded-2xl">
              <div className={`w-2 h-2 rounded-full ${EVENT_COLORS[key]} mb-2`} />
              <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider leading-tight">{label}</div>
              <div className="text-xl font-black text-white mt-1">{count}</div>
            </div>
          );
        })}
      </div>

      {/* Timeline Feed */}
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
        <h2 className="text-base font-bold text-gray-900 mb-6">Event Feed</h2>
        <div className="flex flex-col gap-0 border-l-2 border-gray-200 ml-3">
          {timeline.map((item) => (
            <div key={item._id?.toString()} className="relative flex gap-4 pb-8 last:pb-0">
              <div className={`absolute -left-[9px] top-0.5 w-4 h-4 rounded-full border-2 border-gray-100 ${EVENT_COLORS[item.event] || "bg-slate-600"} flex-shrink-0`} />
              <div className="ml-6 flex flex-col gap-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-white capitalize">
                    {EVENT_LABELS[item.event] || item.event}
                  </span>
                  <span className="text-[10px] text-gray-400 font-mono">
                    {new Date(item.timestamp).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-gray-500">{item.description}</p>
                <p className="text-[10px] text-gray-500 font-mono">
                  Ref: {item.referenceId?.toString()}
                </p>
              </div>
            </div>
          ))}
          {timeline.length === 0 && (
            <div className="ml-6 text-xs text-slate-550 py-4">No finance events recorded yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
