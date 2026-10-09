/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import Link from "next/link";
import { workflowRepository } from "../../../../../repositories/workflow.repository";
import { connectDB } from "../../../../../config/db";

export const revalidate = 0;

export default async function WorkflowBuilderPage() {
  await connectDB();

  const workflows = await workflowRepository.findMany({}, { populate: ["owner"] });

  return (
    <div className="flex flex-col gap-10">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Workflow Builder</h1>
          <p className="text-sm text-gray-500 mt-1">
            Create automated triggers, define rule evaluations, and configure action pipelines.
          </p>
        </div>
        <Link
          href="/admin/workflows"
          className="px-4 py-2 border border-gray-200 text-slate-355 hover:bg-white hover:text-white rounded-lg text-sm transition"
        >
          ← Dashboard Home
        </Link>
      </div>

      {/* Workflows Table */}
      <div className="bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-base font-bold text-gray-900">Active Blueprints</h2>
          <span className="text-xs text-gray-400">{workflows.length} rules</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-xs text-gray-400 uppercase tracking-wider">
                <th className="text-left px-6 py-3">Workflow Name</th>
                <th className="text-left px-6 py-3">Trigger Event</th>
                <th className="text-left px-6 py-3">Actions Count</th>
                <th className="text-left px-6 py-3">Status</th>
                <th className="text-left px-6 py-3">Version</th>
                <th className="text-left px-6 py-3">Owner</th>
              </tr>
            </thead>
            <tbody>
              {workflows.map((wf) => {
                const ownerObj = wf.owner as any;
                return (
                  <tr key={wf._id?.toString()} className="border-b border-slate-850 hover:bg-white transition">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-gray-900 font-medium text-sm">{wf.name}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{wf.description || "No description"}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-indigo-600">{wf.trigger.type}</td>
                    <td className="px-6 py-4 font-mono text-xs text-gray-500">{wf.actions.length} actions</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                        wf.status === "active" ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
                        wf.status === "paused" ? "bg-amber-50 text-amber-700 border-amber-200" :
                        "bg-white text-gray-400 border-gray-200"
                      }`}>
                        {wf.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-gray-500">v{wf.version}</td>
                    <td className="px-6 py-4 text-gray-500 text-xs">
                      {ownerObj ? `${ownerObj.firstName} ${ownerObj.lastName}` : "System"}
                    </td>
                  </tr>
                );
              })}
              {workflows.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-550 text-xs font-mono">No automation rules registered.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
