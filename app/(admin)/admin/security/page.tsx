"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { EnterpriseDialog } from "@/components/ui/dialogs/EnterpriseDialog";
import { useToast } from "@/components/ui/dialogs/ToastProvider";

export default function SecurityCenter() {
  const toast = useToast();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [revokingUser, setRevokingUser] = useState<string | null>(null);
  const [revokingLoading, setRevokingLoading] = useState(false);
  const [filterAction, setFilterAction] = useState("");

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const filter = filterAction ? encodeURIComponent(JSON.stringify({ action: filterAction })) : "";
      const res = await fetch(`/api/admin/security?limit=50&filter=${filter}`);
      const data = await res.json();
      if (data.success) {
        setLogs(data.data?.items || data.data?.data || (Array.isArray(data.data) ? data.data : []));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filterAction]);

  const handleConfirmRevoke = async () => {
    if (!revokingUser) return;
    setRevokingLoading(true);
    try {
      const res = await fetch(`/api/admin/security/revoke-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: revokingUser, reason: "Admin enforced revoke" }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Session Revoked", "User session forcefully terminated.");
        setRevokingUser(null);
        fetchLogs();
      } else {
        toast.error("Revoke Failed", data.error || "Unable to revoke session.");
      }
    } catch {
      toast.error("Network Error", "Failed to connect to the server.");
    } finally {
      setRevokingLoading(false);
    }
  };

  const getActionBadgeClass = (action: string) => {
    const norm = (action || "").toLowerCase();
    if (norm.includes("failed")) return "bg-red-50 text-red-600 border border-red-200";
    if (norm.includes("login")) return "bg-emerald-50 text-emerald-600 border border-emerald-200";
    if (norm.includes("logout") || norm.includes("revoke") || norm.includes("force")) return "bg-amber-50 text-amber-600 border border-amber-200";
    if (norm.includes("password")) return "bg-indigo-50 text-indigo-600 border border-indigo-200";
    return "bg-slate-100 text-slate-700 border border-slate-200";
  };

  const getRoleBadgeClass = (role?: string) => {
    const lower = (role || "").toLowerCase();
    if (lower.includes("admin")) return "bg-purple-50 text-purple-700 border-purple-200";
    if (lower.includes("teacher") || lower.includes("faculty")) return "bg-sky-50 text-sky-700 border-sky-200";
    if (lower.includes("parent")) return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (lower.includes("student")) return "bg-blue-50 text-blue-700 border-blue-200";
    return "bg-slate-100 text-slate-700 border-slate-200";
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="lms-page-title">Security Operations Center</h1>
          <p className="lms-caption mt-1">Monitor active sessions, security events, and manage access.</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-slate-50">
          <h2 className="text-sm font-bold text-gray-900">Recent Security Activity</h2>
          <select 
            value={filterAction} 
            onChange={(e) => setFilterAction(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg py-1.5 px-3 bg-white text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Events</option>
            <option value="Login">Logins</option>
            <option value="Logout">Logouts</option>
            <option value="Change Password">Password Changes</option>
            <option value="Failed Login">Failed Logins</option>
            <option value="Force Logout">Force Logouts</option>
          </select>
        </div>
        
        {loading ? (
          <div className="p-8 text-center text-gray-400">
            <div className="w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-2"></div>
            Loading security logs...
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-gray-500 text-sm">
            No security logs found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-gray-100">
                  <th className="px-6 py-3 text-[10px] uppercase tracking-widest font-extrabold text-gray-400">Timestamp</th>
                  <th className="px-6 py-3 text-[10px] uppercase tracking-widest font-extrabold text-gray-400">Action</th>
                  <th className="px-6 py-3 text-[10px] uppercase tracking-widest font-extrabold text-gray-400">User</th>
                  <th className="px-6 py-3 text-[10px] uppercase tracking-widest font-extrabold text-gray-400">Role</th>
                  <th className="px-6 py-3 text-[10px] uppercase tracking-widest font-extrabold text-gray-400">IP / Device</th>
                  <th className="px-6 py-3 text-[10px] uppercase tracking-widest font-extrabold text-gray-400 text-right">Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map((log) => {
                  const resolvedRole = log.role || log.user?.role?.name || log.user?.role || "User";
                  return (
                    <tr key={log._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-xs text-gray-500 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${getActionBadgeClass(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {log.user ? (
                          <div>
                            <div className="text-sm font-bold text-gray-900">{log.user.firstName} {log.user.lastName}</div>
                            <div className="text-xs text-gray-500">{log.user.email}</div>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">System / Unknown</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${getRoleBadgeClass(resolvedRole)}`}>
                          {resolvedRole}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs font-mono text-gray-600">{log.ip || "Unknown IP"}</div>
                        <div className="text-[10px] text-gray-400 truncate max-w-[200px]" title={log.userAgent}>
                          {log.userAgent || "Unknown Device"}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {log.user && (
                          <button
                            onClick={() => setRevokingUser(log.user._id)}
                            disabled={revokingLoading && revokingUser === log.user._id}
                            className="px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                          >
                            {revokingLoading && revokingUser === log.user._id ? "Revoking..." : "Force Logout"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Force Logout Enterprise Dialog */}
      <EnterpriseDialog
        isOpen={!!revokingUser}
        onClose={() => { if (!revokingLoading) setRevokingUser(null); }}
        title="Force End User Session"
        subtitle="Terminates active authentication token"
        description="Are you sure you want to forcefully end this user's active session? The user will be immediately logged out and required to re-authenticate."
        variant="delete"
        confirmLabel="Force Logout"
        cancelLabel="Cancel"
        onConfirm={handleConfirmRevoke}
        loading={revokingLoading}
      />
    </div>
  );
}
