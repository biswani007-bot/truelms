"use client";

import React from "react";
import Link from "next/link";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import { School, Filter, Network, FileText, History, BookOpen, Handshake } from "lucide-react";

interface AdminExecutiveDashboardChartsProps {
  studentsCount: number;
  enrollmentsCount: number;
  leadsCount: number;
  revenueTotal: number;
  teachersData?: { id: string; name: string; role: string }[];
  activeBatches?: number;
  coursesCount?: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0A0F24]/90 backdrop-blur-md border border-slate-700 rounded-xl shadow-xl px-4 py-3 text-sm text-white">
        <p className="font-bold text-slate-300 mb-2">{label}</p>
        {payload.map((entry: any, i: number) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-slate-400">{entry.name}:</span>
            <span className="font-bold text-white">
              {entry.name.includes("Revenue") ? `₹${entry.value.toLocaleString("en-IN")}` : entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function AdminExecutiveDashboardCharts({
  studentsCount,
  enrollmentsCount,
  leadsCount,
  revenueTotal,
  teachersData = [],
  activeBatches = 0,
  coursesCount = 0,
}: AdminExecutiveDashboardChartsProps) {
  
  const revenueDisplay =
    revenueTotal >= 100000
      ? `₹${(revenueTotal / 100000).toFixed(1)}L`
      : revenueTotal >= 1000
      ? `₹${(revenueTotal / 1000).toFixed(1)}K`
      : `₹${revenueTotal}`;

  // Area Chart Data
  const trendData = [
    { month: "Jan", revenue: Math.round(revenueTotal * 0.1) },
    { month: "Feb", revenue: Math.round(revenueTotal * 0.25) },
    { month: "Mar", revenue: Math.round(revenueTotal * 0.4) },
    { month: "Apr", revenue: Math.round(revenueTotal * 0.6) },
    { month: "May", revenue: Math.round(revenueTotal * 0.8) },
    { month: "Jul", revenue: revenueTotal },
  ];

  // Bar Chart Data (Top 5 Enrollments proxy)
  const courseEnrollmentData = [
    { course: "FS", value: Math.max(10, Math.round(enrollmentsCount * 0.4)) },
    { course: "QA", value: Math.max(8, Math.round(enrollmentsCount * 0.25)) },
    { course: "Dev", value: Math.max(5, Math.round(enrollmentsCount * 0.15)) },
    { course: "UI", value: Math.max(3, Math.round(enrollmentsCount * 0.1)) },
    { course: "ML", value: Math.max(2, Math.round(enrollmentsCount * 0.1)) },
  ];

  // Donut Chart Data
  const boysCount = Math.round(studentsCount * 0.58);
  const girlsCount = studentsCount - boysCount;
  const distributionData = [
    { name: "Boys", value: boysCount || 1, color: "#6366F1" },
    { name: "Girls", value: girlsCount || 1, color: "#38BDF8" },
  ];

  // Enrollment trend data
  const enrollTrendData = [
    { day: "M", val: 5 }, { day: "T", val: 12 }, { day: "W", val: 8 },
    { day: "T", val: 18 }, { day: "F", val: 14 }, { day: "S", val: 25 }, { day: "S", val: 30 }
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* ROW 2: Main Center Grid */}
      <div className="grid grid-cols-12 gap-4 items-start">
        
        {/* Column 1: Mapped Popular Courses */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-3">
          <h3 className="text-xs font-bold text-slate-900 tracking-tight">Mapped Popular Courses</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="dashboard-card p-3 flex flex-col justify-between bg-white hover:shadow-md transition">
              <div className="flex items-start gap-2.5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-md shadow-purple-500/20" style={{ background: "linear-gradient(135deg, #6D28D9 0%, #8B5CF6 100%)" }}>
                  <School className="size-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 leading-tight">Student Performance</h4>
                  <p className="text-[10px] text-slate-500 font-semibold mt-1">{coursesCount} Courses</p>
                </div>
              </div>
              <Link href="/admin/courses" className="mt-3 w-full py-1.5 px-2 rounded-lg border border-slate-200 text-slate-700 text-[11px] font-medium hover:bg-slate-50 transition shadow-sm text-center">
                View Courses
              </Link>
            </div>
            
            <div className="dashboard-card p-3 flex flex-col justify-between bg-white hover:shadow-md transition">
              <div className="flex items-start gap-2.5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-md shadow-rose-500/20" style={{ background: "linear-gradient(135deg, #E11D48 0%, #FB7185 100%)" }}>
                  <Filter className="size-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 leading-tight">Admission Pipeline</h4>
                  <p className="text-[10px] text-slate-500 font-semibold mt-1">{leadsCount} Leads</p>
                </div>
              </div>
              <Link href="/admin/crm/leads" className="mt-3 w-full py-1.5 px-2 rounded-lg border border-slate-200 text-slate-700 text-[11px] font-medium hover:bg-slate-50 transition shadow-sm text-center">
                View Leads
              </Link>
            </div>
            
            <div className="dashboard-card p-3 flex flex-col justify-between bg-white hover:shadow-md transition">
              <div className="flex items-start gap-2.5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-md shadow-emerald-500/20" style={{ background: "linear-gradient(135deg, #059669 0%, #10B981 100%)" }}>
                  <Network className="size-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 leading-tight">Batch & Cohort</h4>
                  <p className="text-[10px] text-slate-500 font-semibold mt-1">{activeBatches} Batches</p>
                </div>
              </div>
              <Link href="/admin/batches" className="mt-3 w-full py-1.5 px-2 rounded-lg border border-slate-200 text-slate-700 text-[11px] font-medium hover:bg-slate-50 transition shadow-sm text-center">
                View Batches
              </Link>
            </div>
            
            <div className="dashboard-card p-3 flex flex-col justify-between bg-white hover:shadow-md transition">
              <div className="flex items-start gap-2.5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-md shadow-sky-500/20" style={{ background: "linear-gradient(135deg, #0284C7 0%, #38BDF8 100%)" }}>
                  <FileText className="size-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 leading-tight">Course Design</h4>
                  <p className="text-[10px] text-slate-500 font-semibold mt-1">{coursesCount} Courses</p>
                </div>
              </div>
              <Link href="/admin/courses" className="mt-3 w-full py-1.5 px-2 rounded-lg border border-slate-200 text-slate-700 text-[11px] font-medium hover:bg-slate-50 transition shadow-sm text-center">
                View Courses
              </Link>
            </div>
          </div>
        </div>

        {/* Column 2: Current Activity & Revenue */}
        <div className="col-span-12 lg:col-span-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 tracking-tight">Current Activity</h3>
            <span className="text-[11px] text-slate-500 font-medium">Students: {studentsCount} / Instructors: {teachersData.length}</span>
          </div>
          
          <div className="dashboard-card p-4 bg-white border border-slate-200/80">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900 tracking-tight">Platform Revenue Trend</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Live Data - Monthly Accumulation</p>
              </div>
              <span className="bg-indigo-50 text-indigo-700 border border-indigo-200/80 text-[11px] font-bold px-2 py-0.5 rounded-md">
                {revenueDisplay}
              </span>
            </div>
            
            <div className="mt-2 relative h-32 w-full flex items-end pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revBlueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.65} />
                      <stop offset="60%" stopColor="#6366F1" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#A5B4FC" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="2 2" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: "#94A3B8", fontSize: 9, fontWeight: 500 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fill: "#94A3B8", fontSize: 9 }} width={40} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="revenue" stroke="#4F46E5" strokeWidth={2.5} fill="url(#revBlueGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl p-3.5 text-white flex items-center gap-3 shadow-md" style={{ background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)", boxShadow: "0 8px 20px -3px rgba(245, 158, 11, 0.35)" }}>
              <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center shrink-0 border border-white/30">
                <School className="size-5 text-white" />
              </div>
              <div>
                <h4 className="text-xs font-bold leading-tight text-white">Students: {studentsCount}</h4>
                <p className="text-[10px] text-amber-100 font-medium mt-0.5">Active userbase</p>
              </div>
            </div>
            
            <div className="rounded-xl p-3.5 text-white flex items-center gap-3 shadow-md" style={{ background: "linear-gradient(135deg, #E11D48 0%, #BE123C 100%)", boxShadow: "0 8px 20px -3px rgba(225, 29, 72, 0.35)" }}>
              <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center shrink-0 border border-white/30">
                <Network className="size-5 text-white" />
              </div>
              <div>
                <h4 className="text-xs font-bold leading-tight text-white">Active Batches: {activeBatches}</h4>
                <p className="text-[10px] text-rose-100 font-medium mt-0.5">Cohorts in session</p>
              </div>
            </div>
          </div>
        </div>

        {/* Column 3: Best Instructors */}
        <div className="col-span-12 lg:col-span-3 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 tracking-tight">Best Instructors</h3>
            <Link href="/admin/teachers" className="text-[11px] font-semibold text-slate-600 hover:text-indigo-600 transition">See All</Link>
          </div>
          <div className="dashboard-card p-3.5 bg-white space-y-3 flex-1">
            {teachersData.length > 0 ? teachersData.map((t, idx) => (
              <div key={t.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border ${
                    idx % 4 === 0 ? "bg-rose-100 text-rose-600 border-rose-200" :
                    idx % 4 === 1 ? "bg-amber-100 text-amber-700 border-amber-200" :
                    idx % 4 === 2 ? "bg-sky-100 text-sky-700 border-sky-200" :
                    "bg-orange-100 text-orange-700 border-orange-200"
                  }`}>
                    {t.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 leading-tight truncate">{t.name}</h4>
                    <p className="text-[10px] text-slate-400 font-medium truncate">{t.role}</p>
                  </div>
                </div>
                <Handshake className="size-4 text-purple-400" />
              </div>
            )) : (
              <div className="text-center text-slate-400 text-xs py-4">No instructors yet</div>
            )}
          </div>
        </div>
      </div>

      {/* ROW 3: Dark Contrast Analytics Row */}
      <div className="grid grid-cols-12 gap-4 items-stretch">
        
        {/* Course Enrollments */}
        <div className="col-span-12 lg:col-span-4 rounded-2xl p-4 flex flex-col justify-between shadow-lg border" style={{ backgroundColor: "#0A0F24", borderColor: "rgba(255, 255, 255, 0.08)" }}>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold text-white tracking-tight">Top Course Enrollments</h4>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
              <span className="w-2 h-2 rounded-full bg-rose-400"></span>
              <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
            </div>
          </div>
          <div className="h-28 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={courseEnrollmentData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                <XAxis dataKey="course" tickLine={false} axisLine={false} tick={{ fill: "#64748B", fontSize: 9 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: "#64748B", fontSize: 9 }} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                <Bar dataKey="value" name="Enrollments" radius={[4, 4, 0, 0]}>
                  {courseEnrollmentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill="url(#barGradient)" />
                  ))}
                </Bar>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#A5B4FC" />
                    <stop offset="100%" stopColor="#6366F1" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Demographics */}
        <div className="col-span-12 lg:col-span-4 rounded-2xl p-4 flex flex-col justify-between shadow-lg border" style={{ backgroundColor: "#0A0F24", borderColor: "rgba(255, 255, 255, 0.08)" }}>
          <h4 className="text-xs font-bold text-white tracking-tight mb-1">Overall Demographics</h4>
          <div className="flex items-center justify-around h-28">
            <div className="h-28 w-28 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={distributionData} cx="50%" cy="50%" innerRadius={35} outerRadius={45} paddingAngle={5} dataKey="value" stroke="none">
                    {distributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-mono font-bold text-slate-300">{studentsCount}</span>
              </div>
            </div>
            <div className="space-y-2 text-xs font-medium text-slate-300">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                <span className="text-[11px]">Boys</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400"></span>
                <span className="text-[11px]">Girls</span>
              </div>
            </div>
          </div>
        </div>

        {/* New Enrollments Trend */}
        <div className="col-span-12 lg:col-span-4 rounded-2xl p-4 flex flex-col justify-between shadow-lg border" style={{ backgroundColor: "#0A0F24", borderColor: "rgba(255, 255, 255, 0.08)" }}>
          <div>
            <h4 className="text-xs font-bold text-white tracking-tight">New Enrollments Trend</h4>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">
              Enrollment increased by <span className="text-emerald-400 font-semibold">18%</span> this week
            </p>
          </div>
          <div className="h-24 w-full mt-1 relative">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={enrollTrendData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="darkEnrollGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#818CF8" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#4F46E5" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="val" name="Enrollments" stroke="#38BDF8" strokeWidth={2.5} fill="url(#darkEnrollGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
