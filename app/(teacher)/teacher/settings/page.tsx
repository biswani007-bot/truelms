import React from "react";
import { getAuthenticatedTeacher } from "../../../../lib/auth/teacher-session";
import { Bell, ShieldAlert, Lock, Save } from "lucide-react";
import Link from "next/link";
import { DashboardCard } from "../../../../components/ui/DashboardCard";
import { TeacherPasswordChangeCard } from "../../../../components/teacher/TeacherPasswordChangeCard";
import { LoginDevicesCard } from "../../../../components/ui/LoginDevicesCard";
import { AuditLogsCard } from "../../../../components/ui/AuditLogsCard";

export const metadata = {
  title: "Account Settings | TrueLern Teacher",
  description: "Manage your preferences and notification settings.",
};

export default async function TeacherSettingsPage() {
  const teacher = await getAuthenticatedTeacher();

  if (!teacher) {
    return (
      <div className="py-20 text-center text-slate-500 font-medium">
        Teacher identity not found.{" "}
        <Link href="/login?redirect=/teacher/settings" className="text-indigo-600 font-semibold hover:underline">
          Please sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 sm:gap-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Account Settings</h1>
        <p className="text-sm text-slate-500 mt-2 leading-relaxed">
          Manage your notification preferences and security settings.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        <DashboardCard title="Notification Preferences" headerAction={<Bell className="w-5 h-5 text-indigo-500" />}>
          <div className="space-y-4">
            {[
              { label: "Email Notifications", description: "Receive daily summaries of student activity and upcoming classes.", checked: true },
              { label: "Assignment Submissions", description: "Get notified when a student submits an assignment.", checked: true },
              { label: "Live Class Reminders", description: "Alert me 15 minutes before a scheduled live class starts.", checked: true },
              { label: "Parent Messages", description: "Instant alerts for new direct messages from parents.", checked: false },
            ].map((pref, i) => (
              <div key={i} className="flex items-start gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                <div className="flex items-center h-6 mt-1">
                  <input
                    id={`pref-${i}`}
                    type="checkbox"
                    defaultChecked={pref.checked}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-600 cursor-not-allowed"
                    disabled
                  />
                </div>
                <div className="flex-1">
                  <label htmlFor={`pref-${i}`} className="text-sm font-bold text-slate-800 cursor-not-allowed opacity-80">
                    {pref.label}
                  </label>
                  <p className="text-xs text-slate-500 mt-0.5 opacity-80">
                    {pref.description}
                  </p>
                </div>
              </div>
            ))}
            <div className="pt-2 text-xs text-slate-400 italic">
              * Notification preferences are currently managed by institutional policy.
            </div>
          </div>
        </DashboardCard>

        <TeacherPasswordChangeCard />
        <LoginDevicesCard />
        <AuditLogsCard />
      </div>
    </div>
  );
}
