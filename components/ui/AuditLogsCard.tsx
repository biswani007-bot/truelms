"use client";

import React, { useState, useEffect } from "react";
import { ShieldCheck, AlertCircle, Loader2 } from "lucide-react";
import { DashboardCard } from "./DashboardCard";

interface ActivityLogItem {
  _id: string;
  role?: string;
  action: string;
  entity: string;
  ip?: string;
  userAgent?: string;
  createdAt: string;
}

export function AuditLogsCard() {
  const [logs, setLogs] = useState<ActivityLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/auth/activity");
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to fetch activity logs");
      }
      setLogs(data.data);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardCard title="Activity & Audit Logs" headerAction={<ShieldCheck className="w-5 h-5 text-indigo-500" />}>
      <div className="flex flex-col gap-4">
        <p className="text-xs text-slate-600">
          Review recent activity on your account. If you see any suspicious activity, change your password and revoke unrecognized sessions immediately.
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
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs bg-slate-50 rounded-xl border border-slate-100">
            No recent activity found.
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
            {logs.map((log) => (
              <div
                key={log._id}
                className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <h4 className="text-sm font-bold text-slate-800">
                    {log.action}
                  </h4>
                  <p className="text-[10px] sm:text-xs text-slate-500 mt-1 flex flex-wrap gap-2">
                    <span className="font-semibold text-slate-600">Entity:</span> {log.entity}
                    {log.role && (
                      <>
                        <span>•</span>
                        <span className="font-semibold text-slate-600">Role:</span> {log.role}
                      </>
                    )}
                    {log.ip && (
                      <>
                        <span>•</span>
                        <span className="font-semibold text-slate-600">IP:</span> {log.ip}
                      </>
                    )}
                  </p>
                  {log.userAgent && (
                    <p className="text-[10px] text-slate-400 mt-1 truncate max-w-xs sm:max-w-md">
                      {log.userAgent}
                    </p>
                  )}
                </div>
                <div className="text-xs text-slate-500 font-medium shrink-0">
                  {new Date(log.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardCard>
  );
}
