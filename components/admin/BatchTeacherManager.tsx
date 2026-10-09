"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/dialogs/ToastProvider";
import { UserPlus, Trash2, Loader2, Shield, BookOpen, Users } from "lucide-react";

interface Teacher {
  _id: string;
  firstName: string;
  lastName: string;
  designation?: string;
  teacherCode?: string;
}

interface Assignment {
  _id: string;
  teacher: Teacher;
  role: "primary" | "assistant" | "mentor";
  isOverride: boolean;
  notes?: string;
  assignedAt?: string;
}

interface Props {
  batchId: string;
  assignments: Assignment[];
  allTeachers: Teacher[];
}

const ROLE_COLOR: Record<string, string> = {
  primary: "bg-indigo-50 text-indigo-700 border-indigo-200",
  assistant: "bg-amber-50 text-amber-700 border-amber-200",
  mentor: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

export function BatchTeacherManager({ batchId, assignments: initial, allTeachers }: Props) {
  const router = useRouter();
  const toast = useToast();

  const [assignments, setAssignments] = useState<Assignment[]>(initial);

  useEffect(() => {
    setAssignments(initial);
  }, [initial]);

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const [newTeacherId, setNewTeacherId] = useState("");
  const [newRole, setNewRole] = useState<"primary" | "assistant" | "mentor">("primary");
  const [newNotes, setNewNotes] = useState("");
  const [isOverride, setIsOverride] = useState(false);

  // Teachers not yet assigned to this batch
  const assignedIds = new Set(assignments.map((a) => a.teacher._id));
  const availableTeachers = allTeachers.filter((t) => !assignedIds.has(t._id));

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeacherId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/batches/${batchId}/teachers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacherId: newTeacherId,
          role: newRole,
          notes: newNotes || undefined,
          isOverride,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Teacher Assigned", `Assigned as ${newRole} successfully.`);
        setShowForm(false);
        setNewTeacherId("");
        setNewNotes("");
        setIsOverride(false);
        router.refresh();
      } else {
        toast.error("Assignment Failed", data.error || data.message || "Could not assign teacher.");
      }
    } catch {
      toast.error("Network Error", "Error assigning teacher.");
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (assignmentId: string) => {
    if (!confirm("Remove this teacher assignment? This cannot be undone.")) return;
    setRemovingId(assignmentId);
    try {
      const res = await fetch(`/api/batches/${batchId}/teachers/${assignmentId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Removed", "Teacher assignment removed.");
        setAssignments((prev) => prev.filter((a) => a._id !== assignmentId));
        router.refresh();
      } else {
        toast.error("Error", data.error || "Could not remove assignment.");
      }
    } catch {
      toast.error("Network Error", "Error removing assignment.");
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="bg-gray-50 border border-gray-200 p-5 rounded-2xl">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
          <Users className="w-4 h-4 text-indigo-600" />
          Assigned Faculty ({assignments.length})
        </h2>
        {availableTeachers.length > 0 && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 rounded-lg transition"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Assign Faculty
          </button>
        )}
      </div>

      {/* Assign Form */}
      {showForm && (
        <form onSubmit={handleAssign} className="mb-4 p-4 bg-white border border-indigo-100 rounded-xl space-y-3 text-xs">
          <div>
            <label className="block font-bold text-slate-600 mb-1">Select Teacher *</label>
            <select
              value={newTeacherId}
              onChange={(e) => setNewTeacherId(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
            >
              <option value="">— Select Faculty —</option>
              {availableTeachers.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.firstName} {t.lastName} {t.designation ? `(${t.designation})` : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-bold text-slate-600 mb-1">Role *</label>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as typeof newRole)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
            >
              <option value="primary">Primary Instructor</option>
              <option value="assistant">Assistant Instructor</option>
              <option value="mentor">Mentor</option>
            </select>
          </div>
          <div>
            <label className="block font-bold text-slate-600 mb-1">Notes (optional)</label>
            <input
              type="text"
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              placeholder="e.g. covering first 6 weeks"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isOverride}
              onChange={(e) => setIsOverride(e.target.checked)}
              className="rounded accent-indigo-600"
            />
            <span className="text-slate-600 font-semibold">Manual Override (bypasses auto-assignment)</span>
          </label>
          <div className="flex gap-2 justify-end pt-1">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-1.5 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1.5"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
              {saving ? "Assigning..." : "Assign"}
            </button>
          </div>
        </form>
      )}

      {/* Assignments List */}
      <div className="flex flex-col gap-2">
        {assignments.map((a) => (
          <div key={a._id} className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-xs text-slate-900 truncate">
                  {a.teacher.firstName} {a.teacher.lastName}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize ${ROLE_COLOR[a.role] || "bg-slate-50 text-slate-600 border-slate-200"}`}>
                  {a.role}
                </span>
                {a.isOverride && (
                  <span className="text-[10px] font-bold text-amber-700 flex items-center gap-0.5">
                    <Shield className="w-3 h-3" /> Override
                  </span>
                )}
              </div>
              {a.teacher.designation && (
                <p className="text-[10px] text-slate-400 mt-0.5">{a.teacher.designation}</p>
              )}
              {a.notes && (
                <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                  <BookOpen className="w-3 h-3" /> {a.notes}
                </p>
              )}
            </div>
            <button
              onClick={() => handleRemove(a._id)}
              disabled={removingId === a._id}
              className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-40"
              title="Remove assignment"
            >
              {removingId === a._id ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        ))}
        {assignments.length === 0 && (
          <div className="text-xs text-gray-400 text-center py-4">
            No faculty assigned yet. Use "Assign Faculty" above.
          </div>
        )}
      </div>
    </div>
  );
}
