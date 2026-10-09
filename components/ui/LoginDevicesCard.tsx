"use client";

import React, { useState, useEffect } from "react";
import { Laptop, Smartphone, AlertCircle, Loader2, LogOut, CheckCircle2, Monitor } from "lucide-react";
import { DashboardCard } from "./DashboardCard";

interface Session {
  _id: string;
  sessionId: string;
  deviceName?: string;
  platform?: string;
  appVersion?: string;
  lastSeenAt: string;
  createdAt: string;
  isCurrent?: boolean;
}

export function LoginDevicesCard() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/auth/devices");
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to fetch devices");
      }
      setSessions(data.data);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const revokeSession = async (sessionId: string) => {
    if (!confirm("Are you sure you want to sign out of this device?")) return;
    try {
      setRevokingId(sessionId);
      const res = await fetch(`/api/auth/devices?sessionId=${sessionId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to revoke session");
      }
      setSessions(sessions.filter((s) => s.sessionId !== sessionId));
    } catch (err: any) {
      alert(err.message || "Failed to revoke session");
    } finally {
      setRevokingId(null);
    }
  };

  const getDeviceIcon = (platform?: string) => {
    const plat = platform?.toLowerCase() || "";
    if (plat.includes("mobile") || plat.includes("android") || plat.includes("ios") || plat.includes("iphone")) {
      return <Smartphone className="w-5 h-5 text-indigo-500" />;
    }
    if (plat.includes("mac") || plat.includes("windows") || plat.includes("linux")) {
      return <Laptop className="w-5 h-5 text-indigo-500" />;
    }
    return <Monitor className="w-5 h-5 text-indigo-500" />;
  };

  return (
    <DashboardCard title="Login Devices" headerAction={<Monitor className="w-5 h-5 text-indigo-500" />}>
      <div className="flex flex-col gap-4">
        <p className="text-xs text-slate-600">
          These are the devices currently signed into your account. If you don't recognize a device, revoke its access immediately.
        </p>

        {error && (
          <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs bg-slate-50 rounded-xl border border-slate-100">
            No active devices found.
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session, index) => {
              const isCurrent = session.isCurrent ?? (index === 0 && !sessions.some((s) => s.isCurrent));
              return (
                <div
                  key={session.sessionId}
                  className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
                      {getDeviceIcon(session.platform)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-800">
                          {session.deviceName || session.platform || "Unknown Device"}
                        </h4>
                        {isCurrent && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                            Current Session
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Last activity: {new Date(session.lastSeenAt || session.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {!isCurrent && (
                    <button
                      onClick={() => revokeSession(session.sessionId)}
                      disabled={revokingId === session.sessionId}
                      className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition disabled:opacity-50"
                      title="Sign Out Device"
                    >
                      {revokingId === session.sessionId ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <LogOut className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardCard>
  );
}
