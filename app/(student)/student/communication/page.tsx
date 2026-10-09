// @ts-nocheck
import React from "react";
import Link from "next/link";
import { connectDB } from "../../../../config/db";
import { getAuthenticatedStudent } from "../../../../lib/auth/student-session";
import { Notification } from "../../../../models/notification.model";
import { Bell, CheckCircle2, Clock, Inbox, Sparkles, MessageSquare } from "lucide-react";

export const revalidate = 0;

export const metadata = {
  title: "Announcements & Notifications | TrueLern Student",
  description: "Official system alerts, academic announcements, and cohort updates.",
};

export default async function StudentCommunicationPage() {
  await connectDB();
  const student = await getAuthenticatedStudent();

  if (!student) {
    return (
      <div className="text-center py-16">
        <h1 className="text-xl font-bold text-slate-900">Please Sign In</h1>
        <p className="text-sm text-slate-500 mt-1">Sign in to view your announcements inbox.</p>
      </div>
    );
  }

  // Real query scoped to student's user account
  const notifications = await Notification.find({ recipient: student.user })
    .sort({ createdAt: -1 })
    .lean();

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Announcements & Broadcast Inbox</h1>
        <p className="text-sm text-slate-500 mt-1">
          Official institutional broadcasts, cohort reminders, and academic notifications for your profile.
        </p>
      </div>

      {notifications.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center max-w-xl mx-auto">
          <Inbox className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-900">Your inbox is clear</h3>
          <p className="text-sm text-slate-500 mt-1">
            There are no new broadcasts or system notifications at this time. Live lecture updates and assignment announcements will arrive here.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
          <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Recent Alerts ({notifications.length})
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {notifications.map((n) => (
              <div key={n._id?.toString()} className="p-5 hover:bg-slate-50/50 transition flex items-start gap-4">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Bell className="w-4 h-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {n.eventSource || "System"}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      {new Date(n.createdAt).toLocaleString("en-IN", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm">{n.title}</h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
