/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import Link from "next/link";
import { connectDB } from "../../../../config/db";
import { WorkspaceHeader } from "@/components/workspace/WorkspaceHeader";
import { Job } from "../../../../models/job.model";
import { BusinessEvent } from "../../../../models/business-event.model";
import {
  Workflow,
  Activity,
  BookOpen,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  UserPlus,
  Bell,
  BookOpenCheck,
  ClipboardCheck,
  CreditCard,
  Mail,
} from "lucide-react";

export const revalidate = 0;

/** System automations registered in Phase 36.6 */
const SYSTEM_AUTOMATIONS = [
  {
    key: "enrollment",
    name: "Enrollment Confirmation",
    description: "Account creation, batch assignment, and welcome notification on enrollment confirmation.",
    jobTypes: ["enrollment.confirmed", "event.Enrollment.confirmed"],
    icon: UserPlus,
    color: "text-indigo-600",
    bgColor: "bg-indigo-50",
    borderColor: "border-indigo-200",
  },
  {
    key: "class-reminder",
    name: "Class Reminder",
    description: "Sends reminder notifications 15 minutes before scheduled live classes.",
    jobTypes: ["reminder.class"],
    icon: Bell,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
  },
  {
    key: "assignment-reminder",
    name: "Assignment Reminder",
    description: "Sends reminder notifications 24 hours before assignment deadlines.",
    jobTypes: ["reminder.assignment"],
    icon: BookOpenCheck,
    color: "text-teal-600",
    bgColor: "bg-teal-50",
    borderColor: "border-teal-200",
  },
  {
    key: "attendance",
    name: "Attendance Reconciliation",
    description: "Reconciles completed live class sessions and updates attendance summaries.",
    jobTypes: ["attendance.reconcile", "event.LiveClass.completed"],
    icon: ClipboardCheck,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
  },
  {
    key: "payment",
    name: "Payment Completion",
    description: "Idempotent receipt generation and payment confirmation on completed payments.",
    jobTypes: ["payment.completed", "event.Payment.completed"],
    icon: CreditCard,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
  },
  {
    key: "welcome",
    name: "Welcome Notification",
    description: "Sends welcome email with activation credentials to newly enrolled students.",
    jobTypes: ["welcome.email", "notification.welcome"],
    icon: Mail,
    color: "text-sky-600",
    bgColor: "bg-sky-50",
    borderColor: "border-sky-200",
  },
];

