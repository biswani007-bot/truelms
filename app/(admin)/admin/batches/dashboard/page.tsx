import React from "react";
import Link from "next/link";
import { connectDB } from "../../../../../config/db";
import { batchRepository } from "../../../../../repositories/batch.repository";
import { batchStudentRepository } from "../../../../../repositories/batch-student.repository";
import { batchWaitingListRepository } from "../../../../../repositories/batch-waiting-list.repository";
import { batchRecommendationRepository } from "../../../../../repositories/batch-recommendation.repository";

export const revalidate = 0;

const StatusBadge = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    "planning": "bg-white text-gray-500 border-gray-300",
    "open": "bg-emerald-50 text-emerald-600 border-emerald-200",
    "active": "bg-blue-950 text-blue-400 border-blue-500/20",
    "full": "bg-amber-50 text-amber-700 border-amber-200",
    "waiting-list": "bg-purple-950 text-purple-400 border-purple-500/20",
    "completed": "bg-white text-gray-400 border-gray-300",
    "cancelled": "bg-red-950 text-red-400 border-red-500/20",
    "archived": "bg-white text-gray-500 border-gray-200",
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider border ${colors[status] ?? "bg-white text-gray-500 border-gray-300"}`}>
      {status}
    </span>
  );
};

export default async function BatchDashboardPage() {
  await connectDB();

  const [batches, students, waiting, recs] = await Promise.all([
    batchRepository.findMany({}),
    batchStudentRepository.findMany({ status: "active" }),
    batchWaitingListRepository.findMany({ status: "waiting" }),
    batchRecommendationRepository.findMany({ isResolved: false }),
  ]);

  const running = batches.filter((b) => b.status === "active" || b.status === "open").length;
  const full = batches.filter((b) => b.status === "full").length;
  const totalSeats = batches.reduce((acc, b) => acc + b.maxCapacity, 0);
  const usedSeats = batches.reduce((acc, b) => acc + b.currentStrength, 0);
  const utilization = totalSeats > 0 ? Math.round((usedSeats / totalSeats) * 100) : 0;

  const kpis = [
    { label: "Total Batches", value: batches.length, color: "text-indigo-600", icon: "⬡" },
    { label: "Running / Open", value: running, color: "text-emerald-600", icon: "▶" },
    { label: "Full Batches", value: full, color: "text-amber-700", icon: "⊠" },
    { label: "Students Enrolled", value: students.length, color: "text-blue-400", icon: "◉" },
    { label: "Waiting List", value: waiting.length, color: "text-purple-400", icon: "◎" },
    { label: "Unresolved Recommendations", value: recs.length, color: "text-red-400", icon: "⚠" },
    { label: "Capacity Utilization", value: `${utilization}%`, color: "text-cyan-600", icon: "◔" },
    { label: "Total Seats", value: totalSeats, color: "text-gray-600", icon: "▣" },
  ];

  return (
    <div className="flex flex-col gap-10">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Batch Engine Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Rule-based batch management — all capacity limits sourced from Platform Settings.
          </p>
        </div>
        <Link
          href="/admin/batches"
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-lg transition"
        >
          All Batches →
        </Link>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => (
          <div key={idx} className="bg-gray-50 border border-gray-200 p-5 rounded-2xl">
            <div className="flex justify-between items-start mb-3">
              <span className="text-xl">{kpi.icon}</span>
            </div>
            <div className={`text-3xl font-extrabold ${kpi.color}`}>{kpi.value}</div>
            <div className="text-xs text-gray-500 mt-1">{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Utilization Bar */}
      <div className="bg-gray-50 border border-gray-200 p-6 rounded-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-base font-bold text-gray-900">Overall Capacity Utilization</h2>
          <span className="text-sm font-bold text-cyan-600">{utilization}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all ${utilization > 90 ? "bg-red-500" : utilization > 70 ? "bg-amber-500" : "bg-emerald-500"}`}
            style={{ width: `${utilization}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-2">
          <span>{usedSeats} seats occupied</span>
          <span>{totalSeats - usedSeats} seats available</span>
        </div>
      </div>

      {/* Recent Batches Table */}
      <div className="bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-base font-bold text-gray-900">Batch Roster</h2>
          <Link href="/admin/batches" className="text-xs text-indigo-600 hover:text-indigo-500">
            View All →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-xs text-gray-400 uppercase tracking-wider">
                <th className="text-left px-6 py-3">Batch Code</th>
                <th className="text-left px-6 py-3">Name</th>
                <th className="text-left px-6 py-3">Status</th>
                <th className="text-left px-6 py-3">Enrolled</th>
                <th className="text-left px-6 py-3">Max Cap.</th>
                <th className="text-left px-6 py-3">Waiting</th>
                <th className="text-left px-6 py-3">Start</th>
                <th className="text-left px-6 py-3 w-20">Actions</th>
              </tr>
            </thead>
            <tbody>
              {batches.slice(0, 10).map((batch) => (
                <tr key={batch._id?.toString()} className="border-b border-slate-850 hover:bg-white transition">
                  <td className="px-6 py-3 font-mono text-xs text-indigo-600">{batch.batchCode}</td>
                  <td className="px-6 py-3 font-medium text-white truncate max-w-[180px]">{batch.batchName}</td>
                  <td className="px-6 py-3"><StatusBadge status={batch.status} /></td>
                  <td className="px-6 py-3 text-gray-600">{batch.currentStrength}</td>
                  <td className="px-6 py-3 text-gray-600">{batch.maxCapacity}</td>
                  <td className="px-6 py-3 text-purple-400">{batch.waitingCount}</td>
                  <td className="px-6 py-3 text-gray-500 text-xs">{new Date(batch.batchStart).toLocaleDateString()}</td>
                  <td className="px-6 py-3">
                    <Link href={`/admin/batches/${batch._id?.toString()}`} className="text-indigo-600 hover:text-indigo-500 text-xs font-bold">
                      Manage →
                    </Link>
                  </td>
                </tr>
              ))}
              {batches.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-gray-400 text-sm">No batches found. Create your first batch.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
