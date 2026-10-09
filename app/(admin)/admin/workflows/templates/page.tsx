/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import Link from "next/link";
import { workflowTemplateRepository } from "../../../../../repositories/workflow-template.repository";
import { connectDB } from "../../../../../config/db";

export const revalidate = 0;

export default async function WorkflowTemplatesPage() {
  await connectDB();

  const templates = await workflowTemplateRepository.findMany({});

  return (
    <div className="flex flex-col gap-10">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Workflow Templates</h1>
          <p className="text-sm text-gray-500 mt-1">
            Pre-configured automation blueprints to deploy workflows for common academic and financial triggers.
          </p>
        </div>
        <Link
          href="/admin/workflows"
          className="px-4 py-2 border border-gray-200 text-slate-355 hover:bg-white hover:text-white rounded-lg text-sm transition"
        >
          ← Dashboard Home
        </Link>
      </div>

      {/* Grid of Templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((tpl) => (
          <div key={tpl._id?.toString()} className="bg-gray-50 border border-gray-200 rounded-2xl p-6 flex flex-col gap-4">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-sm font-bold text-gray-900">{tpl.name}</h2>
                <div className="text-[10px] text-indigo-600 font-mono mt-0.5">{tpl.triggerType}</div>
              </div>
              <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-white text-gray-400 border border-slate-850">
                {tpl.category}
              </span>
            </div>

            <p className="text-xs text-gray-500">{tpl.description || "No description provided."}</p>

            <div className="border-t border-slate-850 pt-3">
              <span className="text-[10px] text-slate-550 uppercase tracking-wider">Configured Actions:</span>
              <div className="flex flex-wrap gap-1 mt-2">
                {tpl.actions.map((act, i) => (
                  <span key={i} className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-white text-gray-500 border border-gray-200">
                    {act.type}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
        {templates.length === 0 && (
          <div className="col-span-3 text-center py-12 text-slate-550 text-xs border border-gray-200 rounded-2xl">
            No templates configured.
          </div>
        )}
      </div>
    </div>
  );
}
