// @ts-nocheck
import React from "react";
import Link from "next/link";
import { connectDB } from "../../../../config/db";
import { getAuthenticatedStudent } from "../../../../lib/auth/student-session";
import { User, Mail, Phone, MapPin, Shield, BookOpen, Award } from "lucide-react";

export const revalidate = 0;

export const metadata = {
  title: "My Profile | TrueLern Student",
  description: "Manage personal contact information, academic details, and account preferences.",
};

export default async function StudentProfilePage() {
  await connectDB();
  const student = await getAuthenticatedStudent();

  if (!student) {
    return (
      <div className="text-center py-16">
        <h1 className="text-xl font-bold text-slate-900">Please Sign In</h1>
        <p className="text-sm text-slate-500 mt-1">Sign in to view your profile.</p>
        <Link
          href="/login?redirect=/student/profile"
          className="mt-4 inline-block px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Student Profile & Credentials</h1>
        <p className="text-sm text-slate-500 mt-1">
          Verified academic profile information and contact details registered on the platform.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        {/* Profile Card Header */}
        <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-extrabold text-xl flex items-center justify-center shadow-md shadow-indigo-100">
            {student.firstName?.[0] || "S"}{student.lastName?.[0] || "T"}
          </div>

          <div>
            <h2 className="text-xl font-extrabold text-slate-900">
              {student.firstName} {student.lastName}
            </h2>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Student ID: <strong className="text-indigo-600 font-bold">{student.studentId}</strong>
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                {student.status || "Active Student"}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                Adm: {student.admissionNumber || "ADM-001"}
              </span>
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
          <div className="space-y-1">
            <span className="font-bold text-slate-400 uppercase tracking-wider block text-[10px]">First Name</span>
            <div className="font-bold text-slate-900 text-sm p-3 bg-slate-50 rounded-xl border border-slate-100">
              {student.firstName}
            </div>
          </div>

          <div className="space-y-1">
            <span className="font-bold text-slate-400 uppercase tracking-wider block text-[10px]">Last Name</span>
            <div className="font-bold text-slate-900 text-sm p-3 bg-slate-50 rounded-xl border border-slate-100">
              {student.lastName}
            </div>
          </div>

          <div className="space-y-1">
            <span className="font-bold text-slate-400 uppercase tracking-wider block text-[10px]">Primary Contact</span>
            <div className="font-bold text-slate-900 text-sm p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <span>{student.phone || "Not recorded"}</span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="font-bold text-slate-400 uppercase tracking-wider block text-[10px]">Emergency Contact</span>
            <div className="font-bold text-slate-900 text-sm p-3 bg-slate-50 rounded-xl border border-slate-100">
              {student.emergencyContact || "Not recorded"}
            </div>
          </div>

          <div className="sm:col-span-2 space-y-1">
            <span className="font-bold text-slate-400 uppercase tracking-wider block text-[10px]">Residential Address</span>
            <div className="font-medium text-slate-800 text-xs p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-2 leading-relaxed">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <span>
                {student.currentAddress ? `${student.currentAddress}, ${student.city || ""}, ${student.state || ""} ${student.postalCode || ""}, ${student.country || ""}` : "Registered institutional address"}
              </span>
            </div>
          </div>
        </div>

        {/* Academic Preferences */}
        <div className="pt-6 border-t border-slate-100">
          <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-3">
            Academic & Language Preferences
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Language</span>
              <span className="font-bold text-slate-800">{student.preferences?.language || "English"}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Timezone</span>
              <span className="font-bold text-slate-800">{student.preferences?.timezone || "UTC+05:30 (IST)"}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Alert Preference</span>
              <span className="font-bold text-slate-800 capitalize">{student.preferences?.notificationPref || "Email"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