export default async function WorkflowDashboardPage() {
  await connectDB();

  // Aggregate real metrics from Job and BusinessEvent collections
  const [
    totalJobs,
    completedJobs,
    failedJobs,
    pendingJobs,
    retryingJobs,
    runningJobs,
    totalEvents,
    processedEvents,
    jobsByType,
  ] = await Promise.all([
    Job.countDocuments(),
    Job.countDocuments({ status: "completed" }),
    Job.countDocuments({ status: "failed" }),
    Job.countDocuments({ status: "pending" }),
    Job.countDocuments({ status: "retrying" }),
    Job.countDocuments({ status: "running" }),
    BusinessEvent.countDocuments(),
    BusinessEvent.countDocuments({ status: "processed" }),
    Job.aggregate([
      {
        $group: {
          _id: "$jobType",
          total: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
          failed: { $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $in: ["$status", ["pending", "retrying"]] }, 1, 0] } },
          lastRun: { $max: "$completedAt" },
        },
      },
      { $sort: { total: -1 } },
    ]),
  ]);

  // Map aggregated job stats to system automations
  const automationStats: Record<string, { total: number; completed: number; failed: number; pending: number; lastRun: Date | null }> = {};
  for (const auto of SYSTEM_AUTOMATIONS) {
    const matching = jobsByType.filter((j: any) => auto.jobTypes.some(t => j._id?.includes(t) || j._id === t));
    automationStats[auto.key] = matching.reduce(
      (acc: any, j: any) => ({
        total: acc.total + j.total,
        completed: acc.completed + j.completed,
        failed: acc.failed + j.failed,
        pending: acc.pending + j.pending,
        lastRun: j.lastRun && (!acc.lastRun || j.lastRun > acc.lastRun) ? j.lastRun : acc.lastRun,
      }),
      { total: 0, completed: 0, failed: 0, pending: 0, lastRun: null }
    );
  }

  const activeAutomations = SYSTEM_AUTOMATIONS.length;

  return (
    <div className="flex flex-col gap-8">
      {/* Workspace Header */}
      <WorkspaceHeader
        entityName="Automations"
        description="Manage enrollment pipelines, reminders, reconciliation, and payment automation."
        moduleIcon={<Workflow className="size-5" />}
        breadcrumb={[
          { label: "Admin", href: "/admin" },
          { label: "Workflows" },
        ]}
        secondaryActions={
          <div className="flex gap-2">
            <Link
              href="/admin/workflows/monitor"
              className="lms-btn lms-btn-secondary"
            >
              <Activity className="size-4" />
              Monitor Runs
            </Link>
            <Link
              href="/admin/workflows/templates"
              className="lms-btn lms-btn-secondary"
            >
              <BookOpen className="size-4" />
              Templates
            </Link>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          {
            label: "Active Automations",
            val: activeAutomations,
            sub: `${SYSTEM_AUTOMATIONS.length} system pipelines registered`,
            color: "text-indigo-600",
            Icon: Zap,
            iconColor: "text-indigo-400",
          },
          {
            label: "Successful Runs",
            val: completedJobs,
            sub: `${totalJobs} total job executions`,
            color: "text-emerald-600",
            Icon: CheckCircle2,
            iconColor: "text-emerald-400",
          },
          {
            label: "Failed Runs",
            val: failedJobs,
            sub: failedJobs > 0 ? "Review diagnostic logs" : "No failures recorded",
            color: failedJobs > 0 ? "text-red-500" : "text-gray-400",
            Icon: XCircle,
            iconColor: failedJobs > 0 ? "text-red-400" : "text-gray-300",
          },
          {
            label: "Pending Jobs",
            val: pendingJobs + retryingJobs + runningJobs,
            sub: `${runningJobs} running, ${retryingJobs} retrying`,
            color: "text-amber-600",
            Icon: Clock,
            iconColor: "text-amber-400",
          },
        ].map((kpi, idx) => (
          <div key={idx} className="bg-gray-50 border border-gray-200 p-6 rounded-2xl relative overflow-hidden">
            <kpi.Icon className={`absolute top-4 right-4 size-8 ${kpi.iconColor} opacity-20`} />
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{kpi.label}</div>
            <div className={`text-3xl font-black mt-2 ${kpi.color}`}>{kpi.val}</div>
            <div className="text-[11px] text-gray-500 mt-1">{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* System Automations */}
      <div className="bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h2 className="text-base font-bold text-gray-900">System Automations</h2>
            <p className="text-xs text-gray-400 mt-0.5">Phase 36.6 production automation pipelines connected to the persistent job engine.</p>
          </div>
          <span className="text-xs text-gray-400 font-mono">{activeAutomations} pipelines</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-px bg-gray-200">
          {SYSTEM_AUTOMATIONS.map((auto) => {
            const stats = automationStats[auto.key];
            const IconComponent = auto.icon;
            return (
              <div
                key={auto.key}
                className="bg-white p-6 flex flex-col gap-3 hover:bg-gray-50/50 transition-colors"
              >
                {/* Automation Header */}
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-xl ${auto.bgColor} ${auto.borderColor} border`}>
                    <IconComponent className={`size-5 ${auto.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-gray-900">{auto.name}</h3>
                    <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed">{auto.description}</p>
                  </div>
                </div>

                {/* Execution Stats */}
                <div className="flex items-center gap-4 mt-1">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="size-3 text-emerald-500" />
                    <span className="text-xs font-mono text-emerald-600 font-semibold">{stats.completed}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <XCircle className="size-3 text-red-400" />
                    <span className="text-xs font-mono text-red-500 font-semibold">{stats.failed}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="size-3 text-amber-400" />
                    <span className="text-xs font-mono text-amber-600 font-semibold">{stats.pending}</span>
                  </div>
                  <span className="ml-auto text-[10px] text-gray-400 font-mono">
                    {stats.total} total
                  </span>
                </div>

                {/* Last Run */}
                {stats.lastRun && (
                  <div className="text-[10px] text-gray-400 border-t border-gray-100 pt-2">
                    Last run: {new Date(stats.lastRun).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
                  </div>
                )}
                {!stats.lastRun && (
                  <div className="text-[10px] text-gray-300 border-t border-gray-100 pt-2 italic">
                    No executions yet
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Event Bus Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Business Events */}
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
          <h2 className="text-base font-bold text-gray-900 mb-4">Business Event Bus</h2>
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Total Events Published</span>
              <span className="font-mono font-bold text-indigo-600">{totalEvents}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Events Processed</span>
              <span className="font-mono font-bold text-emerald-600">{processedEvents}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Events Pending</span>
              <span className="font-mono font-bold text-amber-600">{totalEvents - processedEvents}</span>
            </div>
          </div>
        </div>

        {/* Job Engine Stats */}
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
          <h2 className="text-base font-bold text-gray-900 mb-4">Job Engine Stats</h2>
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Total Jobs Created</span>
              <span className="font-mono font-bold text-indigo-600">{totalJobs}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Jobs Completed</span>
              <span className="font-mono font-bold text-emerald-600">{completedJobs}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Jobs Running</span>
              <span className="font-mono font-bold text-sky-600">{runningJobs}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Jobs Failed</span>
              <span className="font-mono font-bold text-red-500">{failedJobs}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
