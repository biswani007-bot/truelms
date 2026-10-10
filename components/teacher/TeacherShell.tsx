"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ToastProvider } from "../ui/dialogs/ToastProvider";
import {
  LayoutDashboard,
  Users,
  Video,
  CheckSquare,
  ClipboardCheck,
  GraduationCap,
  Award,
  Calendar,
  Bell,
  BarChart3,
  LogOut,
  Menu,
  X,
  ChevronDown,
  MessageSquare,
  HeartHandshake,
  Settings
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const PRIMARY_NAV_ITEMS: NavItem[] = [
  { href: "/teacher/dashboard", label: "Overview", icon: <LayoutDashboard className="w-4 h-4" /> },
  { href: "/teacher/batches", label: "My Batches", icon: <Users className="w-4 h-4" /> },
  { href: "/teacher/live-classes", label: "Live Classroom", icon: <Video className="w-4 h-4" /> },
  { href: "/teacher/assignments", label: "Assignments & Grading", icon: <ClipboardCheck className="w-4 h-4" /> },
  { href: "/teacher/calendar", label: "Schedule", icon: <Calendar className="w-4 h-4" /> },
];

const SECONDARY_NAV_ITEMS: NavItem[] = [
  { href: "/teacher/attendance", label: "Attendance", icon: <CheckSquare className="w-4 h-4" /> },
  { href: "/teacher/assessments", label: "Assessments", icon: <GraduationCap className="w-4 h-4" /> },
  { href: "/teacher/gradebook", label: "Gradebook", icon: <Award className="w-4 h-4" /> },
  { href: "/teacher/communication", label: "Conversation", icon: <MessageSquare className="w-4 h-4" /> },
  { href: "/teacher/notifications", label: "Notifications", icon: <Bell className="w-4 h-4" /> },
  { href: "/teacher/reports", label: "Reports", icon: <BarChart3 className="w-4 h-4" /> },
];

const ALL_NAV_ITEMS = [...PRIMARY_NAV_ITEMS, ...SECONDARY_NAV_ITEMS];
// Note: ALL_NAV_ITEMS retained for reference; dynamic list is computed in the component.

export default function TeacherShell({ 
  children, 
  teacher 
}: { 
  children: React.ReactNode, 
  teacher: any 
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  // Dynamically inject Counselling Requests for counsellors
  const secondaryNavItems: NavItem[] = [
    ...SECONDARY_NAV_ITEMS,
    ...(teacher?.isCounsellor
      ? [{ href: "/teacher/counselling", label: "Counselling Requests", icon: <HeartHandshake className="w-4 h-4" /> }]
      : []),
  ];
  const allNavItems = [...PRIMARY_NAV_ITEMS, ...secondaryNavItems];

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Continue to redirect
    }
    window.location.href = "/login";
  };

  // Close more menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setMoreMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const initials = teacher ? `${teacher.firstName?.charAt(0) || ""}${teacher.lastName?.charAt(0) || ""}` : "T";

  return (
    <ToastProvider>
      <div 
        className="flex h-screen overflow-hidden text-slate-800 font-sans flex-col relative z-0"
        style={{ background: "radial-gradient(circle at 10% 20%, #f7e6f8 0%, #ede9fe 25%, #e0f2fe 55%, #fce7f3 80%, #fdf4ff 100%)", backgroundAttachment: "fixed" }}
      >
      {/* Ambient glow blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-purple-300/40 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-24 w-80 h-80 bg-pink-200/40 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 left-1/4 w-96 h-96 bg-sky-200/50 rounded-full blur-3xl" />
      </div>

      {/* ── Top Header / Navigation ────────────────────────────────────────────── */}
      <header className="h-[76px] sm:h-[80px] shrink-0 border-b border-white/20 bg-white/70 backdrop-blur-[16px] shadow-[0_4px_30px_rgba(0,0,0,0.02)] flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30">
        
        {/* Left: Logo & Mobile Hamburger */}
        <div className="flex items-center gap-4 min-w-[200px]">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2 -ml-2 rounded-xl text-slate-600 hover:bg-slate-100 transition"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Link href="/teacher/dashboard" className="flex items-center shrink-0">
            <img
              src="/TrueLernLogo_horizontal.png"
              alt="TrueLern Faculty Workspace"
              className="h-10 sm:h-12 w-auto object-contain"
            />
          </Link>
        </div>

        {/* Center: Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2 mx-4 justify-center">
          {PRIMARY_NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/teacher/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3 xl:px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? "bg-slate-900 text-white shadow-md border border-slate-800"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent"
                }`}
              >
                <span className={isActive ? "text-white" : "text-slate-400"}>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}

          {/* More Dropdown */}
          <div className="relative" ref={moreMenuRef}>
            <button
              onClick={() => setMoreMenuOpen(!moreMenuOpen)}
              className={`flex items-center gap-2 px-3 xl:px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 border border-transparent ${
                moreMenuOpen || secondaryNavItems.some(i => pathname.startsWith(i.href))
                  ? "bg-slate-100 text-slate-900"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <span>More</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${moreMenuOpen ? "rotate-180" : ""}`} />
            </button>
            {moreMenuOpen && (
              <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50">
                {secondaryNavItems.map((item) => {
                  const isActive = pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMoreMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                        isActive
                          ? "bg-slate-900 text-white font-bold rounded-xl"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium rounded-xl"
                      }`}
                    >
                      <span className={isActive ? "text-white" : "text-slate-400"}>{item.icon}</span>
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </nav>

        {/* Right: Profile & Actions */}
        <div className="flex items-center justify-end gap-3 min-w-[200px]">
          <Link
            href="/teacher/notifications"
            className="relative p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
          >
            <Bell className="w-5 h-5" />
          </Link>
          <div className="relative" ref={profileMenuRef}>
            <button
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              className="hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200/60 shadow-sm hover:bg-slate-100 transition-colors"
            >
              <div className="text-right">
                <h4 className="text-xs font-bold text-slate-800 leading-tight">
                  {teacher ? `${teacher.firstName} ${teacher.lastName}` : "Faculty"}
                </h4>
                <p className="text-[10px] font-medium text-slate-500">
                  {teacher?.designation || "Tutor Portal"}
                </p>
              </div>
              <div className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-[#7C3AED]/30 bg-gradient-to-br from-indigo-500 to-rose-400 flex items-center justify-center text-white font-bold text-xs shrink-0">
                {initials}
              </div>
            </button>
            {profileMenuOpen && (
              <div className="absolute top-full mt-2 right-0 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50">
                <Link
                  href="/teacher/profile"
                  onClick={() => setProfileMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                >
                  <Users className="w-4 h-4" />
                  <span>Profile</span>
                </Link>
                <Link
                  href="/teacher/settings"
                  onClick={() => setProfileMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </Link>
                <div className="h-px bg-slate-100 my-1" />
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 transition-colors font-medium text-left"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Mobile Drawer ──────────────────────────────────────────────────────── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] bg-white flex flex-col h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            <div className="h-[72px] flex items-center justify-between px-6 border-b border-slate-100 shrink-0">
              <img
                src="/TrueLernLogo_horizontal.png"
                alt="TrueLern"
                className="h-7 w-auto object-contain"
              />
              <button
                onClick={() => setMobileOpen(false)}
                className="p-2 -mr-2 rounded-xl hover:bg-slate-100 text-slate-500 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-rose-400 flex items-center justify-center text-white font-bold text-sm shrink-0">
                {initials}
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800 leading-tight">
                  {teacher ? `${teacher.firstName} ${teacher.lastName}` : "Faculty"}
                </h4>
                <p className="text-[11px] font-medium text-slate-500">
                  {teacher?.designation || "Tutor Portal"}
                </p>
              </div>
            </div>

            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
              <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 mt-2">Primary</p>
              {PRIMARY_NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/teacher/dashboard" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${
                      isActive ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <span className={isActive ? "text-white" : "text-slate-400"}>{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
              
              <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 mt-6">Management & Reports</p>
              {secondaryNavItems.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${
                      isActive ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <span className={isActive ? "text-white" : "text-slate-400"}>{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="p-4 border-t border-slate-100 shrink-0">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition text-left"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Main Content Area ────────────────────────────────────────────────── */}
      <main className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 lg:px-8 xl:px-10 pt-6 sm:pt-8 pb-10 sm:pb-12">
        <div className="max-w-[1600px] mx-auto w-full">
          {children}
        </div>
      </main>
      </div>
    </ToastProvider>
  );
}
