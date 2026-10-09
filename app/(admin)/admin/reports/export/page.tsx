/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import Link from "next/link";
import { reportExecutionRepository } from "../../../../../repositories/report-execution.repository";
import { connectDB } from "../../../../../config/db";

export const revalidate = 0;

export default async function ExportCenterPage() {
  await connectDB();

  const executions = await reportExecutionRepository.findMany(
    {},
    { populate: ["reportDefinition", "executedBy"], sort: "createdAt", order: "desc" } as any
  );

  return (
    <div className="flex flex-col gap-10">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Export Center</h1>
          <p className="text-sm text-gray-500 mt-1">
            Download report datasets in CSV or JSON formats. View historic export transactions.
          </p>
        </div>
        <Link
          href="/admin/reports"
          className="px-4 py-2 border border-gray-200 text-gray-600 hover:bg-white hover:text-white rounded-lg text-sm transition"
        >
          ← Dashboard
        </Link>
      </div>

      {/* Export Options Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-gray-50 border border-gray-200 p-6 rounded-2xl flex flex-col gap-4">
          <h2 className="text-base font-bold text-gray-900">Export Formats Available</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-850 flex flex-col gap-2">
              <span className="text-indigo-600 font-bold text-sm">CSV Format</span>
              <p className="text-[11px] text-gray-500 leading-tight">Comma Separated Values. High compatibility with Excel/Sheets.</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-850 flex flex-col gap-2">
              <span className="text-emerald-600 font-bold text-sm">JSON Format</span>
              <p className="text-[11px] text-gray-500 leading-tight">Structured JavaScript Object Notation. High compatibility for database dumps.</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 p-6 rounded-2xl flex flex-col gap-4 justify-center">
          <span className="text-xs text-gray-400 uppercase font-semibold tracking-wider">Need Custom Snapshots?</span>
          <p className="text-xs text-gray-500">Use the Reports API payload exporter or snapshot scheduler to configure automated distributions.</p>
          <div className="flex gap-2">
            <Link
              href="/admin/reports/library"
              className="text-xs font-bold text-indigo-600 hover:text-indigo-500 transition"
            >
              Configure Schedule →
            </Link>
          </div>
        </div>
      </div>

      {/* Historic Executions Ledger */}
      <div className="bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-base font-bold text-gray-900">Execution & Export History</h2>
          <span className="text-xs text-gray-400">{executions.length} runs logged</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-xs text-gray-400 uppercase tracking-wider">
                <th className="text-left px-6 py-3">Report</th>
                <th className="text-left px-6 py-3">Format</th>
                <th className="text-left px-6 py-3">Rows</th>
                <th className="text-left px-6 py-3">Execution Speed</th>
                <th className="text-left px-6 py-3">Run By</th>
                <th className="text-left px-6 py-3">Status</th>
                <th className="text-left px-6 py-3">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {executions.map((exec) => {
                const defObj = exec.reportDefinition as any;
                const userObj = exec.executedBy as any;
                return (
                  <tr key={exec._id?.toString()} className="border-b border-slate-850 hover:bg-white transition">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-gray-900 font-medium text-xs">{defObj?.name || "Standard Export"}</div>
                        <div className="text-[10px] text-gray-400 font-mono mt-0.5">{defObj?.slug || "custom-query"}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs uppercase text-gray-500">
                      {exec.exportFormat || "csv"}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-gray-500">{exec.rowCount || 0} rows</td>
                    <td className="px-6 py-4 font-mono text-xs text-gray-500">
                      {exec.executionMs ? `${exec.executionMs}ms` : "—"}
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs">
                      {userObj ? `${userObj.firstName} ${userObj.lastName}` : "System"}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${exec.status === "completed" ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-red-950 text-red-400 border-red-500/20"}`}>
                        {exec.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs">
                      {new Date((exec as any).createdAt).toLocaleString()}
                    </td>
                  </tr>
                );
              })}
              {executions.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-550 text-xs">No export logs recorded.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
