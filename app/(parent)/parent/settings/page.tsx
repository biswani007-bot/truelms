"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Settings,
  Shield,
  Bell,
  Lock,
  Mail,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Key,
  Globe,
  Save,
  MessageSquare,
  Sparkles,
  ExternalLink,
  LogOut,
  ChevronRight,
  Info,
} from "lucide-react";

interface PreferenceData {
  channelPreferences: Record<string, boolean>;
  eventPreferences: Record<string, boolean>;
  muteAll: boolean;
  digestEnabled: boolean;
  language: string;
  timezone: string;
}

interface ProfileData {
  profile: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    status: string;
  };
  security: {
    email: string;
    hasPassword: boolean;
    isActive: boolean;
    identities: Array<{
      provider: string;
      linkedAt: string;
    }>;
  };
}

export default function ParentSettingsPage() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "security";
  const [activeTab, setActiveTab] = useState<"security" | "preferences" | "login-methods">(
    initialTab === "preferences" || initialTab === "login-methods" ? initialTab : "security"
  );

  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [preferences, setPreferences] = useState<PreferenceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingPref, setSavingPref] = useState(false);
  const [prefMessage, setPrefMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Password change state
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [profRes, prefRes] = await Promise.all([
          fetch("/api/parent/profile"),
          fetch("/api/parent/preferences"),
        ]);

        if (profRes.ok) {
          const profJson = await profRes.json();
          if (profJson.success) setProfileData(profJson.data);
        }

        if (prefRes.ok) {
          const prefJson = await prefRes.json();
          if (prefJson.success) setPreferences(prefJson.data);
        }
      } catch (err: any) {
        console.error("Failed to load settings data", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    if (newPassword.length < 8) {
      setPasswordMessage({ type: "error", text: "New password must be at least 8 characters long." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: "error", text: "New password and confirmation do not match." });
      return;
    }

    try {
      setChangingPassword(true);
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to change password");
      }
      setPasswordMessage({
        type: "success",
        text: "Password changed successfully! You may now sign in with your updated credentials.",
      });
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPasswordMessage({ type: "error", text: err.message || "Could not update password" });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSavePreferences = async () => {
    if (!preferences) return;
    try {
      setSavingPref(true);
      setPrefMessage(null);
      const res = await fetch("/api/parent/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preferences),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to update preferences");
      }
      setPreferences(json.data);
      setPrefMessage({ type: "success", text: "Communication preferences saved successfully." });
      setTimeout(() => setPrefMessage(null), 4000);
    } catch (err: any) {
      setPrefMessage({ type: "error", text: err.message || "Failed to save preferences" });
    } finally {
      setSavingPref(false);
    }
  };

  const isGoogleLinked = profileData?.security.identities?.some((id) => id.provider === "google");
  const isMicrosoftLinked = profileData?.security.identities?.some((id) => id.provider === "microsoft");
  const hasPassword = profileData?.security.hasPassword;

  if (loading) {
    return (
      <div className="space-y-6 max-w-[1600px] w-full mx-auto">
        <div className="h-20 bg-slate-100 rounded-3xl animate-pulse" />
        <div className="h-96 bg-slate-100 rounded-3xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-[1600px] w-full mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Account Settings & Security</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage your credentials, linked authentication providers, and delivery preferences.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/parent/profile"
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
          >
            Back to Profile
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveTab("security")}
          className={`pb-3 px-4 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
            activeTab === "security"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Security & Password</span>
        </button>

        <button
          onClick={() => setActiveTab("login-methods")}
          className={`pb-3 px-4 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
            activeTab === "login-methods"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Key className="w-4 h-4" />
          <span>Login Methods</span>
        </button>

        <button
          onClick={() => setActiveTab("preferences")}
          className={`pb-3 px-4 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
            activeTab === "preferences"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Communication Preferences</span>
        </button>
      </div>

      {/* TAB 1: SECURITY & PASSWORD */}
      {activeTab === "security" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Change Password Card */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-900">Change Account Password</h2>
                    <p className="text-xs text-slate-500">
                      Update your login password to keep your family portal access protected.
                    </p>
                  </div>
                </div>
              </div>

              {passwordMessage && (
                <div
                  className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-2.5 ${
                    passwordMessage.type === "success"
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "bg-rose-50 text-rose-800 border border-rose-200"
                  }`}
                >
                  {passwordMessage.type === "success" ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{passwordMessage.text}</span>
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">Current Password</label>
                  <input
                    type="password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    required
                    placeholder="••••••••••••"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                    placeholder="Minimum 8 characters"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                    placeholder="Re-enter new password"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={changingPassword}
                    className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 disabled:opacity-50"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>{changingPassword ? "Updating Password..." : "Update Password"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Right Column: Security Status Overview */}
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
                Security Overview
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Account Identity</span>
                  <span className="font-bold text-slate-900">{profileData?.security.email}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Password Status</span>
                  <span className="font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Active
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Email Verification</span>
                  <span className="font-bold text-emerald-600 uppercase text-[10px]">Verified</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Two-Factor / OTP</span>
                  <span className="font-semibold text-slate-400">Phase 7 (Dedicated)</span>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100 text-[11px] text-emerald-800 flex items-start gap-2 mt-4">
                <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  Your session is authenticated via secure HTTP-only cookies. Logging out terminates active tokens.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LOGIN METHODS */}
      {activeTab === "login-methods" && (
        <div className="max-w-3xl space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-base font-black text-slate-900">Linked Authentication Providers</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Authentication methods connected to your TrueLern Parent Account.
              </p>
            </div>

            <div className="space-y-4">
              {/* Google OAuth Provider */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-xs">
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Google Authentication</h4>
                    <p className="text-[11px] text-slate-500">Sign in using your verified Google account</p>
                  </div>
                </div>

                <div>
                  {isGoogleLinked ? (
                    <span className="text-[11px] font-bold px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Connected
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold px-3 py-1 bg-slate-200/70 text-slate-600 rounded-full">
                      Not Linked
                    </span>
                  )}
                </div>
              </div>

              {/* Microsoft OAuth Provider */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-xs">
                    <svg className="w-5 h-5" viewBox="0 0 21 21">
                      <path fill="#f25022" d="M1 1h9v9H1z" />
                      <path fill="#00a4ef" d="M1 11h9v9H1z" />
                      <path fill="#7fba00" d="M11 1h9v9h-9z" />
                      <path fill="#ffb900" d="M11 11h9v9h-9z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Microsoft Account</h4>
                    <p className="text-[11px] text-slate-500">Sign in with Microsoft Work or Personal ID</p>
                  </div>
                </div>

                <div>
                  {isMicrosoftLinked ? (
                    <span className="text-[11px] font-bold px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Connected
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold px-3 py-1 bg-slate-200/70 text-slate-600 rounded-full">
                      Not Linked
                    </span>
                  )}
                </div>
              </div>

              {/* Email & Password */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-xs">
                    <Mail className="w-5 h-5 text-slate-600" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Email & Password</h4>
                    <p className="text-[11px] text-slate-500">{profileData?.security.email}</p>
                  </div>
                </div>

                <div>
                  {hasPassword ? (
                    <span className="text-[11px] font-bold px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Password Active
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold px-3 py-1 bg-amber-50 text-amber-700 rounded-full border border-amber-200">
                      OAuth Only
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-500 space-y-1">
              <p className="font-bold text-slate-800">Single Sign-On Architecture Notice</p>
              <p className="text-[11px]">
                Authentication methods are bound to your verified guardian identity. To connect or update OAuth
                providers, authenticate through the initial sign-in gateway with matching primary email.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: COMMUNICATION PREFERENCES */}
      {activeTab === "preferences" && preferences && (
        <div className="max-w-3xl space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-black text-slate-900">Notification & Channel Preferences</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Choose how and when TrueLern sends updates regarding your children&apos;s academic journey.
                </p>
              </div>
              <button
                type="button"
                onClick={handleSavePreferences}
                disabled={savingPref}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm shadow-emerald-600/20 disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{savingPref ? "Saving..." : "Save Preferences"}</span>
              </button>
            </div>

            {prefMessage && (
              <div
                className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-2.5 ${
                  prefMessage.type === "success"
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-rose-50 text-rose-800 border border-rose-200"
                }`}
              >
                {prefMessage.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{prefMessage.text}</span>
              </div>
            )}

            {/* Master Switch */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900">Mute All Notifications</h4>
                <p className="text-[11px] text-slate-500">Temporarily silence all non-critical alerts</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.muteAll}
                  onChange={(e) => setPreferences({ ...preferences, muteAll: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600" />
              </label>
            </div>

            {/* Delivery Channels */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Delivery Channels</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {[
                  { key: "email", label: "Email Notifications", desc: "Weekly summaries, invoices & receipts" },
                  { key: "sms", label: "SMS Alerts", desc: "Urgent class reminders & safety notices" },
                  { key: "whatsapp", label: "WhatsApp Updates", desc: "Attendance & live session links" },
                  { key: "push", label: "Browser Push", desc: "Immediate class start notifications" },
                  { key: "in-app", label: "In-App Portal Inbox", desc: "Platform announcements & assignments" },
                ].map((channel) => (
                  <label
                    key={channel.key}
                    className="p-3.5 bg-white rounded-2xl border border-slate-200 flex items-start justify-between gap-3 cursor-pointer hover:border-emerald-300 transition"
                  >
                    <div>
                      <p className="font-bold text-slate-800">{channel.label}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{channel.desc}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.channelPreferences[channel.key] !== false}
                      onChange={(e) =>
                        setPreferences({
                          ...preferences,
                          channelPreferences: {
                            ...preferences.channelPreferences,
                            [channel.key]: e.target.checked,
                          },
                        })
                      }
                      className="mt-1 h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                    />
                  </label>
                ))}
              </div>
            </div>

            {/* Topic Subscriptions */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Academic Topics</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {[
                  { key: "finance", label: "Tuition & Invoicing", desc: "Fee schedules, receipts, balance alerts" },
                  { key: "attendance", label: "Attendance & Punctuality", desc: "Absence reports and roll-call confirmations" },
                  { key: "assignment", label: "Assignments & Submissions", desc: "Homework deadlines and teacher reviews" },
                  { key: "assessment", label: "Assessments & Results", desc: "Quizzes, grading releases, scorecards" },
                  { key: "enrollment", label: "Batch & Enrollment", desc: "Cohort placement and schedule adjustments" },
                  { key: "reports", label: "Progress Reports", desc: "Bi-weekly academic trajectory insights" },
                ].map((topic) => (
                  <label
                    key={topic.key}
                    className="p-3.5 bg-white rounded-2xl border border-slate-200 flex items-start justify-between gap-3 cursor-pointer hover:border-emerald-300 transition"
                  >
                    <div>
                      <p className="font-bold text-slate-800">{topic.label}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{topic.desc}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.eventPreferences[topic.key] !== false}
                      onChange={(e) =>
                        setPreferences({
                          ...preferences,
                          eventPreferences: {
                            ...preferences.eventPreferences,
                            [topic.key]: e.target.checked,
                          },
                        })
                      }
                      className="mt-1 h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                    />
                  </label>
                ))}
              </div>
            </div>

            {/* Daily Digest */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900">Daily Activity Digest</h4>
                <p className="text-[11px] text-slate-500">
                  Combine non-urgent notifications into a single morning briefing at 8:00 AM
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.digestEnabled}
                  onChange={(e) => setPreferences({ ...preferences, digestEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600" />
              </label>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={handleSavePreferences}
                disabled={savingPref}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm shadow-emerald-600/20 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{savingPref ? "Saving Preferences..." : "Save Preferences"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
