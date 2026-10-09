/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import Link from "next/link";
import { apiAuditLogRepository } from "../../../../../repositories/api-audit-log.repository";
import { connectDB } from "../../../../../config/db";

export const revalidate = 0;

export default async function GatewayAuditLogsPage() {
  await connectDB();

  const logs = await apiAuditLogRepository.findMany(
    {},
    { populate: ["apiKey"], sort: "createdAt", order: "desc" } as any
  );

  return (
    <div className="flex flex-col gap-10">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">API Access Logs</h1>
          <p className="text-sm text-gray-500 mt-1">
            Complete security ledger auditing every external gateway invocation attempt.
          </p>
        </div>
        <Link
          href="/admin/gateway"
          className="px-4 py-2 border border-gray-200 text-slate-355 hover:bg-white hover:text-white rounded-lg text-sm transition"
        >
          ← Gateway Home
        </Link>
      </div>

      {/* Logs Table */}
      <div className="bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-base font-bold text-gray-900">Security Audits</h2>
          <span className="text-xs text-gray-400">{logs.length} trace items</span>
        </div>
        <div className="overflow-x-auto font-mono text-xs">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-200 text-gray-400 uppercase tracking-wider">
                <th className="px-6 py-3">Timestamp</th>
                <th className="px-6 py-3">IP Address</th>
                <th className="px-6 py-3">API Key ID</th>
                <th className="px-6 py-3">Action Request</th>
                <th className="px-6 py-3">Outcome</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((item) => {
                const keyObj = item.apiKey as any;
                return (
                  <tr key={item._id?.toString()} className="border-b border-slate-850 hover:bg-white transition">
                    <td className="px-6 py-4 text-gray-400">
                      {new Date((item as any).createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-gray-600 font-semibold">{item.ipAddress}</td>
                    <td className="px-6 py-4 text-indigo-600">
                      {keyObj ? keyObj.keyId : "—"}
                    </td>
                    <td className="px-6 py-4 text-gray-500 max-w-sm truncate">{item.action}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                        item.status === "success" ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
                        item.status === "rate-limited" ? "bg-amber-50 text-amber-700 border-amber-200" :
                        "bg-red-950 text-red-400 border-red-500/20"
                      }`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-550 text-xs">No audit logs recorded.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
