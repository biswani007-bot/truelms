"use client";

import React, { useState } from "react";
import { Plus, Send, User, SlidersHorizontal } from "lucide-react";
import { EnterpriseDialog } from "@/components/ui/dialogs/EnterpriseDialog";
import { useToast } from "@/components/ui/dialogs/ToastProvider";

export default function AnnouncementsPublisher() {
  const toast = useToast();
  const [announcements, setAnnouncements] = useState([
    { id: "a1", title: "System Maintenance: Next Sunday", audience: "All Users", priority: "High", date: "2026-07-15", status: "Published" },
    { id: "a2", title: "New Semester Course Registrations open", audience: "Students Only", priority: "Medium", date: "2026-07-16", status: "Draft" }
  ]);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [audience, setAudience] = useState("All Users");
  const [priority, setPriority] = useState("Medium");

  const handleCreateConfirm = () => {
    if (!title.trim()) {
      toast.error("Validation Error", "Announcement title is required.");
      return;
    }

    setAnnouncements(prev => [
      ...prev,
      { id: `a-${Date.now()}`, title: title.trim(), audience, priority, date: new Date().toISOString().split("T")[0], status: "Published" }
    ]);
    toast.success("Announcement Broadcast", `Bulletin "${title}" published.`);
    setShowModal(false);
    setTitle("");
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Broadcast Announcements</h1>
          <p className="text-sm text-gray-500 mt-1">Publish critical bulletins to target cohorts, batches, departments, or role groups.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-lg shadow-sm transition flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Create Announcement
        </button>
      </div>

      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-gray-500 text-xs font-semibold uppercase tracking-wider">
              <th className="p-4">Title</th>
              <th className="p-4">Audience</th>
              <th className="p-4">Priority</th>
              <th className="p-4">Date</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {announcements.map((a) => (
              <tr key={a.id} className="hover:bg-gray-50/50 transition">
                <td className="p-4 font-semibold text-gray-900">{a.title}</td>
                <td className="p-4 text-gray-650">{a.audience}</td>
                <td className="p-4">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    a.priority === 'High' ? 'bg-red-50 text-red-750 border border-red-200' : 'bg-slate-50 text-gray-500 border border-gray-250'
                  }`}>
                    {a.priority}
                  </span>
                </td>
                <td className="p-4 text-gray-400 font-mono text-xs">{a.date}</td>
                <td className="p-4">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {a.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* EnterpriseDialog */}
      <EnterpriseDialog
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Broadcast New Announcement"
        subtitle="Publish a bulletin to students, faculty, or system roles."
        confirmLabel="Broadcast Announcement"
        cancelLabel="Cancel"
        onConfirm={handleCreateConfirm}
      >
        <div className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Announcement Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Schedule Update for Fall Cohorts"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Target Audience</label>
              <select
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="All Users">All Users</option>
                <option value="Students Only">Students Only</option>
                <option value="Teachers Only">Teachers Only</option>
                <option value="Parents Only">Parents Only</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="High">High (Urgent Banner)</option>
                <option value="Medium">Medium (Standard Bulletin)</option>
                <option value="Low">Low (Informational)</option>
              </select>
            </div>
          </div>
        </div>
      </EnterpriseDialog>
    </div>
  );
}
