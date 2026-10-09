/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import Link from "next/link";
import { feePlanRepository } from "../../../../../repositories/fee-plan.repository";
import { connectDB } from "../../../../../config/db";

export const revalidate = 0;

export default async function FeePlansPage() {
  await connectDB();

  const feePlans = await feePlanRepository.findMany({}, { populate: ["course"] });

  return (
    <div className="flex flex-col gap-10">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Fee Plans</h1>
          <p className="text-sm text-gray-500 mt-1">
            Configure tuition structures, installment rules, and tax rates per course.
          </p>
        </div>
        <Link
          href="/admin/finance"
          className="px-4 py-2 border border-gray-200 text-gray-600 hover:bg-white hover:text-white rounded-lg text-sm transition"
        >
          ← Finance Home
        </Link>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Total Fee Plans", val: feePlans.length, color: "text-indigo-600" },
          { label: "Avg Base Fee", val: feePlans.length > 0 ? `$${((feePlans.reduce((s, p) => s + p.baseFee, 0) / feePlans.length) / 100).toFixed(2)}` : "$0.00", color: "text-emerald-600" },
          { label: "Avg Tax Rate", val: feePlans.length > 0 ? `${(feePlans.reduce((s, p) => s + p.tax, 0) / feePlans.length).toFixed(1)}%` : "0%", color: "text-amber-700" },
        ].map((kpi, idx) => (
          <div key={idx} className="bg-gray-50 border border-gray-200 p-6 rounded-2xl">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{kpi.label}</div>
            <div className={`text-2xl font-black mt-2 ${kpi.color}`}>{kpi.val}</div>
          </div>
        ))}
      </div>

      {/* Fee Plans Table */}
      <div className="bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-base font-bold text-gray-900">Fee Plan Registry</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-xs text-gray-400 uppercase tracking-wider">
                <th className="text-left px-6 py-3">Plan Code</th>
                <th className="text-left px-6 py-3">Course</th>
                <th className="text-left px-6 py-3">Session</th>
                <th className="text-left px-6 py-3">Base Fee</th>
                <th className="text-left px-6 py-3">Reg Fee</th>
                <th className="text-left px-6 py-3">Lab Fee</th>
                <th className="text-left px-6 py-3">Exam Fee</th>
                <th className="text-left px-6 py-3">Tax</th>
                <th className="text-left px-6 py-3">Currency</th>
              </tr>
            </thead>
            <tbody>
              {feePlans.map((plan) => {
                const courseObj = plan.course as any;
                return (
                  <tr key={plan._id?.toString()} className="border-b border-slate-850 hover:bg-white transition">
                    <td className="px-6 py-4 font-mono text-xs text-indigo-600 font-bold">{plan.code}</td>
                    <td className="px-6 py-4 text-white text-sm font-medium">{courseObj?.name || "—"}</td>
                    <td className="px-6 py-4 text-gray-500 text-xs">{plan.academicSession}</td>
                    <td className="px-6 py-4 text-white font-mono text-xs">${(plan.baseFee / 100).toFixed(2)}</td>
                    <td className="px-6 py-4 text-gray-500 font-mono text-xs">${(plan.registrationFee / 100).toFixed(2)}</td>
                    <td className="px-6 py-4 text-gray-500 font-mono text-xs">${(plan.labFee / 100).toFixed(2)}</td>
                    <td className="px-6 py-4 text-gray-500 font-mono text-xs">${(plan.examFee / 100).toFixed(2)}</td>
                    <td className="px-6 py-4 text-amber-700 font-mono text-xs">{plan.tax}%</td>
                    <td className="px-6 py-4 text-gray-500 text-xs uppercase">{plan.currency}</td>
                  </tr>
                );
              })}
              {feePlans.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-550 text-xs">No fee plans configured.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
