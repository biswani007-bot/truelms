"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { AddBatchModal } from "./AddBatchModal";

interface BatchManagementViewProps {
  initialBatches: any[];
}

const StatusBadge = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    planning: "bg-white text-gray-500 border-gray-300",
    open: "bg-emerald-50 text-emerald-600 border-emerald-200",
    active: "bg-blue-950 text-blue-400 border-blue-500/20",
    full: "bg-amber-50 text-amber-700 border-amber-200",
    "waiting-list": "bg-purple-950 text-purple-400 border-purple-500/20",
    completed: "bg-white text-gray-400 border-gray-300",
    cancelled: "bg-red-950 text-red-400 border-red-500/20",
    archived: "bg-white text-gray-500 border-gray-200",
  };
  return (
    <span
      className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider border ${
        colors[status] ?? "bg-white text-gray-500 border-gray-300"
      }`}
    >
      {status}
    </span>
  );
};

export function BatchManagementView({ initialBatches }: BatchManagementViewProps) {
  const [batches, setBatches] = useState<any[]>(initialBatches);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  const handleBatchCreated = async (newBatch: any) => {
    // Add newly created batch to local state immediately
    if (newBatch) {
      setBatches((prev) => {
        const id = newBatch._id?.toString() || newBatch.id;
        const exists = prev.some((b) => (b._id?.toString() || b.id) === id);
        if (exists) return prev;
        return [newBatch, ...prev];
      });
    }

    // Refresh data in background from server
    try {
      const res = await fetch("/api/batches?limit=100");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setBatches(json.data);
      }
    } catch {
      // Keep optimistic state if network fails
    }

    router.refresh();
  };

  return (
    <div className="flex flex-col gap-10">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Batch Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            All learning batches — capacity enforced by Platform Settings rule engine.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="size-4" />
            Add Batch
          </button>
          <Link
            href="/admin/batches/dashboard"
            className="px-4 py-2 border border-gray-300 text-gray-600 hover:bg-white hover:text-white rounded-lg text-sm transition"
          >
            Engine Dashboard →
          </Link>
        </div>
      </div>

      {/* Batch Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {batches.map((batch: any) => {
          const courseRef = batch.course as unknown as { name?: string; courseName?: string };
          const cohortRef = batch.cohort as unknown as { name?: string; cohortName?: string; cohortCode?: string };
          const utilPct =
            batch.maxCapacity > 0
              ? Math.round((batch.currentStrength / batch.maxCapacity) * 100)
              : 0;
          const batchId = batch._id?.toString() || batch.id;

          return (
            <div
              key={batchId}
              className="bg-gray-50 border border-gray-200 p-6 rounded-2xl hover:border-gray-300 transition flex flex-col gap-4"
            >
              <div className="flex justify-between items-start">
                <span className="font-mono text-xs text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-1 rounded">
                  {batch.batchCode || batch.code}
                </span>
                <StatusBadge status={batch.status} />
              </div>

              <div>
                <h3 className="font-bold text-white text-lg leading-tight line-clamp-1">
                  {batch.batchName || batch.name}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Course: {courseRef?.name || courseRef?.courseName || "N/A"}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Cohort: {cohortRef?.name || cohortRef?.cohortName || (cohortRef?.cohortCode ? `[${cohortRef.cohortCode}]` : "N/A")}
                </p>
              </div>

              {/* Capacity Bar */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-500">Capacity</span>
                  <span className="font-bold text-white">
                    {batch.currentStrength} / {batch.maxCapacity}
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full ${
                      utilPct > 90
                        ? "bg-red-500"
                        : utilPct > 70
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                    }`}
                    style={{ width: `${utilPct}%` }}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5 text-xs text-gray-500">
                <div className="flex justify-between">
                  <span>Teacher:</span>
                  <span className="text-gray-900 font-medium">
                    {batch.primaryTeacher?.name || "TBD"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Waiting:</span>
                  <span
                    className={
                      batch.waitingCount > 0 ? "text-purple-400 font-bold" : "text-gray-400"
                    }
                  >
                    {batch.waitingCount} students
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Start:</span>
                  <span className="text-white">
                    {new Date(batch.batchStart).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200 flex gap-2">
                <Link
                  href={`/admin/batches/${batchId}`}
                  className="flex-1 text-center py-2 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-lg border border-indigo-200 hover:bg-indigo-900 transition"
                >
                  Manage Batch
                </Link>
                <Link
                  href={`/admin/batches/${batchId}/students`}
                  className="flex-1 text-center py-2 bg-gray-100 text-gray-600 text-xs font-bold rounded-lg border border-gray-300 hover:bg-slate-700 transition"
                >
                  Students
                </Link>
              </div>
            </div>
          );
        })}
        {batches.length === 0 && (
          <div className="col-span-full py-20 text-center text-gray-400 text-sm">
            No batches created yet. Click "Add Batch" to create your first batch.
          </div>
        )}
      </div>

      {/* Add Batch Modal */}
      <AddBatchModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onBatchCreated={handleBatchCreated}
      />
    </div>
  );
}
