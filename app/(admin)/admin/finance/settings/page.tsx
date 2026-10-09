"use client";

import React, { useState } from "react";
import { Save } from "lucide-react";
import { useToast } from "@/components/ui/dialogs/ToastProvider";

export default function TaxBillingSettings() {
  const toast = useToast();
  const [gstRate, setGstRate] = useState(18);
  const [invPrefix, setInvPrefix] = useState("TL-INV-");
  const [rcpPrefix, setRcpPrefix] = useState("TL-RCP-");
  const [currency, setCurrency] = useState("USD");

  const handleSaveSettings = () => {
    toast.success("Settings Saved", "Tax & Billing configuration has been updated successfully.");
  };

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto bg-white border rounded-xl shadow-sm p-6 space-y-6">
      <div>
        <h1 className="lms-page-title">Tax &amp; Billing Configuration</h1>
        <p className="lms-caption mt-1">Configure VAT / GST rules, invoice ranges, decimal formats, and currency modes.</p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">GST / VAT Rate (%)</label>
            <input 
              type="number" 
              value={gstRate}
              onChange={(e) => setGstRate(Number(e.target.value))}
              className="w-full mt-1 border px-3 py-2 rounded-lg text-sm focus:outline-none" 
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Primary Currency</label>
            <select 
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full mt-1 border px-3 py-2 rounded-lg text-sm bg-white focus:outline-none"
            >
              <option value="USD">USD ($)</option>
              <option value="INR">INR (₹)</option>
              <option value="EUR">EUR (€)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Invoice Number Prefix</label>
            <input 
              type="text" 
              value={invPrefix}
              onChange={(e) => setInvPrefix(e.target.value)}
              className="w-full mt-1 border px-3 py-2 rounded-lg text-sm focus:outline-none" 
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Receipt Prefix</label>
            <input 
              type="text" 
              value={rcpPrefix}
              onChange={(e) => setRcpPrefix(e.target.value)}
              className="w-full mt-1 border px-3 py-2 rounded-lg text-sm focus:outline-none" 
            />
          </div>
        </div>
      </div>

      <div className="border-t pt-4 flex justify-end">
        <button 
          onClick={handleSaveSettings}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-lg shadow-sm transition flex items-center gap-1.5"
        >
          <Save className="size-4" />
          Update Settings
        </button>
      </div>
    </div>
  );
}
