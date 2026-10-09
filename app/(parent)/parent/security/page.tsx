"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Shield,
  Lock,
  Mail,
  Key,
  CheckCircle2,
  AlertCircle,
  Settings,
  ArrowRight,
  LogOut,
  Info,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { LoginDevicesCard } from "../../../../components/ui/LoginDevicesCard";
import { AuditLogsCard } from "../../../../components/ui/AuditLogsCard";

interface ProfileSecurityData {
  profile: {
    email: string;
    firstName: string;
    lastName: string;
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

export default function ParentSecurityPage() {
  const router = useRouter();
  const [data, setData] = useState<ProfileSecurityData | null>(null);
  const [loading, setLoading] = useState(true);

  // Password change state
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    async function loadSecurity() {
      try {
        setLoading(true);
        const res = await fetch("/api/parent/profile");
        if (res.ok) {
          const json = await res.json();
          if (json.success) setData(json.data);
        }
      } catch (err: any) {
        console.error("Failed to load security details", err);
      } finally {
        setLoading(false);
      }
    }
    loadSecurity();
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

  const handleLogout = async () => {
    try {
      window.location.href = "/api/auth/logout";
    } catch {
      // ignore
    }
    router.push("/login");
  };

  const isGoogleLinked = data?.security.identities?.some((id) => id.provider === "google");
  const isMicrosoftLinked = data?.security.identities?.some((id) => id.provider === "microsoft");
  const hasPassword = data?.security.hasPassword;

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Security & Privacy</h1>
          <p className="text-xs text-slate-500 mt-1">
            Parent account security, credential protection, and authentication audit.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/parent/settings"
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Preferences & Settings</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Password Management */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900">Change Password</h2>
                  <p className="text-xs text-slate-500">
                    Update your account credentials using your current password.
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

          {/* Login Methods Audit */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
              Authentication Providers Audit
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between">
                <span className="font-semibold text-slate-700">Google Single Sign-On</span>
                {isGoogleLinked ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                    Connected
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400">Not Linked</span>
                )}
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between">
                <span className="font-semibold text-slate-700">Microsoft Account</span>
                {isMicrosoftLinked ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                    Connected
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400">Not Linked</span>
                )}
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between">
                <span className="font-semibold text-slate-700">Email & Password</span>
                {hasPassword ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                    Configured
                  </span>
                ) : (
                  <span className="text-[10px] text-amber-600">Unset</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Active Session & Privacy Controls */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Shield className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">Session & Protection</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Account Security</span>
                <span className="font-bold text-emerald-600 uppercase text-[10px]">Active</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Cookie Security</span>
                <span className="font-bold text-slate-800">HTTP-Only / Strict</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Account ID</span>
                <span className="font-mono text-slate-700 text-[11px] truncate max-w-[140px]">
                  {data?.security.email}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <button
                onClick={handleLogout}
                className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out of All Devices</span>
              </button>
            </div>
          </div>
          <LoginDevicesCard />
          <AuditLogsCard />
        </div>
      </div>
    </div>
  );
}
