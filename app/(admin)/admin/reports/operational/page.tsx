"use client";

import React, { useState, useEffect } from "react";

export default function OperationalReports() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/reports/system");
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleExportCSV = () => {
    if (!data) return;
    const csvContent = `Metric,Value\nUsers,${data.metrics.users}\nStudents,${data.metrics.students}\nCourses,${data.metrics.courses}\nEnrollments,${data.metrics.enrollments}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `operational_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">System Operational Reports</h1>
          <p className="text-sm text-gray-500 mt-1">High-level metrics and data exports for platform administrators.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={fetchReports}
            className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-bold rounded-xl transition-colors shadow-sm"
          >
            Refresh Data
          </button>
          <button 
            onClick={handleExportCSV}
            disabled={!data}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-colors shadow-sm"
          >
            Export CSV
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-gray-400 bg-white border border-gray-200 rounded-2xl shadow-sm">
          <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
          Generating reports...
        </div>
      ) : !data ? (
        <div className="p-12 text-center text-red-500 bg-white border border-gray-200 rounded-2xl shadow-sm">
          Failed to generate reports.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 text-center">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Total Users</h3>
            <div className="text-4xl font-black text-gray-900 tracking-tight">{data.metrics.users}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 text-center">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Total Students</h3>
            <div className="text-4xl font-black text-gray-900 tracking-tight">{data.metrics.students}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 text-center">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Active Courses</h3>
            <div className="text-4xl font-black text-gray-900 tracking-tight">{data.metrics.courses}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 text-center">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Enrollments</h3>
            <div className="text-4xl font-black text-gray-900 tracking-tight">{data.metrics.enrollments}</div>
          </div>
        </div>
      )}
    </div>
  );
}
