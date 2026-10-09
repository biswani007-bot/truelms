/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import Link from "next/link";
import { workflowExecutionRepository } from "../../../../../repositories/workflow-execution.repository";
import { connectDB } from "../../../../../config/db";

export const revalidate = 0;

export default async function ExecutionMonitorPage() {
  await connectDB();

  const executions = await workflowExecutionRepository.findMany(
    {},
    { populate: ["workflow"], sort: "startedAt", order: "desc" } as any
  );

  return (
    <div className="flex flex-col gap-10">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Execution Monitor</h1>
          <p className="text-sm text-gray-500 mt-1">
            Real-time execution pipeline monitor displaying outcomes, latency, and logs.
          </p>
        </div>
        <Link
          href="/admin/workflows"
          className="px-4 py-2 border border-gray-200 text-slate-355 hover:bg-white hover:text-white rounded-lg text-sm transition"
        >
          ← Dashboard Home
        </Link>
      </div>

      {/* Monitor Table */}
      <div className="bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-base font-bold text-gray-900">Asynchronous Executions</h2>
          <span className="text-xs text-gray-400">{executions.length} runs</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-xs text-gray-400 uppercase tracking-wider">
                <th className="text-left px-6 py-3">Workflow</th>
                <th className="text-left px-6 py-3">Trigger Event</th>
                <th className="text-left px-6 py-3">Started At</th>
                <th className="text-left px-6 py-3">Duration</th>
                <th className="text-left px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {executions.map((item) => {
                const wfObj = item.workflow as any;
                return (
                  <tr key={item._id?.toString()} className="border-b border-slate-850 hover:bg-white transition">
                    <td className="px-6 py-4">
                      <div className="text-white text-xs font-semibold">{wfObj?.name || "Automation Run"}</div>
                      <div className="text-[10px] text-gray-400 font-mono mt-0.5">{wfObj?._id?.toString()}</div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-gray-500">{item.triggerEvent}</td>
                    <td className="px-6 py-4 text-gray-500 text-xs">
                      {new Date(item.startedAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-gray-500">
                      {item.durationMs ? `${item.durationMs}ms` : "—"}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                        item.status === "completed" ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
                        item.status === "skipped" ? "bg-indigo-50 text-indigo-600 border-indigo-200" :
                        item.status === "failed" ? "bg-red-950 text-red-400 border-red-500/20" :
                        "bg-amber-50 text-amber-700 border-amber-200"
                      }`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {executions.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-550 text-xs">No execution history logged.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
