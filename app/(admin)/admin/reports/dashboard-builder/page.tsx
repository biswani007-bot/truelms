/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import Link from "next/link";
import { analyticsDashboardRepository } from "../../../../../repositories/analytics-dashboard.repository";
import { analyticsWidgetRepository } from "../../../../../repositories/analytics-widget.repository";
import { connectDB } from "../../../../../config/db";

export const revalidate = 0;

export default async function DashboardBuilderPage() {
  await connectDB();

  const dashboards = await analyticsDashboardRepository.findMany({}, { populate: ["widgets"] });
  const widgets = await analyticsWidgetRepository.findMany({});

  return (
    <div className="flex flex-col gap-10">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Dashboard Builder</h1>
          <p className="text-sm text-gray-500 mt-1">
            Build custom dashboards, group widgets, and configure visibility profiles.
          </p>
        </div>
        <Link
          href="/admin/reports"
          className="px-4 py-2 border border-gray-200 text-gray-600 hover:bg-white hover:text-white rounded-lg text-sm transition"
        >
          ← Dashboard
        </Link>
      </div>

      {/* Grid of Dashboards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {dashboards.map((dash) => (
          <div key={dash._id?.toString()} className="bg-gray-50 border border-gray-200 rounded-2xl p-6 flex flex-col gap-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-base font-bold text-gray-900">{dash.name}</h2>
                <p className="text-xs text-gray-400 font-mono mt-0.5">{dash.slug}</p>
              </div>
              <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-indigo-50 text-indigo-600 border border-indigo-200">
                {dash.visibility}
              </span>
            </div>

            <p className="text-xs text-gray-500">{dash.description || "No description provided."}</p>

            <div className="border-t border-slate-850 pt-4">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Linked Widgets</h3>
              <div className="flex flex-wrap gap-2">
                {(dash.widgets as any[]).map((wid) => (
                  <span key={wid._id?.toString()} className="px-2.5 py-1 rounded-lg text-xs bg-white border border-gray-200 text-gray-600">
                    {wid.name}
                  </span>
                ))}
                {dash.widgets.length === 0 && (
                  <span className="text-xs text-gray-500">No widgets linked yet.</span>
                )}
              </div>
            </div>
          </div>
        ))}
        {dashboards.length === 0 && (
          <div className="col-span-2 text-center py-12 border border-gray-200 rounded-2xl text-slate-550 text-xs bg-gray-50/50">
            No custom dashboards constructed yet.
          </div>
        )}
      </div>

      {/* Widget Manager Segment */}
      <div className="bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden mt-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-base font-bold text-gray-900">Widget Registry</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-xs text-gray-400 uppercase tracking-wider">
                <th className="text-left px-6 py-3">Widget Name</th>
                <th className="text-left px-6 py-3">Category</th>
                <th className="text-left px-6 py-3">Visual Type</th>
                <th className="text-left px-6 py-3">Identifier Key</th>
                <th className="text-left px-6 py-3">Access Level</th>
              </tr>
            </thead>
            <tbody>
              {widgets.map((wid) => (
                <tr key={wid._id?.toString()} className="border-b border-slate-850 hover:bg-white transition">
                  <td className="px-6 py-4 font-medium text-white text-sm">{wid.name}</td>
                  <td className="px-6 py-4 text-gray-500 capitalize text-xs">{wid.category}</td>
                  <td className="px-6 py-4 text-gray-500 capitalize text-xs">{wid.widgetType}</td>
                  <td className="px-6 py-4 text-indigo-600 font-mono text-xs">{wid.dataKey}</td>
                  <td className="px-6 py-4 text-gray-500 uppercase text-[10px] font-bold">{wid.visibility}</td>
                </tr>
              ))}
              {widgets.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-550 text-xs">No analytics widgets registered.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
