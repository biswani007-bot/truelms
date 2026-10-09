"use client";

import React, { useState } from "react";
import { Search, Download, Plus, Settings, CircleCheck } from "lucide-react";
import { EnterpriseDialog } from "@/components/ui/dialogs/EnterpriseDialog";
import { useToast } from "@/components/ui/dialogs/ToastProvider";

export default function ScholarshipManager() {
  const toast = useToast();
  const [scholarships, setScholarships] = useState([
    { id: "sc1", name: "Academic Merit Waiver", type: "Merit-Based", criteria: "GPA >= 3.8", amount: "50% Waiver", status: "Active" },
    { id: "sc2", name: "National Sports Scholarship", type: "Sports-Based", criteria: "State Level Certificate", amount: "30% Waiver", status: "Active" }
  ]);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState("Merit-Based");
  const [amount, setAmount] = useState("");

  const handleCreateConfirm = () => {
    if (!name.trim() || !amount.trim()) {
      toast.error("Validation Error", "Scholarship name and discount amount are required.");
      return;
    }

    setScholarships(prev => [
      ...prev,
      { id: `sc-${Date.now()}`, name: name.trim(), type, criteria: "Verification Required", amount: amount.trim(), status: "Active" }
    ]);
    toast.success("Scholarship Created", `Scholarship "${name}" configured.`);
    setShowModal(false);
    setName("");
    setAmount("");
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Scholarship Management</h1>
          <p className="text-sm text-gray-500 mt-1">Configure merit waivers, need-based grants, and track active scholarship utilizations.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-lg shadow-sm transition"
        >
          Create Scholarship
        </button>
      </div>

      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-gray-500 text-xs font-semibold uppercase tracking-wider">
              <th className="p-4">Name</th>
              <th className="p-4">Type</th>
              <th className="p-4">Eligibility Rules</th>
              <th className="p-4">Value</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {scholarships.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50/50 transition">
                <td className="p-4 font-semibold text-gray-900">{s.name}</td>
                <td className="p-4 text-gray-650">{s.type}</td>
                <td className="p-4 text-gray-400 font-mono text-xs">{s.criteria}</td>
                <td className="p-4 font-bold text-gray-900">{s.amount}</td>
                <td className="p-4">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {s.status}
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
        title="Create Scholarship Grant"
        subtitle="Set up a merit waiver or fee discount policy."
        confirmLabel="Create Grant"
        cancelLabel="Cancel"
        onConfirm={handleCreateConfirm}
      >
        <div className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Scholarship Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. STEM Leadership Grant"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Scholarship Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Merit-Based">Merit-Based</option>
              <option value="Need-Based">Need-Based</option>
              <option value="Sports-Based">Sports-Based</option>
              <option value="Alumni Referral">Alumni Referral</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Discount Amount / Value *</label>
            <input
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 25% Waiver or $500 Credit"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </EnterpriseDialog>
    </div>
  );
}
