/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import Link from "next/link";
import { notificationQueueRepository } from "../../../../repositories/notification-queue.repository";
import { notificationTemplateRepository } from "../../../../repositories/notification-template.repository";
import { notificationDeliveryRepository } from "../../../../repositories/notification-delivery.repository";
import { connectDB } from "../../../../config/db";

export const revalidate = 0;

export default async function NotificationDashboard() {
  await connectDB();

  const [queue, templates, delivery] = await Promise.all([
    notificationQueueRepository.findMany({}),
    notificationTemplateRepository.findMany({}),
    notificationDeliveryRepository.findMany({}),
  ]);

  const queued = queue.filter(q => q.status === "queued").length;
  const retrying = queue.filter(q => q.status === "retrying").length;
  const failed = queue.filter(q => q.status === "failed").length;

  const deliveredCount = delivery.filter(d => d.status === "success").length;
  const failedDeliveryCount = delivery.filter(d => d.status === "failed").length;
  const totalAttempts = deliveredCount + failedDeliveryCount;
  const deliveryRate = totalAttempts > 0 ? Math.round((deliveredCount / totalAttempts) * 100) : 100;

  // Channels count
  const channelCounts: Record<string, number> = {};
  for (const item of delivery) {
    channelCounts[item.channel] = (channelCounts[item.channel] || 0) + 1;
  }

  return (
    <div className="flex flex-col gap-10">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Centralized Notification Console</h1>
          <p className="text-sm text-gray-500 mt-1">
            Central orchestration hub for template registry, delivery queue, channel adapter health, and timelines.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/notifications/templates"
            className="px-3 py-1.5 border border-gray-200 text-gray-700 hover:text-indigo-650 rounded-lg text-xs font-bold transition bg-white"
          >
            Templates
          </Link>
          <Link
            href="/admin/notifications/queue"
            className="px-3 py-1.5 border border-gray-200 text-gray-700 hover:text-indigo-650 rounded-lg text-xs font-bold transition bg-white"
          >
            Queue Monitor
          </Link>
          <Link
            href="/admin/notifications/history"
            className="px-3 py-1.5 border border-gray-200 text-gray-700 hover:text-indigo-650 rounded-lg text-xs font-bold transition bg-white"
          >
            History
          </Link>
          <Link
            href="/admin/notifications/timeline"
            className="px-3 py-1.5 border border-gray-200 text-gray-700 hover:text-indigo-650 rounded-lg text-xs font-bold transition bg-white"
          >
            Timeline Logs
          </Link>
          <Link
            href="/admin/notifications/announcements"
            className="px-3 py-1.5 border border-gray-200 text-gray-700 hover:text-indigo-650 rounded-lg text-xs font-bold transition bg-white"
          >
            Announcements
          </Link>
          <Link
            href="/admin/notifications/integrations"
            className="px-3 py-1.5 border border-gray-200 text-gray-700 hover:text-indigo-650 rounded-lg text-xs font-bold transition bg-white"
          >
            Integrations
          </Link>
          <Link
            href="/admin/notifications/jobs"
            className="px-3 py-1.5 border border-gray-200 text-gray-700 hover:text-indigo-650 rounded-lg text-xs font-bold transition bg-white"
          >
            Jobs
          </Link>
          <Link
            href="/admin/notifications/inbox"
            className="px-3 py-1.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg text-xs font-bold transition"
          >
            Inbox Console
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: "Queued Items", val: queued, sub: "Waiting execution", color: "text-amber-700" },
          { label: "Delivery Success Rate", val: `${deliveryRate}%`, sub: `${deliveredCount} successful`, color: "text-emerald-600" },
          { label: "Failures Logged", val: failed + failedDeliveryCount, sub: "Check retry configs", color: "text-red-400" },
          { label: "Active Templates", val: templates.length, sub: "Across all adapters", color: "text-indigo-600" },
        ].map((kpi, idx) => (
          <div key={idx} className="bg-gray-50 border border-gray-200 p-6 rounded-2xl">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{kpi.label}</div>
            <div className={`text-2xl font-black mt-2 ${kpi.color}`}>{kpi.val}</div>
            <div className="text-[11px] text-slate-655 mt-1">{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Active Channels Breakdown */}
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
        <h2 className="text-base font-bold text-gray-900 mb-4">Channel Dispatch Distribution</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {["email", "sms", "whatsapp", "push", "in-app"].map((chan) => {
            const count = channelCounts[chan] || 0;
            return (
              <div key={chan} className="bg-gray-50 p-4 rounded-xl border border-slate-850">
                <div className="text-[10px] font-bold text-slate-550 uppercase tracking-wider">{chan}</div>
                <div className="text-xl font-bold text-gray-900 mt-1">{count} runs</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
