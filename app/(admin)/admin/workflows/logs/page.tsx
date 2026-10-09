/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import Link from "next/link";
import { workflowExecutionLogRepository } from "../../../../../repositories/workflow-execution-log.repository";
import { connectDB } from "../../../../../config/db";

export const revalidate = 0;

const LOG_STATUS_COLORS: Record<string, string> = {
  info: "text-gray-500",
  success: "text-emerald-600",
  warn: "text-amber-700",
  error: "text-red-400 font-bold",
};

export default async function ExecutionLogsPage() {
  await connectDB();

  const logs = await workflowExecutionLogRepository.findMany(
    {},
    { populate: ["execution"], sort: "timestamp", order: "desc" } as any
  );

  return (
    <div className="flex flex-col gap-10">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Workflow Execution Logs</h1>
          <p className="text-sm text-gray-500 mt-1">
            Complete low-level trace log feed detailing execution variables, step states, and outcomes.
          </p>
        </div>
        <Link
          href="/admin/workflows"
          className="px-4 py-2 border border-gray-200 text-slate-355 hover:bg-white hover:text-white rounded-lg text-sm transition"
        >
          ← Dashboard Home
        </Link>
      </div>

      {/* Logs Table */}
      <div className="bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-base font-bold text-gray-900">System logs</h2>
          <span className="text-xs text-gray-400">{logs.length} trace items</span>
        </div>
        <div className="overflow-x-auto font-mono text-xs">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-200 text-gray-400 uppercase tracking-wider">
                <th className="px-6 py-3">Timestamp</th>
                <th className="px-6 py-3">Execution ID</th>
                <th className="px-6 py-3">Workflow Step</th>
                <th className="px-6 py-3">Severity</th>
                <th className="px-6 py-3">Log Message</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((item) => {
                const execObj = item.execution as any;
                return (
                  <tr key={item._id?.toString()} className="border-b border-slate-850 hover:bg-white transition">
                    <td className="px-6 py-4 text-gray-400">
                      {new Date(item.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-indigo-600">
                      {execObj ? execObj._id?.toString() : "—"}
                    </td>
                    <td className="px-6 py-4 text-gray-600 font-semibold">{item.step}</td>
                    <td className="px-6 py-4">
                      <span className={`capitalize ${LOG_STATUS_COLORS[item.status] || "text-gray-500"}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 max-w-sm truncate">{item.message}</td>
                  </tr>
                );
              })}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-550 text-xs">No execution trace logs recorded.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
