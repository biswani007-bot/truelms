"use client";

import React from "react";
import Link from "next/link";
import {
  GraduationCap,
  CreditCard,
  Award,
  Handshake,
  Video,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
} from "lucide-react";

interface ActivityItem {
  id: string;
  type: "student" | "payment" | "certificate" | "lead" | "class" | "assignment" | "system";
  title: string;
  description: string;
  timestamp: string;
  module: string;
  href?: string;
  status: "success" | "warning" | "info" | "error";
}

const activityConfig = {
  student: { icon: <GraduationCap className="size-4" />, bg: "bg-indigo-100", color: "text-indigo-700", initials: "SR" },
  payment: { icon: <CreditCard className="size-4" />, bg: "bg-emerald-100", color: "text-emerald-700", initials: "PY" },
  certificate: { icon: <Award className="size-4" />, bg: "bg-amber-100", color: "text-amber-700", initials: "CE" },
  lead: { icon: <Handshake className="size-4" />, bg: "bg-violet-100", color: "text-violet-700", initials: "CL" },
  class: { icon: <Video className="size-4" />, bg: "bg-sky-100", color: "text-sky-700", initials: "LC" },
  assignment: { icon: <FileText className="size-4" />, bg: "bg-rose-100", color: "text-rose-700", initials: "AS" },
  system: { icon: <CheckCircle2 className="size-4" />, bg: "bg-slate-100", color: "text-slate-700", initials: "SY" },
};

const statusConfig = {
  success: { icon: <CheckCircle2 className="size-3" />, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" },
  warning: { icon: <AlertCircle className="size-3" />, color: "text-amber-600", bg: "bg-amber-50 border-amber-200" },
  info: { icon: <Clock className="size-3" />, color: "text-indigo-600", bg: "bg-indigo-50 border-indigo-200" },
  error: { icon: <AlertCircle className="size-3" />, color: "text-red-600", bg: "bg-red-50 border-red-200" },
};

// Static demo activity feed — in production this would be fetched from an API
const DEMO_ACTIVITIES: ActivityItem[] = [
  {
    id: "1",
    type: "student",
    title: "New Student Registration",
    description: "A new student profile has been submitted and awaits verification.",
    timestamp: "2 min ago",
    module: "Students",
    href: "/admin/students",
    status: "info",
  },
  {
    id: "2",
    type: "payment",
    title: "Invoice Payment Received",
    description: "Invoice payment was processed and receipt generated automatically.",
    timestamp: "8 min ago",
    module: "Finance",
    href: "/admin/finance",
    status: "success",
  },
  {
    id: "3",
    type: "certificate",
    title: "Certificate Approval Pending",
    description: "Certificate request submitted. Awaiting admin review and digital issuance.",
    timestamp: "21 min ago",
    module: "Certificates",
    href: "/admin/certificates",
    status: "warning",
  },
  {
    id: "4",
    type: "lead",
    title: "CRM Lead Converted",
    description: "Lead has been successfully converted to an active enrollment.",
    timestamp: "45 min ago",
    module: "CRM",
    href: "/admin/crm/leads",
    status: "success",
  },
  {
    id: "5",
    type: "class",
    title: "Live Class Scheduled",
    description: "New live class session has been added to the academic calendar.",
    timestamp: "1 hr ago",
    module: "Live Classes",
    href: "/admin/live-classes",
    status: "info",
  },
  {
    id: "6",
    type: "assignment",
    title: "Assignment Submission",
    description: "Student submitted assignment for evaluation. Pending review.",
    timestamp: "2 hrs ago",
    module: "Assignments",
    href: "/admin/assignments",
    status: "info",
  },
];

function ActivityItemCard({ item }: { item: ActivityItem }) {
  const config = activityConfig[item.type];
  const statusCfg = statusConfig[item.status];

  const Wrapper = item.href ? Link : "div";
  const wrapperProps = item.href ? { href: item.href } : {};

  return (
    <Wrapper
      {...(wrapperProps as any)}
      className="group flex items-start gap-4 px-5 py-4 hover:bg-slate-50/80 transition-colors duration-150 border-b border-slate-100/80 last:border-b-0"
    >
      {/* Avatar */}
      <div className={`flex-shrink-0 w-9 h-9 rounded-xl ${config.bg} ${config.color} flex items-center justify-center font-bold text-xs`}>
        {config.icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-slate-800 truncate group-hover:text-indigo-700 transition-colors">
            {item.title}
          </p>
          <span className="text-[11px] text-slate-400 shrink-0 font-medium">{item.timestamp}</span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{item.description}</p>
        <div className="flex items-center gap-2 mt-1.5">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusCfg.bg} ${statusCfg.color}`}>
            {statusCfg.icon}
            {item.module}
          </span>
        </div>
      </div>
    </Wrapper>
  );
}

interface AdminActivityFeedProps {
  activities?: ActivityItem[];
}

export default function AdminActivityFeed({ activities = DEMO_ACTIVITIES }: AdminActivityFeedProps) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900">Platform Activity</h3>
          <p className="text-xs text-slate-500 mt-0.5">Recent events across all modules</p>
        </div>
        <Link
          href="/admin/timeline"
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
        >
          View All Activity →
        </Link>
      </div>

      {/* Activity Items */}
      <div className="divide-y divide-slate-50">
        {activities.map((item) => (
          <ActivityItemCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
