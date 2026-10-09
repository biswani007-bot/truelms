"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Video,
  ClipboardList,
  GraduationCap,
  Award,
  Calendar,
  Bell,
  User,
  LogOut,
  Menu,
  X,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/student/dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
  { href: "/student/courses", label: "My Courses", icon: <BookOpen className="w-4 h-4" /> },
  { href: "/student/live-classes", label: "Live Classes", icon: <Video className="w-4 h-4" /> },
  { href: "/student/assignments", label: "Assignments", icon: <ClipboardList className="w-4 h-4" /> },
  { href: "/student/assessments", label: "Assessments", icon: <GraduationCap className="w-4 h-4" /> },
  { href: "/student/grades", label: "Grades", icon: <CheckCircle2 className="w-4 h-4" /> },
  { href: "/student/attendance", label: "Attendance", icon: <CheckCircle2 className="w-4 h-4" /> },
  { href: "/student/certificates", label: "Certificates", icon: <Award className="w-4 h-4" /> },
  { href: "/student/calendar", label: "Calendar", icon: <Calendar className="w-4 h-4" /> },
  { href: "/student/communication", label: "Notifications", icon: <Bell className="w-4 h-4" /> },
  { href: "/student/profile", label: "My Profile", icon: <User className="w-4 h-4" /> },
];

function NavLink({ item, onClick }: { item: NavItem; onClick?: () => void }) {
  const pathname = usePathname();
  const isActive =
    pathname === item.href ||
    (item.href !== "/student/dashboard" && pathname.startsWith(item.href));

  return (
    <Link
      href={item.href}
      onClick={onClick}
      aria-current={isActive ? "page" : undefined}
      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
        isActive
          ? "bg-indigo-600 text-white shadow-sm shadow-indigo-200 font-semibold"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      }`}
    >
      <span className={`shrink-0 ${isActive ? "text-white" : "text-slate-500"}`}>{item.icon}</span>
      <span>{item.label}</span>
    </Link>
  );
}

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50/70 text-slate-800 font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 border-r border-slate-200 bg-white flex-col shadow-sm">
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 border-b border-slate-100 shrink-0">
          <Link href="/student/dashboard" className="flex items-center">
            <img
              src="/TrueLernLogo_horizontal.png"
              alt="TrueLern Student Portal"
              className="h-9 w-auto object-contain"
            />
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-5 px-4 space-y-1">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </nav>

        {/* Sign Out Footer */}
        <div className="p-4 border-t border-slate-100 shrink-0">
          <a
            href="/api/auth/logout"
            className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </a>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-64 max-w-[80vw] bg-white flex flex-col h-full shadow-2xl z-10">
            <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">
                  TL
                </div>
                <span className="font-bold text-slate-900 text-sm">Student Portal</span>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
              {NAV_ITEMS.map((item) => (
                <NavLink key={item.href} item={item} onClick={() => setMobileOpen(false)} />
              ))}
            </nav>
            <div className="p-4 border-t border-slate-100">
              <a
                href="/api/auth/logout"
                className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 border-b border-slate-200/80 flex items-center justify-between px-4 sm:px-8 bg-white shrink-0 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 hidden sm:inline">
              Student Learning Experience
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/student/profile"
              className="flex items-center gap-2 text-xs font-medium text-slate-600 hover:text-indigo-600 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200 transition"
            >
              <User className="w-3.5 h-3.5 text-indigo-600" />
              <span>My Account</span>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 sm:p-8 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
