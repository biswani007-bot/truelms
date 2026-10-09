"use client";

import React, { useState } from "react";
// Removed legacy Fi icons import

export default function AcademicLearningAnalytics() {
  const [courses, setCourses] = useState([
    { name: "Introductory Software Engineering", completed: "85%", avgTime: "12 hours", dropoff: "Module 2: Advanced standardizations" },
    { name: "React Components Deep Dive", completed: "92%", avgTime: "18 hours", dropoff: "Module 4: Global states configuration" }
  ]);

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Academic & Learning Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Audit learning durations, lesson completion rates, and curriculum progress.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border rounded-xl p-6 shadow-sm flex flex-col justify-between h-44">
          <div>
            <span className="text-xs font-bold text-gray-500 uppercase">Avg Learning Time</span>
            <div className="text-3xl font-black text-indigo-650 mt-2">15 hours</div>
          </div>
          <p className="text-[10px] text-gray-450 mt-2">Average time spent per student across digital content materials.</p>
        </div>

        <div className="bg-white border rounded-xl p-6 shadow-sm flex flex-col justify-between h-44">
          <div>
            <span className="text-xs font-bold text-gray-500 uppercase">Curriculum Completion</span>
            <div className="text-3xl font-black text-emerald-600 mt-2">88.5%</div>
          </div>
          <p className="text-[10px] text-gray-450 mt-2">Ratio of modules finalized by enrolled batch groups.</p>
        </div>

        <div className="bg-white border rounded-xl p-6 shadow-sm flex flex-col justify-between h-44">
          <div>
            <span className="text-xs font-bold text-gray-500 uppercase">Average Quiz Performance</span>
            <div className="text-3xl font-black text-teal-600 mt-2">78.2%</div>
          </div>
          <p className="text-[10px] text-gray-450 mt-2">Mean score attained across automatic evaluation quizzes.</p>
        </div>
      </div>

      {/* Roster Table */}
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden mt-6">
        <div className="p-4 border-b bg-gray-50 font-bold text-sm text-gray-950">Course Progress Roster</div>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-gray-500 text-xs font-semibold uppercase tracking-wider">
              <th className="p-4">Course Name</th>
              <th className="p-4">Completion %</th>
              <th className="p-4">Avg Learning Duration</th>
              <th className="p-4">Primary Drop-off Area</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {courses.map((c, idx) => (
              <tr key={idx} className="hover:bg-gray-50/50 transition">
                <td className="p-4 font-semibold text-gray-900">{c.name}</td>
                <td className="p-4 font-bold text-emerald-605">{c.completed}</td>
                <td className="p-4 text-gray-650">{c.avgTime}</td>
                <td className="p-4 text-red-500 font-medium text-xs">{c.dropoff}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
