"use client";

import React, { useEffect, useState } from "react";
import { 
  Search, Filter, Download, Settings, 
  ChevronDown, Plus, Grid, Percent 
} from "lucide-react";
import { useToast } from "@/components/ui/dialogs/ToastProvider";

export default function GradebookCenter() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [density, setDensity] = useState<"compact" | "normal" | "relaxed">("normal");

  const [students, setStudents] = useState([
    { id: "s1", name: "Alice Johnson", batch: "Web dev Alpha", midterm: 88, final: 92, grade: "A", status: "Pass" },
    { id: "s2", name: "Bob Miller", batch: "Web dev Alpha", midterm: 78, final: 85, grade: "B", status: "Pass" },
    { id: "s3", name: "John Doe", batch: "Data Science A", midterm: 55, final: 62, grade: "D", status: "Pass" },
    { id: "s4", name: "Jane Smith", batch: "Data Science A", midterm: 42, final: 38, grade: "F", status: "Fail" }
  ]);

  // Column Visibility
  const [columns, setColumns] = useState({
    name: true,
    batch: true,
    midterm: true,
    final: true,
    grade: true,
    status: true
  });
  const [showColMenu, setShowColMenu] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setLoading(false);
    }, 400);
  }, []);

  const handleEditGrade = (studentId: string, exam: "midterm" | "final", val: number) => {
    setStudents(prev => prev.map(s => {
      if (s.id === studentId) {
        const update = { ...s, [exam]: val };
        const avg = (update.midterm + update.final) / 2;
        update.grade = avg >= 90 ? "A" : avg >= 80 ? "B" : avg >= 70 ? "C" : avg >= 50 ? "D" : "F";
        update.status = avg >= 50 ? "Pass" : "Fail";
        return update;
      }
      return s;
    }));
  };

  const exportCSV = () => {
    const headers = ["Name", "Batch", "Midterm", "Final", "Grade", "Status"];
    const rows = filteredStudents.map(s => [
      s.name,
      s.batch,
      s.midterm,
      s.final,
      s.grade,
      s.status
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "lmsca_gradebook_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.batch.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Sticky Header Section */}
      <div className="sticky top-0 bg-slate-50 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 z-20 border-b border-gray-100">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Gradebook Console</h1>
          <p className="text-sm text-gray-500 mt-1">Audit final grades, enter midterm/viva marks, and analyze pass/fail distributions.</p>
        </div>
        <button 
          onClick={() => toast.success("Results Released", "Grades finalized and released to student portals.")}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-lg shadow-sm transition"
        >
          Release Results
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
        {/* Toolbar & Filters */}
        <div className="p-4 border-b border-gray-100 flex flex-wrap justify-between items-center gap-4 bg-gray-50/50">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Search student or batch..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 border rounded-lg text-sm bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 relative">
            <button onClick={exportCSV} className="p-2 border bg-white hover:bg-gray-50 rounded-lg text-sm font-semibold flex items-center gap-1.5">
              <Download className="w-4 h-4" /> Export
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
              <Settings className="w-4 h-4" />
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
                  <input type="checkbox" checked={columns.midterm} onChange={() => setColumns(p=>({...p, midterm: !p.midterm}))} id="col-mid" />
                  <label htmlFor="col-mid">Midterm</label>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={columns.final} onChange={() => setColumns(p=>({...p, final: !p.final}))} id="col-final" />
                  <label htmlFor="col-final">Final Exam</label>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={columns.grade} onChange={() => setColumns(p=>({...p, grade: !p.grade}))} id="col-grade" />
                  <label htmlFor="col-grade">Grade</label>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={columns.status} onChange={() => setColumns(p=>({...p, status: !p.status}))} id="col-status" />
                  <label htmlFor="col-status">Status</label>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Data Grid */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-gray-500 text-xs font-semibold uppercase tracking-wider">
                {columns.name && <th className="p-4">Student</th>}
                {columns.batch && <th className="p-4">Batch</th>}
                {columns.midterm && <th className="p-4">Midterm (Max 100)</th>}
                {columns.final && <th className="p-4">Final Exam (Max 100)</th>}
                {columns.grade && <th className="p-4">Grade</th>}
                {columns.status && <th className="p-4">Status</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-400">Loading grade records...</td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50/50 transition">
                    {columns.name && (
                      <td className={`p-4 font-semibold text-gray-900 ${density === 'compact' ? 'py-1.5' : density === 'relaxed' ? 'py-5' : 'py-3'}`}>
                        {student.name}
                      </td>
                    )}
                    {columns.batch && <td className="p-4 text-gray-500">{student.batch}</td>}
                    {columns.midterm && (
                      <td className="p-4">
                        <input 
                          type="number" 
                          value={student.midterm}
                          onChange={(e) => handleEditGrade(student.id, "midterm", Number(e.target.value))}
                          className="w-16 border rounded px-2 py-0.5 text-center font-semibold text-gray-800" 
                        />
                      </td>
                    )}
                    {columns.final && (
                      <td className="p-4">
                        <input 
                          type="number" 
                          value={student.final}
                          onChange={(e) => handleEditGrade(student.id, "final", Number(e.target.value))}
                          className="w-16 border rounded px-2 py-0.5 text-center font-semibold text-gray-800" 
                        />
                      </td>
                    )}
                    {columns.grade && (
                      <td className="p-4 font-mono font-bold text-gray-700">
                        {student.grade}
                      </td>
                    )}
                    {columns.status && (
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${student.status === 'Pass' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-650'}`}>
                          {student.status}
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
