"use client";

import React, { useState } from "react";
import { X, Save, Edit2, Link as LinkIcon, Clock } from "lucide-react";
import { useToast } from "@/components/ui/dialogs/ToastProvider";
import { useRouter } from "next/navigation";

interface EditLiveClassModalProps {
  liveClassId: string;
  initialTitle: string;
  initialDuration: number;
  initialRecordingUrl?: string;
}

export function EditLiveClassModal({ liveClassId, initialTitle, initialDuration, initialRecordingUrl }: EditLiveClassModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [classTitle, setClassTitle] = useState(initialTitle);
  const [duration, setDuration] = useState(initialDuration);
  const [recordingUrl, setRecordingUrl] = useState(initialRecordingUrl || "");
  
  const toast = useToast();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // 1. Update basic fields
      const res = await fetch(`/api/live-classes/${liveClassId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classTitle, duration: Number(duration) })
      });
      if (!res.ok) throw new Error("Failed to update live class details");

      // 2. Publish or update recording URL if provided
      if (recordingUrl) {
        const recRes = await fetch(`/api/live-classes/${liveClassId}/recordings`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recordingUrl,
            duration: Number(duration),
            status: "processed"
          })
        });
        if (!recRes.ok) throw new Error("Failed to save recording URL");
      }

      toast.success("Saved", "Live class details updated successfully.");
      setIsOpen(false);
      router.refresh();
    } catch (e: any) {
      toast.error("Error", e.message || "Failed to update live class");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-sm transition font-medium flex items-center gap-2"
      >
        <Edit2 className="w-4 h-4" /> Edit Class Details
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-extrabold text-lg text-slate-800">Edit Live Class</h3>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:bg-slate-100 hover:text-slate-600 p-2 rounded-full transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Class Title</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition text-sm text-slate-800 font-medium"
                  value={classTitle}
                  onChange={(e) => setClassTitle(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wide flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Duration (Minutes)
                </label>
                <input
                  type="number"
                  required
                  min="15"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition text-sm text-slate-800 font-medium"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wide flex items-center gap-1.5">
                  <LinkIcon className="w-3.5 h-3.5" /> Recorded Session URL
                </label>
                <input
                  type="url"
                  placeholder="https://example.com/recording.mp4"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition text-sm text-slate-800 font-medium"
                  value={recordingUrl}
                  onChange={(e) => setRecordingUrl(e.target.value)}
                />
                <p className="text-[11px] text-slate-500">Provide a link to the archived recording. This will make it available to assigned parents and students.</p>
              </div>
              
              <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition flex items-center gap-2 shadow-sm disabled:opacity-50"
                >
                  <Save className="w-4 h-4" /> {isSubmitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
