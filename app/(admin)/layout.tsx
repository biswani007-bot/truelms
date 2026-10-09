"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import GlobalSearch from "../../components/GlobalSearch";
import { ToastProvider } from "@/components/ui/dialogs/ToastProvider";
import {
  LayoutDashboard,
  ShieldCheck,
  Settings,
  Users,
  GraduationCap,
  HeartHandshake,
  UsersRound,
  BookOpen,
  ClipboardList,
  Layers,
  Users2,
  Video,
  CheckCircle2,
  FileText,
  BarChart3,
  Award,
  Handshake,
  Wallet,
  FileBarChart,
  Bell,
  Zap,
  Network,
  Globe,
  Database,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Sparkles,
  Plus,
  ChevronRight as Chevron,
  Menu,
} from "lucide-react";

// ─── JWT helpers ─────────────────────────────────────────────────
function parseJwt(token: string) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

function getCookie(name: string) {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift();
  return null;
}

// ─── Breadcrumb label map ─────────────────────────────────────────
const BREADCRUMB_LABELS: Record<string, string> = {
  admin:        "Dashboard",
  students:     "Students",
  teachers:     "Faculty",
  courses:      "Courses",
  enrollments:  "Enrollments",
  batches:      "Batches",
  cohorts:      "Cohorts",
  parents:      "Parents & Guardians",
  "live-classes":"Live Classes",
  attendance:   "Attendance",
  assignments:  "Assignments",
  assessments:  "Assessments",
  certificates: "Certificates",
  finance:      "Finance",
  crm:          "CRM",
  leads:        "Leads",
  reports:      "Reports",
  operational:  "Operational",
  notifications:"Notifications",
  workflows:    "Automations",
  builder:      "Builder",
  gateway:      "API Access",
  storage:      "Storage",
  security:     "Audit Logs",
  settings:     "Settings",
  roles:        "Roles & Permissions",
  users:        "Users",
  health:       "System Status",
};

// ─── Role config ─────────────────────────────────────────────────
const ROLE_CONFIG: Record<
  string,
  { label: string; avatarBg: string; avatarColor: string; initials: string }
> = {
  "super-admin":        { label: "Super Admin",      avatarBg: "bg-violet-100", avatarColor: "text-violet-700", initials: "SA" },
  admin:                { label: "Admin",             avatarBg: "bg-indigo-100", avatarColor: "text-indigo-700", initials: "AD" },
  "operations-manager": { label: "Ops Manager",      avatarBg: "bg-amber-100",  avatarColor: "text-amber-700",  initials: "OM" },
  "academic-manager":   { label: "Academic Manager", avatarBg: "bg-sky-100",    avatarColor: "text-sky-700",    initials: "AM" },
  "finance-manager":    { label: "Finance Manager",  avatarBg: "bg-emerald-100",avatarColor: "text-emerald-700",initials: "FM" },
};

// ─── Nav types ───────────────────────────────────────────────────
interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

interface NavSection {
  heading: string;
  items: NavItem[];
}

// ─── NavLink ─────────────────────────────────────────────────────
function NavLink({ href, label, icon }: NavItem) {
  const pathname = usePathname();
  const isActive =
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={`
        flex items-center gap-3 px-3 py-2 rounded-xl lms-sidebar-nav transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500
        ${isActive
          ? "text-white font-semibold shadow-md shadow-purple-600/25"
          : "text-slate-600 hover:bg-slate-200/50 hover:text-slate-900"
        }
      `}
      style={isActive ? { background: 'linear-gradient(135deg, #5B13DF 0%, #7623FA 100%)' } : {}}
    >
      <span className="shrink-0">{icon}</span>
      <span className="truncate">{label}</span>
    </Link>
  );
}

