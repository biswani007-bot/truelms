"use client";

import React, { useState } from "react";
// Removed legacy Fi icons import

export default function AutomationJobs() {
  const [workflows, setWorkflows] = useState([
    { id: "wf1", trigger: "Lead Created", action: "Send Acknowledgement Email", status: "Active" },
    { id: "wf2", trigger: "Admission Approved", action: "Send Enrollment Notification", status: "Active" },
    { id: "wf3", trigger: "Invoice Generated", action: "Send Overdue Payment Reminder", status: "Active" },
    { id: "wf4", trigger: "Payment Received", action: "Generate and Deliver Receipt", status: "Active" },
    { id: "wf5", trigger: "Assignment Published", action: "Broadcast Student Notification", status: "Active" },
    { id: "wf6", trigger: "Assessment Scheduled", action: "Send Exam Reminder Alert", status: "Active" },
    { id: "wf7", trigger: "Grades Released", action: "Broadcast Student Grade Alert", status: "Active" },
    { id: "wf8", trigger: "Certificate Issued", action: "Send Download Link Notification", status: "Active" }
  ]);

  const handleToggleWorkflow = (id: string) => {
    setWorkflows(prev => prev.map(w => w.id === id ? { ...w, status: w.status === 'Active' ? 'Paused' : 'Active' } : w));
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Scheduled Jobs & Automation Engine</h1>
          <p className="text-sm text-gray-500 mt-1">Configure automated communication workflows, cron rules, and retry queues.</p>
        </div>
      </div>

      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-gray-50 font-bold text-sm text-gray-950">Active Automation Rules</div>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-gray-500 text-xs font-semibold uppercase tracking-wider">
              <th className="p-4">Trigger Event</th>
              <th className="p-4">Target Action</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {workflows.map((w) => (
              <tr key={w.id} className="hover:bg-gray-50/50 transition">
                <td className="p-4 font-semibold text-gray-900">{w.trigger}</td>
                <td className="p-4 text-gray-650">{w.action}</td>
                <td className="p-4">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${w.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-50 text-gray-400'}`}>
                    {w.status}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <button 
                    onClick={() => handleToggleWorkflow(w.id)}
                    className="px-3 py-1 bg-slate-50 hover:bg-slate-100 border text-gray-700 text-xs font-bold rounded-md transition"
                  >
                    {w.status === 'Active' ? "Pause Automation" : "Activate Automation"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
