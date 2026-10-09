import React from "react";
import { getAuthenticatedTeacher } from "../../../../lib/auth/teacher-session";
import { User, Mail, Shield, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { DashboardCard } from "../../../../components/ui/DashboardCard";

export const metadata = {
  title: "Faculty Profile | TrueLern Teacher",
  description: "View your personal profile and account details.",
};

export default async function TeacherProfilePage() {
  const teacher = await getAuthenticatedTeacher();

  if (!teacher) {
    return (
      <div className="py-20 text-center text-slate-500 font-medium">
        Teacher identity not found.{" "}
        <Link href="/login?redirect=/teacher/profile" className="text-indigo-600 font-semibold hover:underline">
          Please sign in
        </Link>
      </div>
    );
  }

  const initials = `${teacher.firstName?.charAt(0) || ""}${teacher.lastName?.charAt(0) || ""}`;

  return (
    <div className="flex flex-col gap-6 sm:gap-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Faculty Profile</h1>
        <p className="text-sm text-slate-500 mt-2 leading-relaxed">
          Your personal information and account status.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <DashboardCard title="Profile Summary" className="p-8 flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-[#7C3AED]/20 bg-gradient-to-br from-indigo-500 to-rose-400 flex items-center justify-center text-white font-extrabold text-3xl mb-4 shadow-xl">
              {initials}
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              {teacher.firstName} {teacher.lastName}
            </h2>
            <p className="text-sm font-medium text-slate-500 mt-1">
              {teacher.designation || "Faculty Member"}
            </p>
            <div className="mt-4 flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Active Account</span>
            </div>
          </DashboardCard>
        </div>

        <div className="md:col-span-2 flex flex-col gap-6">
          <DashboardCard title="Personal Information">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-1">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">
                  First Name
                </label>
                <div className="font-semibold text-slate-800 flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-400" />
                  {teacher.firstName}
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">
                  Last Name
                </label>
                <div className="font-semibold text-slate-800 flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-400" />
                  {teacher.lastName}
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">
                  Email Address
                </label>
                <div className="font-semibold text-slate-800 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-400" />
                  {teacher.email}
                </div>
              </div>
            </div>
          </DashboardCard>

          <DashboardCard title="Roles & Permissions">
            <div className="flex flex-wrap gap-2 p-1">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-indigo-100 bg-indigo-50 text-indigo-700 font-semibold text-sm">
                <Shield className="w-4 h-4" />
                Teacher
              </div>
              {teacher.isCounsellor && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-rose-100 bg-rose-50 text-rose-700 font-semibold text-sm">
                  <Shield className="w-4 h-4" />
                  Counsellor
                </div>
              )}
            </div>
            <div className="mt-4 p-4 bg-amber-50 rounded-xl flex items-start gap-3 border border-amber-100">
              <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800 leading-relaxed font-medium">
                To update your personal information or change your roles, please contact your institution's administrator. Role modifications are restricted to system administrators for security purposes.
              </p>
            </div>
          </DashboardCard>
        </div>
      </div>
    </div>
  );
}