// ─── Main layout ─────────────────────────────────────────────────
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [role, setRole] = useState("admin");
  const pathname = usePathname();

  // Close mobile drawer on route change
  useEffect(() => {
    if (mobileDrawerOpen) setMobileDrawerOpen(false);
  }, [pathname]);

  // ESC key handling for mobile drawer
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mobileDrawerOpen) {
        setMobileDrawerOpen(false);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [mobileDrawerOpen]);
  useEffect(() => {
    const token = getCookie("accessToken");
    if (token) {
      const payload = parseJwt(token);
      if (payload?.role) setRole(payload.role);
    }
  }, []);

  const getVisibleNav = (): NavSection[] => [
    {
      heading: "Overview",
      items: [
        { href: "/admin",          label: "Dashboard",           icon: <LayoutDashboard className="size-4" /> },
        { href: "/admin/health",   label: "System Status",       icon: <ShieldCheck className="size-4" /> },
        { href: "/admin/settings", label: "Settings",            icon: <Settings className="size-4" /> },
        { href: "/admin/users",    label: "Users",               icon: <Users className="size-4" /> },
        { href: "/admin/roles",    label: "Roles & Permissions", icon: <ShieldCheck className="size-4" /> },
      ],
    },
    {
      heading: "Academic Management",
      items: [
        { href: "/admin/students",    label: "Students",            icon: <GraduationCap className="size-4" /> },
        { href: "/admin/parents",     label: "Parents & Guardians", icon: <HeartHandshake className="size-4" /> },
        { href: "/admin/teachers",    label: "Faculty",             icon: <UsersRound className="size-4" /> },
        { href: "/admin/courses",     label: "Courses",             icon: <BookOpen className="size-4" /> },
        { href: "/admin/enrollments", label: "Enrollments",         icon: <ClipboardList className="size-4" /> },
        { href: "/admin/cohorts",     label: "Cohorts",             icon: <Layers className="size-4" /> },
        { href: "/admin/batches",     label: "Batches",             icon: <Users2 className="size-4" /> },
      ],
    },
    {
      heading: "Classes & Evaluation",
      items: [
        { href: "/admin/live-classes",  label: "Live Classes",  icon: <Video className="size-4" /> },
        { href: "/admin/attendance",    label: "Attendance",    icon: <CheckCircle2 className="size-4" /> },
        { href: "/admin/assignments",   label: "Assignments",   icon: <FileText className="size-4" /> },
        { href: "/admin/assessments",   label: "Assessments",   icon: <BarChart3 className="size-4" /> },
        { href: "/admin/certificates",  label: "Certificates",  icon: <Award className="size-4" /> },
      ],
    },
    {
      heading: "Business & Revenue",
      items: [
        { href: "/admin/crm/leads",          label: "CRM & Admissions", icon: <Handshake className="size-4" /> },
        { href: "/admin/crm/demos",          label: "Demo Sessions",    icon: <Video className="size-4" /> },
        { href: "/admin/finance",            label: "Finance",          icon: <Wallet className="size-4" /> },
        { href: "/admin/reports/operational",label: "Reports",          icon: <FileBarChart className="size-4" /> },
      ],
    },
    {
      heading: "Platform",
      items: [
        { href: "/admin/security",      label: "Audit Logs",     icon: <ShieldCheck className="size-4" /> },
        { href: "/admin/notifications", label: "Notifications",  icon: <Bell className="size-4" /> },
        { href: "/admin/workflows",     label: "Automations",    icon: <Zap className="size-4" /> },
        { href: "/admin/gateway",       label: "API Access",     icon: <Network className="size-4" /> },
        { href: "/admin/storage",       label: "Storage",        icon: <Database className="size-4" /> },
        { href: "/cms/dashboard",       label: "Content",        icon: <Globe className="size-4 text-indigo-600" /> },
      ],
    },
  ];

  const navSections = getVisibleNav();
  const roleConfig =
    ROLE_CONFIG[role] ?? {
      label: "Staff",
      avatarBg: "bg-slate-100",
      avatarColor: "text-slate-700",
      initials: "ES",
    };

  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbItems = segments.map((seg, idx) => {
    const label = BREADCRUMB_LABELS[seg] ?? seg.charAt(0).toUpperCase() + seg.slice(1);
    const href = "/" + segments.slice(0, idx + 1).join("/");
    return { label, href };
  });

  return (
    <ToastProvider>
      <div className="flex h-[100dvh] overflow-hidden text-slate-900 font-sans antialiased bg-[#E9EDF5]">
        {/* ── Sidebar ── */}
        <aside
          className={`hidden lg:flex ${
            collapsed ? "w-[68px]" : "w-[260px]"
          } shrink-0 border-r border-slate-200/90 bg-[#F2F5FA] flex-col transition-all duration-300 ease-in-out z-20`}
        >
          {/* Brand */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100 shrink-0">
            {!collapsed ? (
              <Link href="/admin" className="flex items-center gap-2 group min-w-0">
                <img
                  src="/TrueLernLogo_horizontal.png"
                  alt="TrueLern Admin"
                  className="h-10 w-auto object-contain"
                />
              </Link>
            ) : (
              <Link href="/admin" className="flex items-center justify-center w-full">
                <img
                  src="/Truelernlogo_favicon.png"
                  alt="TrueLern"
                  className="w-7 h-7 object-contain"
                />
              </Link>
            )}

            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100/80 transition-colors ml-auto active-scale focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? (
                <ChevronRight className="size-4" />
              ) : (
                <ChevronLeft className="size-4" />
              )}
            </button>
          </div>

          {/* Navigation */}
          <nav
            className="flex-1 overflow-y-auto py-4 space-y-5"
            style={{ padding: collapsed ? "16px 8px" : "16px 10px" }}
            aria-label="Main navigation"
          >
            {navSections.map((section) => (
              <div key={section.heading} className="space-y-0.5">
                {!collapsed && (
                  <p className="px-3 pb-1.5 lms-label text-[10px]">
                    {section.heading}
                  </p>
                )}
                <div className="space-y-0.5">
                  {section.items.map((item) =>
                    collapsed ? (
                      <Link
                        key={item.href}
                        href={item.href}
                        title={item.label}
                        aria-current={
                          (item.href === "/admin"
                            ? pathname === "/admin"
                            : pathname.startsWith(item.href))
                            ? "page"
                            : undefined
                        }
                        onClick={() => setMobileDrawerOpen(false)}
                        className={`
                          flex items-center justify-center h-11 w-11 mx-auto rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500
                          ${
                            (item.href === "/admin"
                              ? pathname === "/admin"
                              : pathname.startsWith(item.href))
                              ? "bg-indigo-600 text-white"
                              : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                          }
                        `}
                      >
                        {item.icon}
                      </Link>
                    ) : (
                      <NavLink key={item.href} {...item} />
                    )
                  )}
                </div>
              </div>
            ))}
          </nav>

          {/* User Profile Footer & Platform Management Widget */}
          {!collapsed && (
            <div className="p-3 border-t border-slate-200/70 text-center flex flex-col items-center bg-[#F2F5FA] shrink-0 mt-auto">
              <div className="relative w-16 h-12 flex items-center justify-center mb-1">
                <Settings className="text-purple-600 size-7" />
                <span className="absolute -top-1 right-2 bg-indigo-100 rounded-full w-2 h-2"></span>
              </div>
              <p className="text-[11px] font-bold text-slate-700 leading-tight">Platform Management<br/>Admin</p>
              
              <div className="mt-3 w-full border-t border-slate-200/50 pt-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] ${roleConfig.avatarBg} ${roleConfig.avatarColor}`}>
                    {roleConfig.initials}
                  </div>
                  <div className="text-left">
                    <span className="block lms-caption text-[9px] font-semibold leading-tight">{roleConfig.label}</span>
                  </div>
                </div>
                <a
                  href="/api/auth/logout"
                  title="Sign Out"
                  className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                >
                  <LogOut className="size-3.5" />
                </a>
              </div>
            </div>
          )}
        </aside>

        {/* Mobile Drawer (hidden on lg and up) */}
        {mobileDrawerOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/30 z-30"
              onClick={() => setMobileDrawerOpen(false)}
              aria-hidden="true"
            ></div>
            <aside
              className="fixed inset-y-0 left-0 w-72 bg-white shadow-xl z-40 flex flex-col transition-transform duration-200 ease-in-out"
              aria-label="Admin navigation drawer"
            >
              {/* Reuse navigation same as desktop */}
              <nav className="flex-1 overflow-y-auto py-4 space-y-5" aria-label="Mobile navigation">
                {navSections.map((section) => (
                  <div key={section.heading} className="space-y-0.5">
                    <p className="px-3 pb-1.5 lms-label text-[10px]">{section.heading}</p>
                    <div className="space-y-0.5">
                      {section.items.map((item) => (
                        <NavLink key={item.href} {...item} />
                      ))}
                    </div>
                  </div>
                ))}
              </nav>
              {/* Close button */}
              <button
                onClick={() => setMobileDrawerOpen(false)}
                className="p-2 m-2 self-start rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                aria-label="Close navigation drawer"
              >
                <ChevronLeft className="size-5" />
              </button>
            </aside>
          </>
        )}

        {/* ── Main Canvas ── */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Header */}
          <header className="h-14 border-b border-slate-200/60 bg-transparent flex items-center justify-between px-3 sm:px-6 shrink-0 gap-3 z-10">
            {/* Mobile menu toggle */}
            <button
              className="lg:hidden p-1 rounded hover:bg-slate-200/60 transition"
              onClick={() => setMobileDrawerOpen(true)}
              aria-label="Open navigation drawer"
              aria-expanded={mobileDrawerOpen}
              aria-controls="admin-drawer"
            >
              <Menu className="size-5" />
            </button>
            {/* Breadcrumb */}
            <nav aria-label="Page breadcrumb" className="flex items-center gap-1.5 lms-breadcrumb-text min-w-0">
              {breadcrumbItems.map((crumb, idx) => (
                <React.Fragment key={idx}>
                  {idx > 0 && (
                    <Chevron className="size-3 text-slate-300 shrink-0" />
                  )}
                  {idx === breadcrumbItems.length - 1 ? (
                    <span className="text-indigo-600 font-bold truncate max-w-[200px]">
                      {crumb.label}
                    </span>
                  ) : (
                    <Link
                      href={crumb.href}
                      className="text-slate-400 hover:text-slate-700 transition-colors truncate max-w-[120px]"
                    >
                      {crumb.label}
                    </Link>
                  )}
                </React.Fragment>
              ))}
            </nav>

            {/* Header Actions */}
            <div className="flex items-center gap-4 shrink-0">
              {/* Global Search / Command Palette */}
              <div className="hidden md:block flex-1 max-w-md mx-6">
                <GlobalSearch />
              </div>

              {/* System Action Icons */}
              <div className="flex items-center gap-2.5 text-slate-600">
                <button className="p-1.5 rounded-full hover:bg-slate-200/60 transition" title="Dark Mode">
                  <span className="text-base leading-none">🌙</span>
                </button>
                <button
                  type="button"
                  className="relative p-1.5 rounded-full hover:bg-slate-200/60 transition"
                  aria-label="View notifications"
                >
                  <Bell className="size-4.5" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-600 ring-2 ring-white" />
                </button>
              </div>

              {/* Vertical Divider */}
              <div className="h-6 w-px bg-slate-300"></div>

              {/* Header Admin Status */}
              <div className="flex items-center gap-2.5">
                <div className="text-right hidden sm:block">
                  <span className="text-[12px] font-bold text-slate-800 block leading-tight">Platform</span>
                  <span className="text-[10px] text-slate-500 font-medium">{roleConfig.label}</span>
                </div>
                <div className="relative w-8 h-8 rounded-full p-0.5 bg-gradient-to-r from-blue-500 to-indigo-600 shadow-sm">
                  <div className="w-full h-full rounded-full bg-slate-800 flex items-center justify-center text-white overflow-hidden text-[10px] font-bold">
                    {roleConfig.initials}
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 overflow-y-auto w-full" style={{ padding: "var(--lms-page-padding)" }}>
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
