"use client";

import React, { useEffect, useState } from "react";
import { Bell, Info, AlertTriangle, CheckCircle2 } from "lucide-react";

export default function ParentNotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetch("/api/parent/notifications", { credentials: "include" })
      .then((res) => res.json())
      .then((json) => setNotifications(json.data || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="h-64 bg-slate-200/60 rounded-3xl animate-pulse" />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Guardian Notification Inbox</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Important announcements, attendance notices, and academic reminders.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-sm">
        {notifications.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {notifications.map((n: any) => (
              <div key={n.id} className="p-4 flex items-start gap-3 hover:bg-slate-50/50 transition">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Bell className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-900">{n.title}</h3>
                    <span className="text-[10px] text-slate-400">
                      {new Date(n.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">{n.content}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-slate-400">
            No notifications in your inbox.
          </div>
        )}
      </div>
    </div>
  );
}
