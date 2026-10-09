// @ts-nocheck
import React from "react";
import Link from "next/link";
import { connectDB } from "../../../../config/db";
import { getAuthenticatedTeacher } from "../../../../lib/auth/teacher-session";
import { Notification } from "../../../../models/notification.model";
import { Bell, Clock } from "lucide-react";

export const revalidate = 0;

export const metadata = {
  title: "Faculty Notifications | TrueLern Teacher",
  description: "Alerts, updates, and institutional broadcasts.",
};

export default async function TeacherNotificationsPage() {
  await connectDB();
  const teacher = await getAuthenticatedTeacher();

  if (!teacher) {
    return (
      <div className="text-center py-16">
        <h1 className="text-xl font-bold text-slate-900">Please Sign In</h1>
        <p className="text-sm text-slate-500 mt-1">Sign in to view notifications.</p>
      </div>
    );
  }

  // Notifications query
  const notifications = await Notification.find({
    $or: [
      { user: teacher.user },
      { recipient: teacher.user },
      { recipientRoles: { $in: ["Teacher", "Faculty"] } },
    ],
  })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200/80 p-6 rounded-3xl shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Notifications
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            Important updates, alerts, and system broadcasts.
          </p>
        </div>
      </div>

      <div>
        {notifications.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center max-w-xl mx-auto">
            <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-900">No active notifications</h3>
            <p className="text-sm text-slate-500 mt-1">
              You are all caught up. No unread broadcasts or alerts in your feed.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((n: any) => {
              // Determine destination link based on notification metadata
              let destinationLink = "#";
              if (n.metadata?.entityType === "live-class") {
                destinationLink = `/teacher/live-classes`;
              } else if (n.metadata?.entityType === "conversation") {
                destinationLink = `/teacher/communication`;
              } else if (n.metadata?.entityType === "assignment") {
                destinationLink = `/teacher/assignments`;
              } else if (n.metadata?.link) {
                destinationLink = n.metadata.link;
              }

              return (
                <Link
                  href={destinationLink}
                  key={n._id?.toString()}
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-indigo-200 hover:shadow-md transition flex items-start gap-4 cursor-pointer block"
                >
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl shrink-0 mt-0.5">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h3 className="font-bold text-slate-900 text-sm truncate">
                        {n.title || n.subject || "Faculty Announcement"}
                      </h3>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">
                        {n.createdAt
                          ? new Date(n.createdAt).toLocaleDateString("en-IN", {
                              dateStyle: "medium",
                            })
                          : "Recently"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {n.body || n.content || n.message}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
