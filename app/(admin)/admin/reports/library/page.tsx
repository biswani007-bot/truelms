/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import Link from "next/link";
import { reportDefinitionRepository } from "../../../../../repositories/report-definition.repository";
import { connectDB } from "../../../../../config/db";

export const revalidate = 0;

export default async function ReportLibraryPage() {
  await connectDB();

  const definitions = await reportDefinitionRepository.findMany({}, { populate: ["owner"] });

  return (
    <div className="flex flex-col gap-10">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Report Library</h1>
          <p className="text-sm text-gray-500 mt-1">
            Browse, manage, and execute all standard and custom report blueprints.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/reports"
            className="px-4 py-2 border border-gray-200 text-gray-600 hover:bg-white hover:text-white rounded-lg text-sm transition"
          >
            ← Dashboard
          </Link>
          <Link
            href="/admin/reports/export"
            className="px-4 py-2 bg-indigo-650 text-white hover:bg-indigo-600 rounded-lg text-sm font-semibold transition"
          >
            Export Center
          </Link>
        </div>
      </div>

      {/* Library Table */}
      <div className="bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-base font-bold text-gray-900">Report Blueprints</h2>
          <span className="text-xs text-gray-400">{definitions.length} reports</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-xs text-gray-400 uppercase tracking-wider">
                <th className="text-left px-6 py-3">Report Name</th>
                <th className="text-left px-6 py-3">Category</th>
                <th className="text-left px-6 py-3">Format Type</th>
                <th className="text-left px-6 py-3">Chart Display</th>
                <th className="text-left px-6 py-3">Visibility</th>
                <th className="text-left px-6 py-3">Run Count</th>
                <th className="text-left px-6 py-3">Last Executed</th>
              </tr>
            </thead>
            <tbody>
              {definitions.map((item) => (
                <tr key={item._id?.toString()} className="border-b border-slate-850 hover:bg-white transition">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-gray-900 font-medium text-sm">{item.name}</div>
                      <div className="text-xs text-gray-400 font-mono mt-0.5">{item.slug}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-white text-gray-500 border border-gray-200">
                      {item.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500 capitalize text-xs">{item.reportType}</td>
                  <td className="px-6 py-4 text-gray-500 capitalize text-xs">{item.chartType}</td>
                  <td className="px-6 py-4 text-gray-500 uppercase text-[10px] font-bold">{item.visibility}</td>
                  <td className="px-6 py-4 font-mono text-xs text-white">{item.runCount || 0} runs</td>
                  <td className="px-6 py-4 text-gray-500 text-xs">
                    {item.lastRunAt ? new Date(item.lastRunAt).toLocaleString() : "Never"}
                  </td>
                </tr>
              ))}
              {definitions.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-550 text-xs">No report blueprints registered in library.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
