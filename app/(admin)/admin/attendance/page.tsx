"use client";

import React, { useEffect, useState } from "react";
import { Search, Download, Settings, Check, X } from "lucide-react";
import { useToast } from "@/components/ui/dialogs/ToastProvider";

export default function AttendanceRegister() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [density, setDensity] = useState<"compact" | "normal" | "relaxed">("normal");

  const [attendance, setAttendance] = useState([
    { id: "s1", name: "Alice Johnson", batch: "Web dev Alpha", present: 18, absent: 2, late: 1, percentage: 90 },
    { id: "s2", name: "Bob Miller", batch: "Web dev Alpha", present: 16, absent: 4, late: 1, percentage: 80 },
    { id: "s3", name: "John Doe", batch: "Data Science A", present: 12, absent: 8, late: 1, percentage: 60 },
    { id: "s4", name: "Jane Smith", batch: "Data Science A", present: 10, absent: 11, late: 0, percentage: 48 }
  ]);

  // Column Visibility
  const [columns, setColumns] = useState({
    name: true,
    batch: true,
    present: true,
    absent: true,
    late: true,
    percentage: true
  });
  const [showColMenu, setShowColMenu] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setLoading(false);
    }, 450);
  }, []);

  const handleBulkMark = (status: "present" | "absent") => {
    setAttendance(prev => prev.map(a => {
      const increment = status === "present" ? { present: a.present + 1 } : { absent: a.absent + 1 };
      const updated = { ...a, ...increment };
      const total = updated.present + updated.absent;
      updated.percentage = total > 0 ? Math.round((updated.present / total) * 100) : 100;
      return updated;
    }));
    toast.success("Register Updated", `Bulk marked all students as ${status}.`);
  };

  const exportCSV = () => {
    const headers = ["Name", "Batch", "Present", "Absent", "Late", "Percentage"];
    const rows = filteredRecords.map(a => [
      a.name,
      a.batch,
      a.present,
      a.absent,
      a.late,
      a.percentage
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "lmsca_attendance_register.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredRecords = attendance.filter(a => {
    const matchSearch = a.name.toLowerCase().includes(search.toLowerCase()) || a.batch.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "ALL" || 
      (statusFilter === "compliant" && a.percentage >= 75) || 
      (statusFilter === "non-compliant" && a.percentage < 75);
    return matchSearch && matchStatus;
  });

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="sticky top-0 bg-slate-50 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 z-20 border-b border-slate-200/80">
        <div>
          <h1 className="lms-page-title">Attendance Register</h1>
          <p className="lms-caption mt-1">Monitor academic compliance rates, low attendance alerts, and excused absences.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => handleBulkMark("present")}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg shadow-sm transition"
          >
            Bulk Mark Present
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
        {/* Toolbar & Filters */}
        <div className="p-4 border-b border-gray-100 flex flex-wrap justify-between items-center gap-4 bg-gray-50/50">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search register..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 border rounded-lg text-sm bg-white focus:outline-none"
              />
            </div>
            
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 border rounded-lg text-sm bg-white"
            >
              <option value="ALL">All Statuses</option>
              <option value="compliant">Compliant (&gt;=75%)</option>
              <option value="non-compliant">Non-compliant (&lt;75%)</option>
            </select>
          </div>

          <div className="flex items-center gap-3 relative">
            <button onClick={exportCSV} className="p-2 border bg-white hover:bg-gray-50 rounded-lg text-sm font-semibold flex items-center gap-1.5">
              <Download className="size-4" /> Export
            </button>

            <select 
              value={density} 
              onChange={(e) => setDensity(e.target.value as any)}
              className="px-3 py-1.5 border rounded-lg text-sm bg-white font-semibold text-gray-600"
            >
              <option value="compact">Compact</option>
              <option value="normal">Normal</option>
              <option value="relaxed">Relaxed</option>
            </select>

            <button 
              onClick={() => setShowColMenu(!showColMenu)}
              className="p-2 border bg-white rounded-lg text-sm"
            >
              <Settings className="size-4" />
            </button>
            {showColMenu && (
              <div className="absolute right-0 top-11 bg-white border shadow-lg rounded-lg p-3 z-35 space-y-2 text-xs font-semibold text-gray-700 w-44">
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={columns.name} onChange={() => setColumns(p=>({...p, name: !p.name}))} id="col-name" />
                  <label htmlFor="col-name">Name</label>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={columns.batch} onChange={() => setColumns(p=>({...p, batch: !p.batch}))} id="col-batch" />
                  <label htmlFor="col-batch">Batch</label>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={columns.present} onChange={() => setColumns(p=>({...p, present: !p.present}))} id="col-present" />
                  <label htmlFor="col-present">Present</label>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={columns.absent} onChange={() => setColumns(p=>({...p, absent: !p.absent}))} id="col-absent" />
                  <label htmlFor="col-absent">Absent</label>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={columns.late} onChange={() => setColumns(p=>({...p, late: !p.late}))} id="col-late" />
                  <label htmlFor="col-late">Late</label>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={columns.percentage} onChange={() => setColumns(p=>({...p, percentage: !p.percentage}))} id="col-percentage" />
                  <label htmlFor="col-percentage">Compliance</label>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Register Table Grid */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-gray-500 text-xs font-semibold uppercase tracking-wider">
                {columns.name && <th className="p-4">Student</th>}
                {columns.batch && <th className="p-4">Batch</th>}
                {columns.present && <th className="p-4">Present</th>}
                {columns.absent && <th className="p-4">Absent</th>}
                {columns.late && <th className="p-4">Late</th>}
                {columns.percentage && <th className="p-4">Compliance</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-400">Loading register...</td>
                </tr>
              ) : (
                filteredRecords.map((summary) => (
                  <tr key={summary.id} className="hover:bg-gray-50/50 transition">
                    {columns.name && (
                      <td className={`p-4 font-semibold text-gray-900 ${density === 'compact' ? 'py-1.5' : density === 'relaxed' ? 'py-5' : 'py-3'}`}>
                        {summary.name}
                      </td>
                    )}
                    {columns.batch && <td className="p-4 text-gray-500">{summary.batch}</td>}
                    {columns.present && <td className="p-4 text-emerald-600 font-bold">{summary.present}</td>}
                    {columns.absent && <td className="p-4 text-red-500 font-bold">{summary.absent}</td>}
                    {columns.late && <td className="p-4 text-amber-600 font-bold">{summary.late}</td>}
                    {columns.percentage && (
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${summary.percentage >= 75 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-750'}`}>
                          {summary.percentage}%
                        </span>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
