import React from "react";
import Link from "next/link";
import { connectDB } from "../../../../config/db";
import { apiAuditLogRepository } from "../../../../repositories/api-audit-log.repository";
import { workflowExecutionLogRepository } from "../../../../repositories/workflow-execution-log.repository";

export const revalidate = 0;

export const metadata = {
  title: "Unified Audit Center | TrueLern",
  description: "Enterprise Security and Action Ledger",
};

export default async function AuditCenterPage() {
  await connectDB();
  
  const [gatewayLogs, workflowLogs] = await Promise.all([
    apiAuditLogRepository.findMany({}, { limit: 5 } as any),
    workflowExecutionLogRepository.findMany({}, { limit: 5 } as any)
  ]);

  return (
    <div className="flex flex-col gap-10 max-w-6xl">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">Audit & Security Center</h1>
        <p className="text-sm text-gray-500 mt-1">Unified ledger for Gateway Access, Workflow Triggers, and Platform Configurations.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Gateway Security Logs */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col h-full">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-base font-bold text-gray-900">Gateway Access Logs</h2>
            <Link href="/admin/gateway/logs" className="text-xs text-indigo-600 font-bold hover:underline">
              View All →
            </Link>
          </div>
          <div className="flex-1 space-y-4">
            {gatewayLogs.slice(0, 5).map((log: any) => (
              <div key={log._id?.toString()} className="flex justify-between items-center pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                <div>
                  <div className="text-sm font-bold text-gray-800">{log.action || "API Request"}</div>
                  <div className="text-xs text-gray-400 font-mono mt-0.5">{log.ipAddress}</div>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                    log.status === "success" ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
                    log.status === "rate-limited" ? "bg-amber-50 text-amber-600 border-amber-200" :
                    "bg-rose-50 text-rose-600 border-rose-200"
                  }`}>
                    {log.status}
                  </span>
                  <div className="text-[10px] text-gray-400 mt-1">
                    {new Date(log.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Workflow Execution Logs */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col h-full">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-base font-bold text-gray-900">Automation Trigger Logs</h2>
            <Link href="/admin/workflows/logs" className="text-xs text-indigo-600 font-bold hover:underline">
              View All →
            </Link>
          </div>
          <div className="flex-1 space-y-4">
            {workflowLogs.slice(0, 5).map((log: any) => (
              <div key={log._id?.toString()} className="flex justify-between items-center pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                <div>
                  <div className="text-sm font-bold text-gray-800">{log.action || "Automation"}</div>
                  <div className="text-xs text-gray-400 font-mono mt-0.5">{log.message || "Executed"}</div>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                    log.status === "success" ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
                    "bg-rose-50 text-rose-600 border-rose-200"
                  }`}>
                    {log.status}
                  </span>
                  <div className="text-[10px] text-gray-400 mt-1">
                    {new Date(log.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
            {workflowLogs.length === 0 && (
              <div className="text-sm text-gray-400 text-center py-8">No automation logs recorded yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
