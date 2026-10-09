"use client";

import React, { useState } from "react";
import { Clock, Plus, Mail } from "lucide-react";
import { EnterpriseDialog } from "@/components/ui/dialogs/EnterpriseDialog";
import { useToast } from "@/components/ui/dialogs/ToastProvider";

export default function ReportScheduler() {
  const toast = useToast();
  const [schedules, setSchedules] = useState([
    { id: "sch1", reportName: "Weekly Revenue Statement", frequency: "Every Monday", format: "CSV", recipients: "board@lmsca.edu", status: "Active" },
    { id: "sch2", reportName: "Monthly Student Success Roster", frequency: "First of Month", format: "PDF", recipients: "academics@lmsca.edu", status: "Active" }
  ]);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [reportName, setReportName] = useState("");
  const [frequency, setFrequency] = useState("Weekly");
  const [format, setFormat] = useState("CSV");
  const [recipients, setRecipients] = useState("");

  const handleCreateScheduleConfirm = () => {
    if (!reportName.trim() || !recipients.trim()) {
      toast.error("Validation Error", "Report name and recipient emails are required.");
      return;
    }

    setSchedules(prev => [
      ...prev,
      { id: `sch-${Date.now()}`, reportName: reportName.trim(), frequency, format, recipients: recipients.trim(), status: "Active" }
    ]);
    toast.success("Schedule Created", `Report "${reportName}" configured for automated delivery.`);
    setShowModal(false);
    setReportName("");
    setRecipients("");
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Report Scheduler</h1>
          <p className="text-sm text-gray-500 mt-1">Configure automated recurring dispatches of data sheets to administrative staff.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-lg shadow-sm transition flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Schedule Report
        </button>
      </div>

      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-gray-500 text-xs font-semibold uppercase tracking-wider">
              <th className="p-4">Report Name</th>
              <th className="p-4">Frequency</th>
              <th className="p-4">File Format</th>
              <th className="p-4">Recipients</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {schedules.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50/50 transition">
                <td className="p-4 font-semibold text-gray-900">{s.reportName}</td>
                <td className="p-4 text-gray-650 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-gray-400" /> {s.frequency}
                </td>
                <td className="p-4 font-mono text-xs font-bold text-gray-900">{s.format}</td>
                <td className="p-4 text-gray-450 text-xs">{s.recipients}</td>
                <td className="p-4">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {s.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Schedule Report EnterpriseDialog */}
      <EnterpriseDialog
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Schedule Automated Report"
        subtitle="Set up recurring email delivery for executive and academic reports."
        confirmLabel="Schedule Report"
        cancelLabel="Cancel"
        onConfirm={handleCreateScheduleConfirm}
      >
        <div className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Report Name *</label>
            <input
              type="text"
              value={reportName}
              onChange={(e) => setReportName(e.target.value)}
              placeholder="e.g. Monthly Attendance Audit"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Frequency</label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Daily">Daily</option>
                <option value="Weekly">Weekly (Every Monday)</option>
                <option value="Monthly">First of Month</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Format</label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="CSV">CSV Data Sheet</option>
                <option value="PDF">PDF Report Document</option>
                <option value="Excel">Excel Workbook</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Recipient Email(s) *</label>
            <input
              type="text"
              value={recipients}
              onChange={(e) => setRecipients(e.target.value)}
              placeholder="academics@lmsca.edu, director@lmsca.edu"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </EnterpriseDialog>
    </div>
  );
}
