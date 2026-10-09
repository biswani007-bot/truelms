"use client";

import React, { useEffect, useState } from "react";
import { 
  Calendar, Bookmark, Folder, Briefcase, Users, 
  Clock, TrendingUp, Plus, ArrowRight, CircleCheck 
} from "lucide-react";
import Link from "next/link";
import { EnterpriseDialog } from "@/components/ui/dialogs/EnterpriseDialog";
import { useToast } from "@/components/ui/dialogs/ToastProvider";

export default function AcademicDashboard() {
  const toast = useToast();
  const [courses, setCourses] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Academic structure states
  const [academicYears, setAcademicYears] = useState(["AY 2025-26", "AY 2024-25"]);
  const [activeYear, setActiveYear] = useState("AY 2025-26");
  const [semesters, setSemesters] = useState(["Spring 2026", "Fall 2025"]);
  const [activeSemester, setActiveSemester] = useState("Spring 2026");

  // Modal States
  const [showYearModal, setShowYearModal] = useState(false);
  const [newYearName, setNewYearName] = useState("");

  const [showSemModal, setShowSemModal] = useState(false);
  const [newSemName, setNewSemName] = useState("");

  const [departments, setDepartments] = useState([
    { name: "Computer Science", courses: 5 },
    { name: "Information Technology", courses: 3 },
    { name: "Business Management", courses: 2 }
  ]);

  useEffect(() => {
    Promise.all([
      fetch("/api/courses?limit=100").then(res => res.json()).catch(() => ({ data: [] })),
      fetch("/api/batches?limit=100").then(res => res.json()).catch(() => ({ data: [] }))
    ]).then(([coursesData, batchesData]) => {
      if (coursesData.data) setCourses(coursesData.data);
      if (batchesData.data) setBatches(batchesData.data);
      setLoading(false);
    });
  }, []);

  const activeCoursesCount = courses.filter(c => c.status !== "archived").length;

  const handleCreateYearConfirm = () => {
    if (!newYearName.trim()) {
      toast.error("Validation Error", "Academic year name is required.");
      return;
    }
    setAcademicYears(prev => [newYearName.trim(), ...prev]);
    setActiveYear(newYearName.trim());
    toast.success("Academic Year Activated", `Set "${newYearName}" as active academic year.`);
    setShowYearModal(false);
    setNewYearName("");
  };

  const handleCreateSemConfirm = () => {
    if (!newSemName.trim()) {
      toast.error("Validation Error", "Semester name is required.");
      return;
    }
    setSemesters(prev => [newSemName.trim(), ...prev]);
    setActiveSemester(newSemName.trim());
    toast.success("Semester Activated", `Set "${newSemName}" as active semester.`);
    setShowSemModal(false);
    setNewSemName("");
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Academic Operations</h1>
          <p className="text-sm text-gray-500 mt-1">Manage semesters, departments, and course curricula across academic years.</p>
        </div>
        <div className="flex bg-gray-100 rounded-lg p-1 text-xs font-semibold">
          <button 
            onClick={() => setShowYearModal(true)}
            className="px-3.5 py-2 bg-white text-gray-700 hover:text-indigo-600 rounded-md shadow-sm transition border border-gray-200"
          >
            Manage Academic Year
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-gray-400">Loading academic workspace...</div>
      ) : (
        <>
          {/* Card stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-gray-500 uppercase">Active Courses</span>
                <div className="text-2xl font-black text-gray-900 mt-1">{activeCoursesCount}</div>
              </div>
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><Bookmark className="w-5 h-5" /></div>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-gray-500 uppercase">Total Batches</span>
                <div className="text-2xl font-black text-gray-900 mt-1">{batches.length}</div>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><Users className="w-5 h-5" /></div>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-gray-500 uppercase">Academic Year</span>
                <div className="text-sm font-bold text-gray-900 mt-1.5">{activeYear}</div>
              </div>
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl"><Calendar className="w-5 h-5" /></div>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-gray-500 uppercase">Active Term</span>
                <div className="text-sm font-bold text-gray-900 mt-1.5">{activeSemester}</div>
              </div>
              <div className="p-3 bg-cyan-50 text-cyan-600 rounded-xl"><Clock className="w-5 h-5" /></div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Academic Structure manager */}
            <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2 border-b pb-2">
                <Folder className="w-4 h-4 text-indigo-600" />
                Departments & Academic Structures
              </h3>

              <div className="space-y-4">
                {departments.map((dept, i) => (
                  <div key={i} className="flex justify-between items-center p-3 bg-slate-50 border rounded-xl text-xs font-semibold">
                    <span className="text-gray-700 font-medium">{dept.name}</span>
                    <span className="text-indigo-650 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded">
                      {dept.courses} Courses Configured
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick configuration */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2 mb-4">
                  <Briefcase className="w-4 h-4 text-indigo-600" />
                  Quick Actions
                </h3>
                
                <div className="space-y-3">
                  <Link 
                    href="/admin/courses" 
                    className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 border text-gray-700 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition"
                  >
                    Create Course
                  </Link>
                  <Link 
                    href="/admin/batches" 
                    className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 border text-gray-700 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition"
                  >
                    Assign Faculty
                  </Link>
                  <button 
                    onClick={() => setShowSemModal(true)}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition"
                  >
                    Configure Semester
                  </button>
                </div>
              </div>

              <div className="border-t pt-4 mt-6">
                <div className="flex justify-between text-xs font-bold text-gray-500">
                  <span>Selected Term:</span>
                  <span className="text-indigo-600">{activeSemester}</span>
                </div>
              </div>
            </div>

          </div>
        </>
      )}

      {/* Academic Year EnterpriseDialog */}
      <EnterpriseDialog
        isOpen={showYearModal}
        onClose={() => setShowYearModal(false)}
        title="Configure Academic Year"
        subtitle="Add a new academic year session (e.g. AY 2026-27)."
        confirmLabel="Activate Year"
        cancelLabel="Cancel"
        onConfirm={handleCreateYearConfirm}
      >
        <div className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Academic Year Title *</label>
            <input
              type="text"
              value={newYearName}
              onChange={(e) => setNewYearName(e.target.value)}
              placeholder="e.g. AY 2026-27"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </EnterpriseDialog>

      {/* Semester EnterpriseDialog */}
      <EnterpriseDialog
        isOpen={showSemModal}
        onClose={() => setShowSemModal(false)}
        title="Configure Academic Semester"
        subtitle="Add a new semester / term to the active academic year."
        confirmLabel="Activate Semester"
        cancelLabel="Cancel"
        onConfirm={handleCreateSemConfirm}
      >
        <div className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Semester Name *</label>
            <input
              type="text"
              value={newSemName}
              onChange={(e) => setNewSemName(e.target.value)}
              placeholder="e.g. Fall 2026"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </EnterpriseDialog>
    </div>
  );
}
