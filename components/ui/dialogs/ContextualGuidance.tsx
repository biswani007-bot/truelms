"use client";

import React, { useState, useEffect } from "react";
import { EnterpriseDialog } from "./EnterpriseDialog";
import { Sparkles, GraduationCap, UsersRound, Handshake, Wallet, FileBarChart, Settings } from "lucide-react";

export type GuidanceKey =
  | "executive-dashboard"
  | "student-directory"
  | "teacher-directory"
  | "crm-pipeline"
  | "finance-workspace"
  | "reports-analytics"
  | "platform-settings";

export interface GuidanceConfig {
  key: GuidanceKey;
  title: string;
  subtitle: string;
  description: string;
  primaryLabel?: string;
  icon: React.ReactNode;
}

export const GUIDANCE_CONFIGS: Record<GuidanceKey, GuidanceConfig> = {
  "executive-dashboard": {
    key: "executive-dashboard",
    title: "Executive Command Center",
    subtitle: "Real-time Operational Platform Overview",
    description:
      "View real-time operational insights including active student enrollment, faculty metrics, revenue velocity, admissions pipeline, and academic delivery performance.",
    primaryLabel: "Get Started",
    icon: <Sparkles className="size-5" />,
  },
  "student-directory": {
    key: "student-directory",
    title: "Student Management Workspace",
    subtitle: "Academic Registrations & Profiles",
    description:
      "Manage student registrations, academic qualification records, parent guardian links, attendance records, and active batch assignments from one unified workspace.",
    primaryLabel: "Explore Workspace",
    icon: <GraduationCap className="size-5" />,
  },
  "teacher-directory": {
    key: "teacher-directory",
    title: "Faculty Management Workspace",
    subtitle: "Instructor Schedules & Performance",
    description:
      "Manage academic instructors, department assignments, weekly working availability, leave booking history, and submission evaluation workloads.",
    primaryLabel: "Explore Faculty",
    icon: <UsersRound className="size-5" />,
  },
  "crm-pipeline": {
    key: "crm-pipeline",
    title: "Admissions & Lead CRM",
    subtitle: "Pipeline Stages & Follow-ups",
    description:
      "Track incoming prospective lead enquiries, schedule counselling sessions and live demos, manage follow-up tasks, and seamlessly convert qualified leads into enrolled students.",
    primaryLabel: "Continue to CRM",
    icon: <Handshake className="size-5" />,
  },
  "finance-workspace": {
    key: "finance-workspace",
    title: "Finance & Invoicing Workspace",
    subtitle: "Revenue, Receipts & Fee Plans",
    description:
      "Manage fee structures, automated student billing invoices, partial payment logs, payment receipts, refund approvals, and financial revenue summaries.",
    primaryLabel: "Open Finance",
    icon: <Wallet className="size-5" />,
  },
  "reports-analytics": {
    key: "reports-analytics",
    title: "Reports & Analytics Engine",
    subtitle: "Operational & Academic Intelligence",
    description:
      "Generate and export comprehensive operational CSV reports, academic performance metrics, financial revenue logs, and student attendance audit histories.",
    primaryLabel: "View Reports",
    icon: <FileBarChart className="size-5" />,
  },
  "platform-settings": {
    key: "platform-settings",
    title: "Platform Settings & Governance",
    subtitle: "Multi-tenant Configuration & Security",
    description:
      "Configure organization details, portal access policies, role-based access rules (RBAC), security session policies, notification templates, and system webhooks.",
    primaryLabel: "Configure Settings",
    icon: <Settings className="size-5" />,
  },
};

const STORAGE_PREFIX = "lmsca_guidance_dismissed_";

export function useContextualGuidance(key: GuidanceKey) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const dismissed = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
      if (!dismissed) {
        setIsOpen(true);
      }
    }
  }, [key]);

  const dismiss = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem(`${STORAGE_PREFIX}${key}`, "true");
    }
    setIsOpen(false);
  };

  return { isOpen, dismiss };
}

export function ContextualGuidanceBanner({ guidanceKey }: { guidanceKey: GuidanceKey }) {
  const { isOpen, dismiss } = useContextualGuidance(guidanceKey);
  const config = GUIDANCE_CONFIGS[guidanceKey];

  if (!config) return null;

  return (
    <EnterpriseDialog
      isOpen={isOpen}
      onClose={dismiss}
      title={config.title}
      subtitle={config.subtitle}
      description={config.description}
      variant="info"
      icon={config.icon}
      confirmLabel={config.primaryLabel || "Understand"}
      cancelLabel="Dismiss"
      onConfirm={dismiss}
    />
  );
}
