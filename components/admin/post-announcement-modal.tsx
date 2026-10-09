"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { EnterpriseDialog } from "../ui/dialogs/EnterpriseDialog";
import { useToast } from "../ui/dialogs/ToastProvider";
import { Bell } from "lucide-react";

interface PostAnnouncementModalProps {
  liveClassId: string;
}

export function PostAnnouncementModal({ liveClassId }: PostAnnouncementModalProps) {
  const router = useRouter();
  const toast = useToast();
  
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", isPinned: false });

  const handlePost = async () => {
    if (!form.title || !form.content) {
      toast.error("Validation Error", "Title and content are required.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/live-classes/${liveClassId}/announcements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      
      const data = await res.json();
      if (data.success) {
        toast.success("Announcement Posted", "Students have been notified.");
        setIsOpen(false);
        setForm({ title: "", content: "", isPinned: false });
        router.refresh();
      } else {
        toast.error("Failed to Post", data.error || data.message || "Unable to post announcement");
      }
    } catch (err) {
      toast.error("Network Error", "Could not connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg border border-indigo-200 flex items-center gap-1.5 transition"
      >
        <Bell className="w-3.5 h-3.5" />
        Post Announcement
      </button>

      <EnterpriseDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Post Announcement"
        subtitle="Notify students in this live session"
        confirmLabel="Post Announcement"
        onConfirm={handlePost}
        loading={loading}
      >
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1.5">Announcement Title</label>
            <input 
              type="text"
              value={form.title}
              onChange={e => setForm({...form, title: e.target.value})}
              placeholder="e.g. Please read Chapter 4 before class"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1.5">Content</label>
            <textarea 
              value={form.content}
              onChange={e => setForm({...form, content: e.target.value})}
              placeholder="Detailed instructions or message..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              id="isPinned"
              checked={form.isPinned}
              onChange={e => setForm({...form, isPinned: e.target.checked})}
              className="rounded text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="isPinned" className="text-sm font-medium text-gray-700">Pin to top of class view</label>
          </div>
        </div>
      </EnterpriseDialog>
    </>
  );
}
