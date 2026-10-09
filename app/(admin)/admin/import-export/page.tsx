import React from "react";

export const metadata = {
  title: "Import & Export | TrueLern",
  description: "Bulk data processing and template downloads",
};

export default function ImportExportPage() {
  return (
    <div className="flex flex-col gap-10 max-w-5xl">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">Import & Export Engine</h1>
        <p className="text-sm text-gray-500 mt-1">Bulk provision records or export analytical data formats.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Import Section */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <span className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl">📥</span>
            <h2 className="text-lg font-bold text-gray-900">Bulk Import</h2>
          </div>
          
          <div className="space-y-4">
            <div className="border border-gray-200 rounded-xl p-4 hover:border-indigo-300 hover:shadow-sm transition cursor-pointer group">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition">Import Students (CSV)</div>
                  <div className="text-xs text-gray-500 mt-0.5">Provision multiple learner accounts and enrollments</div>
                </div>
                <span className="text-indigo-600 text-sm font-bold">Upload</span>
              </div>
            </div>
            <div className="border border-gray-200 rounded-xl p-4 hover:border-indigo-300 hover:shadow-sm transition cursor-pointer group">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition">Import Teachers (CSV)</div>
                  <div className="text-xs text-gray-500 mt-0.5">Onboard faculty members and map subjects</div>
                </div>
                <span className="text-indigo-600 text-sm font-bold">Upload</span>
              </div>
            </div>
            <div className="border border-gray-200 rounded-xl p-4 hover:border-indigo-300 hover:shadow-sm transition cursor-pointer group">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition">Import Leads (CSV)</div>
                  <div className="text-xs text-gray-500 mt-0.5">Bulk CRM ingestion for admissions pipelines</div>
                </div>
                <span className="text-indigo-600 text-sm font-bold">Upload</span>
              </div>
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t border-gray-100">
            <button className="text-xs font-bold text-gray-500 hover:text-indigo-600 transition">
              Download CSV Templates ↓
            </button>
          </div>
        </div>

        {/* Export Section */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <span className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl">📤</span>
            <h2 className="text-lg font-bold text-gray-900">Data Export</h2>
          </div>
          
          <div className="space-y-4">
            <div className="border border-gray-200 rounded-xl p-4 hover:border-emerald-300 hover:shadow-sm transition cursor-pointer group">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-sm font-bold text-gray-900 group-hover:text-emerald-600 transition">Export Finance Ledger</div>
                  <div className="text-xs text-gray-500 mt-0.5">Invoices, payments, and refunds (Excel/CSV)</div>
                </div>
                <span className="text-emerald-600 text-sm font-bold">Download</span>
              </div>
            </div>
            <div className="border border-gray-200 rounded-xl p-4 hover:border-emerald-300 hover:shadow-sm transition cursor-pointer group">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-sm font-bold text-gray-900 group-hover:text-emerald-600 transition">Export Attendance Logs</div>
                  <div className="text-xs text-gray-500 mt-0.5">Compliance records for academic sessions</div>
                </div>
                <span className="text-emerald-600 text-sm font-bold">Download</span>
              </div>
            </div>
            <div className="border border-gray-200 rounded-xl p-4 hover:border-emerald-300 hover:shadow-sm transition cursor-pointer group">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-sm font-bold text-gray-900 group-hover:text-emerald-600 transition">Export System Logs</div>
                  <div className="text-xs text-gray-500 mt-0.5">Gateway access audits and event tracking</div>
                </div>
                <span className="text-emerald-600 text-sm font-bold">Download</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
