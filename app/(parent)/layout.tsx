"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  GraduationCap,
  LayoutDashboard,
  CalendarCheck,
  BookOpen,
  FileText,
  CheckCircle2,
  Video,
  PlaySquare,
  CreditCard,
  Award,
  Bell,
  LogOut,
  ChevronDown,
  User,
  Menu,
  X,
  Users,
  PlusCircle,
  Settings,
  MessageSquare,
  HeartHandshake,
} from "lucide-react";
import { ParentChildProvider, useParentChild } from "@/components/parent/parent-child-context";

const PRIMARY_NAV_ITEMS = [
  { label: "Dashboard", href: "/parent/dashboard", icon: LayoutDashboard },
  { label: "My Children", href: "/parent/children", icon: Users },
  { label: "Messages", href: "/parent/messages", icon: MessageSquare },
  { label: "Academics", href: "/parent/academics", icon: BookOpen },
];

const SECONDARY_NAV_ITEMS = [
  { label: "Attendance", href: "/parent/attendance", icon: CalendarCheck },
  { label: "Assignments", href: "/parent/assignments", icon: FileText },
  { label: "Assessments", href: "/parent/assessments", icon: CheckCircle2 },
  { label: "Certificates", href: "/parent/certificates", icon: Award },
  { label: "Live Classes", href: "/parent/live-classes", icon: Video },
  { label: "Revision", href: "/parent/revision", icon: PlaySquare },
  { label: "Counselling", href: "/parent/counselling", icon: HeartHandshake },
  { label: "Finance", href: "/parent/finance", icon: CreditCard },
  { label: "Settings", href: "/parent/settings", icon: Settings },
];

function ParentShellInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { children: linkedChildren, selectedChild, setSelectedChild, loading } = useParentChild();
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [childMenuOpen, setChildMenuOpen] = useState(false);
  
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const childMenuRef = useRef<HTMLDivElement>(null);

  const [parentProfile, setParentProfile] = useState<{ firstName: string; lastName: string } | null>(null);

  useEffect(() => {
    fetch("/api/parent/profile")
      .then(res => res.json())
      .then(json => {
        if (json.success && json.data && json.data.profile) {
          setParentProfile(json.data.profile);
        }
      })
      .catch(console.error);
  }, []);

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setMoreMenuOpen(false);
      }
      if (childMenuRef.current && !childMenuRef.current.contains(event.target as Node)) {
        setChildMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      window.location.href = "/api/auth/logout";
    } catch {
      // ignore
    }
    router.push("/login");
  };

  return (
    <div 
      className="h-[100dvh] overflow-hidden flex flex-col text-slate-800 font-sans relative z-0"
      style={{ background: "linear-gradient(135deg,#F3E8FF 0%,#E0F2FE 50%,#FFFFFF 100%)" }}
    >
      
      {/* ── Top Header / Navigation ────────────────────────────────────────────── */}
      <header className="h-[68px] md:h-[76px] shrink-0 border border-white/60 bg-white/75 backdrop-blur-[20px] shadow-[0_8px_30px_rgba(0,0,0,0.04)] rounded-[24px] mt-3 mx-4 flex items-center justify-between px-4 sm:px-6 sticky top-3 z-40">
        
        {/* Left: Logo & Mobile Hamburger */}
        <div className="flex items-center gap-4 min-w-[200px]">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden p-2 -ml-2 rounded-xl text-slate-600 hover:bg-slate-100 transition"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center">
            <Link href="/parent/dashboard" className="flex items-center shrink-0">
              <img
                src="/TrueLernLogo_horizontal.png"
                alt="TrueLern Parent Portal"
                className="h-10 sm:h-12 w-auto object-contain"
              />
            </Link>
            <div className="hidden sm:flex flex-col ml-3">
              <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold leading-tight">Signed in as</span>
              <span className="text-xs font-bold text-emerald-700 leading-tight">
                {parentProfile ? `${parentProfile.firstName} ${parentProfile.lastName}` : "Guardian"}
              </span>
            </div>
          </div>
        </div>

        {/* Center: Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1 xl:gap-2 mx-4 justify-center">
          {PRIMARY_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/parent/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3 xl:px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? "bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-100"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-emerald-600" : "text-slate-400"}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}

          {/* More Dropdown */}
          <div className="relative" ref={moreMenuRef}>
            <button
              onClick={() => setMoreMenuOpen(!moreMenuOpen)}
              className={`flex items-center gap-2 px-3 xl:px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 border border-transparent ${
                moreMenuOpen || SECONDARY_NAV_ITEMS.some(i => pathname.startsWith(i.href))
                  ? "bg-slate-100 text-slate-900"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <span>More</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${moreMenuOpen ? "rotate-180" : ""}`} />
            </button>
            {moreMenuOpen && (
              <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50">
                {SECONDARY_NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMoreMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                        isActive
                          ? "bg-emerald-50 text-emerald-700 font-bold"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium"
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? "text-emerald-600" : "text-slate-400"}`} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </nav>

        {/* Right: Profile & Selected Child */}
        <div className="flex items-center justify-end gap-3 min-w-[200px]">
          {/* Child Switcher */}
          <div className="hidden sm:block relative" ref={childMenuRef}>
            {loading ? (
              <div className="h-10 w-32 bg-slate-100 rounded-full animate-pulse" />
            ) : linkedChildren.length > 0 ? (
              <>
                <button
                  onClick={() => setChildMenuOpen(!childMenuOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-full hover:bg-slate-50 transition shadow-sm"
                >
                  <div className="hidden md:flex flex-col text-right mr-1">
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold leading-tight">Learning Hub</span>
                    <span className="text-xs font-bold text-slate-800 leading-tight max-w-[100px] truncate">
                      {selectedChild ? selectedChild.firstName : "Child"}
                    </span>
                  </div>
                  <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold shrink-0">
                    {selectedChild?.firstName?.[0] || "C"}
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
                </button>
                {childMenuOpen && (
                  <div className="absolute top-full right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl py-1.5 z-50 overflow-hidden">
                    {linkedChildren.map((c) => (
                      <button
                        key={c.studentId}
                        onClick={() => {
                          setSelectedChild(c);
                          setChildMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm transition ${
                          selectedChild?.studentId === c.studentId
                            ? "bg-emerald-50 text-emerald-800 font-bold"
                            : "hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold">
                          {c.firstName[0]}
                        </div>
                        <div className="truncate">
                          <p className="truncate">{c.firstName} {c.lastName}</p>
                          <p className="text-[10px] text-slate-500 font-normal capitalize">{c.relationshipType}</p>
                        </div>
                      </button>
                    ))}
                    <div className="border-t border-slate-100 mt-1 pt-1 px-1">
                      <Link
                        href="/parent/children?add=true"
                        onClick={() => setChildMenuOpen(false)}
                        className="w-full flex items-center gap-2 px-2.5 py-2 text-left text-xs font-semibold text-emerald-700 hover:bg-emerald-50 rounded-xl transition"
                      >
                        <PlusCircle className="w-4 h-4" />
                        <span>+ Add Child</span>
                      </Link>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <Link href="/parent/children?add=true" className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full">
                <PlusCircle className="w-3.5 h-3.5" />
                Add Child
              </Link>
            )}
          </div>

          <Link
            href="/parent/notifications"
            title="Notifications"
            className="relative w-10 h-10 rounded-full flex items-center justify-center bg-slate-50 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 transition shrink-0"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-2 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
          </Link>
          <Link
            href="/parent/profile"
            title="Guardian Profile"
            className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-50 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 transition shrink-0"
          >
            <User className="w-4 h-4" />
          </Link>
          <button
            onClick={handleLogout}
            title="Sign Out"
            className="w-10 h-10 rounded-full hidden sm:flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ── Mobile Drawer ──────────────────────────────────────────────────────── */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] bg-white flex flex-col h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            <div className="h-[72px] flex items-center justify-between px-6 border-b border-slate-100 shrink-0">
              <img
                src="/TrueLernLogo_horizontal.png"
                alt="TrueLern"
                className="h-7 w-auto object-contain"
              />
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 -mr-2 rounded-xl hover:bg-slate-100 text-slate-500 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Selected Child</p>
              <div className="flex flex-wrap gap-2">
                {linkedChildren.map((c) => (
                  <button
                    key={c.studentId}
                    onClick={() => setSelectedChild(c)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition ${
                      selectedChild?.studentId === c.studentId
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "bg-white text-slate-700 border-slate-200 shadow-sm"
                    }`}
                  >
                    {c.firstName}
                  </button>
                ))}
                <Link
                  href="/parent/children?add=true"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-xs font-bold px-3 py-1.5 rounded-xl border border-dashed border-emerald-300 bg-emerald-50/50 text-emerald-700 hover:bg-emerald-50 transition flex items-center gap-1"
                >
                  <PlusCircle className="w-3 h-3" />
                  <span>Add</span>
                </Link>
              </div>
            </div>

            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
              <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 mt-2">Main Menu</p>
              {PRIMARY_NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href !== "/parent/dashboard" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${
                      isActive ? "bg-emerald-50 text-emerald-700" : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? "text-emerald-600" : "text-slate-400"}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
              
              <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 mt-6">More Areas</p>
              {SECONDARY_NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${
                      isActive ? "bg-emerald-50 text-emerald-700" : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? "text-emerald-600" : "text-slate-400"}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="p-4 border-t border-slate-100 shrink-0">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Main Content Area ────────────────────────────────────────────────── */}
      <main className="flex-1 min-h-0 flex flex-col overflow-y-auto relative z-10">
        <div className="p-4 md:p-8 lg:px-10 max-w-[1600px] w-full mx-auto pb-24 md:pb-8 relative z-10">
          {children}
        </div>
      </main>
    </div>
  );
}

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  return (
    <ParentChildProvider>
      <ParentShellInner>{children}</ParentShellInner>
    </ParentChildProvider>
  );
}
