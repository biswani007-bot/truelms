"use client";

import React, { useState } from "react";
import { AlertTriangle } from "lucide-react";

export default function FacultyStudentSuccess() {
  const [atRisk, setAtRisk] = useState([
    { name: "John Doe", attendance: "68%", gpa: "2.1", status: "Critical Risk" },
    { name: "Bob Harris", attendance: "74%", gpa: "2.4", status: "Moderate Risk" }
  ]);

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Faculty & Student Success Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Monitor at-risk learner alert levels, retention scores, and teacher workloads.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border rounded-xl p-6 shadow-sm flex flex-col justify-between h-44">
          <div>
            <span className="text-xs font-bold text-gray-500 uppercase">Retention Index</span>
            <div className="text-3xl font-black text-indigo-650 mt-2">95.2%</div>
          </div>
          <p className="text-[10px] text-gray-450 mt-2">Annualized retention rate of registered students.</p>
        </div>

        <div className="bg-white border rounded-xl p-6 shadow-sm flex flex-col justify-between h-44">
          <div>
            <span className="text-xs font-bold text-gray-500 uppercase">At-Risk Count</span>
            <div className="text-3xl font-black text-red-600 mt-2">2</div>
          </div>
          <p className="text-[10px] text-gray-450 mt-2">Learners identified with attendance ratios &lt; 75%.</p>
        </div>

        <div className="bg-white border rounded-xl p-6 shadow-sm flex flex-col justify-between h-44">
          <div>
            <span className="text-xs font-bold text-gray-500 uppercase">Avg Grading Turnaround</span>
            <div className="text-3xl font-black text-teal-600 mt-2">1.8 Days</div>
          </div>
          <p className="text-[10px] text-gray-450 mt-2">Mean response time for teachers to evaluate home projects.</p>
        </div>
      </div>

      {/* At Risk Table */}
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden mt-6">
        <div className="p-4 border-b bg-gray-50 font-bold text-sm text-gray-950 flex items-center gap-2">
          <AlertTriangle className="text-red-500 animate-pulse" />
          At-Risk Student Registry
        </div>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-gray-500 text-xs font-semibold uppercase tracking-wider">
              <th className="p-4">Student</th>
              <th className="p-4">Attendance Rate</th>
              <th className="p-4">GPA Estimate</th>
              <th className="p-4">Risk Severity</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {atRisk.map((s, idx) => (
              <tr key={idx} className="hover:bg-gray-50/50 transition">
                <td className="p-4 font-semibold text-gray-900">{s.name}</td>
                <td className="p-4 text-red-550 font-bold">{s.attendance}</td>
                <td className="p-4 font-bold text-gray-950">{s.gpa}</td>
                <td className="p-4">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-50 text-red-700 border border-red-200">
                    {s.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
