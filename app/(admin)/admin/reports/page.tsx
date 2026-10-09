/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import Link from "next/link";
import { AnalyticsService } from "../../../../services/reports/analytics.service";
import { connectDB } from "../../../../config/db";
import { WorkspaceHeader } from "@/components/workspace/WorkspaceHeader";
import { BarChart3, FileSpreadsheet, Users, Calendar, Library, LayoutGrid } from "lucide-react";

export const revalidate = 0;

export default async function ExecutiveDashboard() {
  await connectDB();

  const summary = await AnalyticsService.getExecutiveSummary();
  const admissions = await AnalyticsService.getAdmissionsKPIs();
  const academic = await AnalyticsService.getAcademicKPIs();
  const finance = await AnalyticsService.getFinanceKPIs();
  const teachers = await AnalyticsService.getTeacherKPIs();

  return (
    <div className="flex flex-col gap-8">
      {/* Workspace Header */}
      <WorkspaceHeader
        entityName="Executive Analytics & Dashboard"
        description="Real-time organizational analytics, academic outcomes, and financial health."
        moduleIcon={<BarChart3 className="size-5" />}
        breadcrumb={[
          { label: "Admin", href: "/admin" },
          { label: "Reports" },
        ]}
        secondaryActions={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/reports/admissions"
              className="lms-btn lms-btn-secondary"
            >
              <FileSpreadsheet className="size-4" />
              Admissions
            </Link>
            <Link
              href="/admin/reports/academics"
              className="lms-btn lms-btn-secondary"
            >
              <BarChart3 className="size-4" />
              Academics
            </Link>
            <Link
              href="/admin/reports/faculty"
              className="lms-btn lms-btn-secondary"
            >
              <Users className="size-4" />
              Faculty & Success
            </Link>
            <Link
              href="/admin/reports/scheduler"
              className="lms-btn lms-btn-secondary"
            >
              <Calendar className="size-4" />
              Scheduler
            </Link>
            <Link
              href="/admin/reports/library"
              className="lms-btn lms-btn-secondary"
            >
              <Library className="size-4" />
              Report Library
            </Link>
            <Link
              href="/admin/reports/dashboard-builder"
              className="lms-btn lms-btn-secondary"
            >
              <LayoutGrid className="size-4" />
              Dashboard Builder
            </Link>
          </div>
        }
      />

      {/* High Level KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: "Total Students", val: summary.students.total, sub: `${summary.students.active} active students`, color: "text-indigo-600" },
          { label: "Gross Collections", val: `$${(summary.finance.totalRevenue / 100).toFixed(2)}`, sub: `${summary.finance.successfulPayments} payments`, color: "text-emerald-600" },
          { label: "Overall Attendance", val: `${summary.academic.attendanceRate}%`, sub: "Across all live classes", color: "text-teal-400" },
          { label: "Lead Conversion", val: `${summary.admissions.conversionRate}%`, sub: `${summary.admissions.totalLeads} total leads`, color: "text-amber-700" },
        ].map((kpi, idx) => (
          <div key={idx} className="bg-gray-50 border border-gray-200 p-6 rounded-2xl">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{kpi.label}</div>
            <div className={`text-2xl font-black mt-2 ${kpi.color}`}>{kpi.val}</div>
            <div className="text-[11px] text-slate-650 mt-1">{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Admissions & Academic Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Admissions Box */}
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
          <h2 className="text-base font-bold text-gray-900 mb-4">Admissions Funnel</h2>
          <div className="flex flex-col gap-3">
            <div className="flex justify-between text-xs text-gray-500 border-b border-slate-850 pb-2">
              <span>Metric</span>
              <span className="font-mono">Value</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Total Leads</span>
              <span className="font-mono text-white">{admissions.totalLeads}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Leads Converted</span>
              <span className="font-mono text-emerald-600">{admissions.convertedLeads}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Conversion Rate</span>
              <span className="font-mono text-indigo-600 font-bold">{admissions.conversionRate}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">New Intake (This Month)</span>
              <span className="font-mono text-teal-400">{admissions.newLeadsThisMonth}</span>
            </div>
          </div>
        </div>

        {/* Academic Box */}
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
          <h2 className="text-base font-bold text-gray-900 mb-4">Academic Operations</h2>
          <div className="flex flex-col gap-3">
            <div className="flex justify-between text-xs text-gray-500 border-b border-slate-850 pb-2">
              <span>Metric</span>
              <span className="font-mono">Value</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Live Classes Conducted</span>
              <span className="font-mono text-white">{academic.liveClasses.completed}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Average Attendance Rate</span>
              <span className="font-mono text-emerald-600 font-bold">{academic.attendance.rate}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Assignment Submission Rate</span>
              <span className="font-mono text-indigo-600 font-bold">{academic.assignments.submissionRate}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Assessment Pass Rate</span>
              <span className="font-mono text-teal-400 font-bold">{academic.assessments.passRate}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Finance & Operational Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Finance Box */}
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
          <h2 className="text-base font-bold text-gray-900 mb-4">Financial Outcomes</h2>
          <div className="flex flex-col gap-3">
            <div className="flex justify-between text-xs text-gray-500 border-b border-slate-850 pb-2">
              <span>Metric</span>
              <span className="font-mono">Value</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Gross Billings</span>
              <span className="font-mono text-white">${(finance.revenue.total / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Net Collections</span>
              <span className="font-mono text-emerald-600 font-bold">${(finance.revenue.collected / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Outstanding Receivables</span>
              <span className="font-mono text-amber-700">${(finance.revenue.outstanding / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Collection Efficiency</span>
              <span className="font-mono text-indigo-600 font-bold">{finance.rates.collectionRate}%</span>
            </div>
          </div>
        </div>

        {/* Operational Workload Box */}
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
          <h2 className="text-base font-bold text-gray-900 mb-4">Operational Health</h2>
          <div className="flex flex-col gap-3">
            <div className="flex justify-between text-xs text-gray-500 border-b border-slate-850 pb-2">
              <span>Metric</span>
              <span className="font-mono">Value</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Faculty Registry Size</span>
              <span className="font-mono text-white">{teachers.totalTeachers} teachers</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Active Cohort Batches</span>
              <span className="font-mono text-white">{teachers.totalBatches} batches</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Average Batch Density</span>
              <span className="font-mono text-indigo-600 font-bold">{teachers.avgStudentsPerBatch} students/batch</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Avg Faculty Workload</span>
              <span className="font-mono text-teal-400">{teachers.avgClassesPerTeacher} classes conducted</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
