"use client";

import React from "react";
import { Download, TrendingUp, PieChart, DollarSign } from "lucide-react";
import { useToast } from "@/components/ui/dialogs/ToastProvider";

export default function FinanceReports() {
  const toast = useToast();
  const exportLedger = () => {
    toast.success("Export Complete", "Financial ledger exported to CSV successfully.");
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="lms-page-title">Financial Reports &amp; Analytics</h1>
          <p className="lms-caption mt-1">Forecast collections, analyze cash flows, and generate revenue reports.</p>
        </div>
        <button 
          onClick={exportLedger}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-lg shadow-sm transition flex items-center gap-1.5"
        >
          <Download className="size-4" />
          Generate Revenue Report
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border rounded-xl p-6 shadow-sm flex flex-col justify-between h-44">
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase">Collection Efficiency</span>
            <div className="text-3xl font-black text-emerald-600 mt-2">94.8%</div>
          </div>
          <p className="text-[10px] text-gray-450 mt-2">Cash collection efficiency compared to outstanding billings.</p>
        </div>

        <div className="bg-white border rounded-xl p-6 shadow-sm flex flex-col justify-between h-44">
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase">Revenue Forecast (Q3)</span>
            <div className="text-3xl font-black text-indigo-600 mt-2">$24,500</div>
          </div>
          <p className="text-[10px] text-gray-450 mt-2">Estimated cash flows out of upcoming semester installments.</p>
        </div>

        <div className="bg-white border rounded-xl p-6 shadow-sm flex flex-col justify-between h-44">
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase">Tax Collections (GST)</span>
            <div className="text-3xl font-black text-gray-900 mt-2">$1,250</div>
          </div>
          <p className="text-[10px] text-gray-450 mt-2">Accrued VAT/GST liabilities matching transaction logs.</p>
        </div>
      </div>
    </div>
  );
}
