"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/dialogs/ToastProvider";
import { ArrowRightLeft, Users, AlertTriangle, Loader2 } from "lucide-react";

interface BatchOption {
  _id: string;
  batchName: string;
  batchCode?: string;
  currentStrength: number;
  maxCapacity: number;
  status?: string;
}

interface TransferStudentModalProps {
  currentBatchId: string;
  studentId: string;
  studentName: string;
  availableBatches?: BatchOption[];
}

export function TransferStudentModal({
  currentBatchId,
  studentId,
  studentName,
  availableBatches = [],
}: TransferStudentModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [targetBatchId, setTargetBatchId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [fetchingBatches, setFetchingBatches] = useState(false);
  const [batches, setBatches] = useState<BatchOption[]>(availableBatches);
  const router = useRouter();
  const toast = useToast();

  const handleOpen = async () => {
    setIsOpen(true);
    if (batches.length === 0) {
      setFetchingBatches(true);
      try {
        const res = await fetch("/api/batches");
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setBatches(
            json.data
              .filter((b: any) => b._id !== currentBatchId)
              .map((b: any) => ({
                _id: b._id,
                batchName: b.batchName || b.name,
                batchCode: b.batchCode || b.code,
                currentStrength: b.currentStrength ?? 0,
                maxCapacity: b.maxCapacity ?? 30,
                status: b.status,
              }))
          );
        }
      } catch (err) {
        console.error("Failed to load target batches", err);
      } finally {
        setFetchingBatches(false);
      }
    }
  };

  const handleTransfer = async () => {
    if (!targetBatchId) {
      toast.error("Selection Required", "Please choose a destination batch.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/batches/${currentBatchId}/students/transfer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          toBatchId: targetBatchId,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Student Transferred", `${studentName} has been transferred successfully.`);
        setIsOpen(false);
        router.refresh();
      } else {
        toast.error("Transfer Blocked", data.error || data.message || "Failed to transfer student.");
      }
    } catch {
      toast.error("Network Error", "Unable to complete batch transfer.");
    } finally {
      setLoading(false);
    }
  };

  const eligibleBatches = batches.filter((b) => b._id !== currentBatchId);

  return (
    <>
      <button
        onClick={handleOpen}
        type="button"
        title="Transfer to another batch"
        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-[11px] transition shadow-2xs"
      >
        <ArrowRightLeft className="size-3 text-indigo-600" />
        Transfer
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 flex flex-col gap-4 border border-slate-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <ArrowRightLeft className="size-4 text-indigo-600" />
                Transfer Student Between Batches
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
              <div className="text-slate-500 font-medium">Student</div>
              <div className="text-slate-900 font-bold text-sm mt-0.5">{studentName}</div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span>Select Destination Batch</span>
                <span className="text-[10px] text-slate-400 font-normal">Capacity enforced</span>
              </label>

              {fetchingBatches ? (
                <div className="py-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                  <Loader2 className="size-3.5 animate-spin" />
                  Loading batches...
                </div>
              ) : eligibleBatches.length === 0 ? (
                <div className="p-3 bg-amber-50 text-amber-800 text-xs rounded-lg border border-amber-200 flex items-center gap-2">
                  <AlertTriangle className="size-4 shrink-0" />
                  No alternative active batches found.
                </div>
              ) : (
                <select
                  value={targetBatchId}
                  onChange={(e) => setTargetBatchId(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">— Select Target Batch —</option>
                  {eligibleBatches.map((b) => {
                    const isFull = b.currentStrength >= b.maxCapacity;
                    return (
                      <option key={b._id} value={b._id} disabled={isFull}>
                        {b.batchName} ({b.currentStrength}/{b.maxCapacity} seats occupied)
                        {isFull ? " — FULL" : ""}
                      </option>
                    );
                  })}
                </select>
              )}
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              Transferring a student updates their active batch roster, adjusts seat capacity, and logs
              audit events in both source and destination batch timelines.
            </p>

            <div className="flex justify-end gap-2 mt-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loading || !targetBatchId}
                onClick={handleTransfer}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition shadow-sm inline-flex items-center gap-1.5"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-3 animate-spin" />
                    Transferring...
                  </>
                ) : (
                  <>
                    <ArrowRightLeft className="size-3" />
                    Confirm Transfer
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
