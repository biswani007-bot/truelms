"use client";

import React, { useState } from "react";


export default function AdmissionsAnalytics() {
  const [counselors, setCounselors] = useState([
    { name: "John Doe", leads: 150, conversions: 45, rate: "30.0%" },
    { name: "Sarah Smith", leads: 120, conversions: 48, rate: "40.0%" }
  ]);

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Admissions Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Review conversion funnels, lead source yields, and counselor performances.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border rounded-xl p-6 shadow-sm flex flex-col justify-between h-44">
          <div>
            <span className="text-xs font-bold text-gray-500 uppercase">Conversion Rate</span>
            <div className="text-3xl font-black text-indigo-650 mt-2">35.0%</div>
          </div>
          <p className="text-[10px] text-gray-450 mt-2">Aggregate lead conversion from raw inquiry to enrollment.</p>
        </div>

        <div className="bg-white border rounded-xl p-6 shadow-sm flex flex-col justify-between h-44">
          <div>
            <span className="text-xs font-bold text-gray-500 uppercase">Top Source</span>
            <div className="text-3xl font-black text-emerald-600 mt-2">Google Ads</div>
          </div>
          <p className="text-[10px] text-gray-450 mt-2">Highest performing marketing lead channel.</p>
        </div>

        <div className="bg-white border rounded-xl p-6 shadow-sm flex flex-col justify-between h-44">
          <div>
            <span className="text-xs font-bold text-gray-500 uppercase">Enrollment Yield</span>
            <div className="text-3xl font-black text-teal-600 mt-2">92.4%</div>
          </div>
          <p className="text-[10px] text-gray-450 mt-2">Ratio of accepted candidates who complete registration.</p>
        </div>
      </div>

      {/* Counselor Performance Table */}
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden mt-6">
        <div className="p-4 border-b bg-gray-50 font-bold text-sm text-gray-950">Counselor Performance Ledger</div>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-gray-500 text-xs font-semibold uppercase tracking-wider">
              <th className="p-4">Counselor Name</th>
              <th className="p-4">Leads Managed</th>
              <th className="p-4">Conversions</th>
              <th className="p-4">Conversion Rate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {counselors.map((c, idx) => (
              <tr key={idx} className="hover:bg-gray-50/50 transition">
                <td className="p-4 font-semibold text-gray-900">{c.name}</td>
                <td className="p-4 text-gray-650">{c.leads}</td>
                <td className="p-4 font-bold text-gray-900">{c.conversions}</td>
                <td className="p-4 text-indigo-600 font-bold">{c.rate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
