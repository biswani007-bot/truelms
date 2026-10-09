"use client";

import React, { useEffect, useState } from "react";
import { 
  PieChart, TrendingUp, AlertCircle, Award, 
  Clock, Book, CheckSquare, ArrowRight 
} from "lucide-react";
import Link from "next/link";

export default function LearningDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    completionRate: 84.5,
    atRiskCount: 3,
    activeClasses: 4,
    pendingReviews: 12
  });

  const [atRiskStudents, setAtRiskStudents] = useState([
    { name: "John Doe", course: "Web Development", compliance: "62%", reason: "Low Attendance" },
    { name: "Jane Smith", course: "Data Science", compliance: "58%", reason: "Missing Assignments" }
  ]);

  const [topPerformers, setTopPerformers] = useState([
    { name: "Alice Johnson", course: "Fullstack Engineering", gpa: "3.95" },
    { name: "Bob Miller", course: "AI Specialist", gpa: "3.90" }
  ]);

  useEffect(() => {
    // Mimic load delay for professional UX skeleton loading
    setTimeout(() => {
      setLoading(false);
    }, 500);
  }, []);

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">Learning Delivery Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Audit learning compliance, student success matrices, and at-risk drop-offs.</p>
      </div>

      {loading ? (
        <div className="py-12 text-center text-gray-400">Loading delivery analytics...</div>
      ) : (
        <>
          {/* KPI Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-gray-500 uppercase">Avg Course Completion</span>
                <div className="text-2xl font-black text-gray-900 mt-1">{stats.completionRate}%</div>
              </div>
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><TrendingUp className="w-5 h-5" /></div>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-gray-500 uppercase">At-Risk Learners</span>
                <div className="text-2xl font-black text-red-600 mt-1">{stats.atRiskCount}</div>
              </div>
              <div className="p-3 bg-red-50 text-red-600 rounded-xl"><AlertCircle className="w-5 h-5" /></div>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-gray-500 uppercase">Today's Classes</span>
                <div className="text-2xl font-black text-gray-900 mt-1">{stats.activeClasses}</div>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><Clock className="w-5 h-5" /></div>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-gray-500 uppercase">Pending Evaluations</span>
                <div className="text-2xl font-black text-gray-900 mt-1">{stats.pendingReviews}</div>
              </div>
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl"><CheckSquare className="w-5 h-5" /></div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* At-risk students */}
            <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2 border-b pb-2">
                <AlertCircle className="text-red-500" />
                At-Risk Learners Audit
              </h3>

              <div className="space-y-4">
                {atRiskStudents.map((s, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-red-50/50 border border-red-100 rounded-xl text-xs font-semibold">
                    <div>
                      <span className="text-gray-900 font-bold block">{s.name}</span>
                      <span className="text-gray-500 text-[10px] block mt-0.5">{s.course}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-red-700 bg-red-100 px-2 py-0.5 rounded text-[10px] font-bold block">{s.reason}</span>
                      <span className="text-gray-400 text-[10px] block mt-0.5">Compliance: {s.compliance}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Performers */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2 mb-4">
                  <Award className="text-indigo-600" />
                  Top Academic Performers
                </h3>

                <div className="space-y-4">
                  {topPerformers.map((s, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs font-semibold border-b pb-2">
                      <div>
                        <span className="text-gray-800 font-bold block">{s.name}</span>
                        <span className="text-gray-400 text-[10px] block mt-0.5">{s.course}</span>
                      </div>
                      <span className="text-emerald-700 bg-emerald-50 border border-emerald-150 px-2 py-0.5 rounded">GPA: {s.gpa}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Link 
                href="/admin/gradebook"
                className="mt-6 py-2 bg-slate-50 border rounded-lg text-xs font-bold text-gray-700 hover:bg-slate-100 flex items-center justify-center gap-1 transition"
              >
                Go to Gradebook Center
                <ArrowRight />
              </Link>
            </div>

          </div>
        </>
      )}
    </div>
  );
}
