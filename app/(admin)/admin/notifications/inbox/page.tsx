/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import Link from "next/link";
import { notificationRepository } from "../../../../../repositories/notification.repository";
import { connectDB } from "../../../../../config/db";

export const revalidate = 0;

export default async function UserInboxPage() {
  await connectDB();

  // Find all active notifications
  const notifications = await notificationRepository.findMany(
    { status: "active" },
    { populate: ["sender"], sort: "createdAt", order: "desc" } as any
  );

  const unreadCount = notifications.filter(n => !n.readAt).length;

  return (
    <div className="flex flex-col gap-10">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Notification Center</h1>
          <p className="text-sm text-gray-500 mt-1">
            Check recent alerts, mark items as read, and view historic updates.
          </p>
        </div>
        <Link
          href="/admin/notifications"
          className="px-4 py-2 border border-gray-200 text-gray-600 hover:bg-white hover:text-white rounded-lg text-sm transition"
        >
          ← Admin Console
        </Link>
      </div>

      {/* Inbox Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Inbox List */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 flex flex-col gap-4">
            <div className="flex justify-between items-center pb-4 border-b border-slate-850">
              <h2 className="text-base font-bold text-gray-900">Alerts Inbox</h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-indigo-50 text-indigo-600 border border-indigo-200">
                {unreadCount} unread
              </span>
            </div>

            <div className="flex flex-col gap-4 mt-2">
              {notifications.map((item) => (
                <div
                  key={item._id?.toString()}
                  className={`p-4 rounded-xl border transition ${
                    item.readAt
                      ? "bg-gray-50 border-slate-850/40 opacity-75"
                      : "bg-white border-gray-200 hover:bg-white/80"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">{item.title}</h3>
                      <p className="text-xs text-gray-500 mt-1">{item.content}</p>
                    </div>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-white text-gray-400 border border-slate-850">
                      {item.eventSource}
                    </span>
                  </div>

                  <div className="flex justify-between items-center mt-4 border-t border-slate-850/40 pt-3">
                    <span className="text-[10px] text-gray-400 font-mono">
                      {new Date((item as any).createdAt).toLocaleString()}
                    </span>

                    <div className="flex gap-3">
                      {!item.readAt && (
                        <span className="text-xs text-indigo-600 font-semibold hover:text-indigo-500 cursor-pointer transition">
                          Mark Read
                        </span>
                      )}
                      <span className="text-xs text-gray-400 font-semibold hover:text-gray-500 cursor-pointer transition">
                        Archive
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {notifications.length === 0 && (
                <div className="text-center py-12 text-slate-550 text-xs">
                  Your inbox is completely clear.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Channel Preferences Info Box */}
        <div className="flex flex-col gap-6">
          <div className="bg-gray-50 border border-gray-200 p-6 rounded-2xl flex flex-col gap-4">
            <h2 className="text-base font-bold text-gray-900">Alert Channels Configured</h2>
            <div className="flex flex-col gap-3">
              {[
                { name: "Email alerts", desc: "For invoice receipts and enrollment confirmations" },
                { name: "SMS dispatch", desc: "For class schedule changes and critical alerts" },
                { name: "In-app notifications", desc: "Displayed right here in your dashboard inbox" },
              ].map((chan, idx) => (
                <div key={idx} className="flex flex-col gap-0.5 border-b border-slate-850 pb-2 last:border-0 last:pb-0">
                  <span className="text-xs font-semibold text-white">{chan.name}</span>
                  <span className="text-[10px] text-gray-400">{chan.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
