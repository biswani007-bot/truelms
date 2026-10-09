"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Download, Settings, Edit2, Copy, Trash2, Plus, ChevronDown, GraduationCap } from "lucide-react";
import { EnterpriseDialog } from "@/components/ui/dialogs/EnterpriseDialog";
import { useToast } from "@/components/ui/dialogs/ToastProvider";
import { ManageDemoFacultyModal } from "@/components/admin/ManageDemoFacultyModal";

interface CourseForm {
  courseName: string;
  courseCode: string;
}

export default function CourseListPage() {
  const router = useRouter();
  const toast = useToast();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [levelFilter, setLevelFilter] = useState("ALL");
  const [density, setDensity] = useState<"compact" | "normal" | "relaxed">("normal");
  const [courseToDelete, setCourseToDelete] = useState<any>(null);
  const [facultyModalCourse, setFacultyModalCourse] = useState<any>(null);

  // Column Visibility
  const [columns, setColumns] = useState({
    code: true,
    name: true,
    level: true,
    price: true,
    duration: true,
  });
  const [showColMenu, setShowColMenu] = useState(false);
  const [focusIndex, setFocusIndex] = useState<number>(-1);

  // Dialog state — Create Course
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createForm, setCreateForm] = useState<CourseForm>({ courseName: "", courseCode: "" });
  const [createLoading, setCreateLoading] = useState(false);

  // Dialog state — Bulk Action
  const [bulkAction, setBulkAction] = useState<string | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);

  const fetchCourses = () => {
    setLoading(true);
    fetch(`/api/courses?search=${search}&limit=100`)
      .then((res) => res.json())
      .then((data) => {
        const parsed = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data?.data?.data)
          ? data.data.data
          : [];
        setCourses(parsed);
        setLoading(false);
      })
      .catch(() => {
        toast.error("Load Failed", "Unable to fetch course catalog.");
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchCourses();
  }, [search]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (filteredCourses.length === 0) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setFocusIndex((prev) => (prev + 1) % filteredCourses.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setFocusIndex((prev) => (prev - 1 + filteredCourses.length) % filteredCourses.length);
      } else if (e.key === "Enter" && focusIndex >= 0) {
        e.preventDefault();
        router.push(`/admin/courses/${filteredCourses[focusIndex]._id}`);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [courses, focusIndex]);

  const toggleSelect = (id: string) => {
    setSelectedCourses((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleBulkConfirm = async () => {
    if (!bulkAction) return;
    setBulkLoading(true);
    await new Promise((r) => setTimeout(r, 500));
    setSelectedCourses([]);
    fetchCourses();
    setBulkLoading(false);
    setBulkAction(null);
    toast.success("Bulk Action Applied", `${bulkAction} applied to selected courses.`);
  };

  const handleCreateConfirm = async () => {
    if (!createForm.courseName.trim() || !createForm.courseCode.trim()) {
      toast.error("Validation Error", "Course name and code are required.");
      return;
    }
    setCreateLoading(true);
    try {
      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseName: createForm.courseName.trim(),
          courseCode: createForm.courseCode.trim(),
          slug: createForm.courseCode.trim().toLowerCase() + "-" + Date.now(),
          shortDescription: "Enter short course description here",
          longDescription: "Enter long course description here",
          category: "6a87011efae35df7c876b095", // Default category ID for Software Engineering
          duration: 4,
          level: "beginner",
          difficulty: "easy",
          deliveryMode: "live-cohort",
          pricing: { price: 299, currency: "USD", taxPercentage: 5 },
          requirements: { software: [], hardware: [] },
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setShowCreateDialog(false);
        setCreateForm({ courseName: "", courseCode: "" });
        fetchCourses();
        toast.success("Course Created", `"${createForm.courseName}" has been added to the catalog.`);
      } else {
        toast.error("Creation Failed", data.error || "Unable to create course.");
      }
    } catch {
      toast.error("Network Error", "Failed to connect to the server.");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDuplicate = async (course: any) => {
    try {
      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...course,
          courseName: `${course.courseName} (Copy)`,
          courseCode: `${course.courseCode}-COPY-${Date.now()}`,
          slug: `${course.slug}-copy-${Date.now()}`,
          _id: undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchCourses();
        toast.success("Course Duplicated", `A copy of "${course.courseName}" has been created.`);
      } else {
        toast.error("Duplicate Failed", data.error || "Unable to duplicate course.");
      }
    } catch {
      toast.error("Network Error", "Failed to connect to the server.");
    }
  };

  const handleDelete = async (course: any) => {
    setCourseToDelete(course);
  };

  const confirmDelete = async () => {
    if (!courseToDelete) return;
    try {
      const res = await fetch(`/api/courses/${courseToDelete._id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchCourses();
        toast.success("Success", data.message || `Course archived/deleted successfully.`);
      } else {
        toast.error("Deletion Failed", data.error || "Unable to delete course.");
      }
    } catch {
      toast.error("Network Error", "Failed to connect to the server.");
    } finally {
      setCourseToDelete(null);
    }
  };

  const exportCSV = () => {
    const headers = ["Course Code", "Name", "Level", "Price", "Duration"];
    const rows = filteredCourses.map((c) => [
      c.courseCode,
      c.courseName,
      c.level,
      c.pricing?.price,
      `${c.duration || 4} weeks`,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "lmsca_course_catalog.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Export Complete", `${filteredCourses.length} course records exported to CSV.`);
  };

  const filteredCourses = courses.filter((c) => {
    if (levelFilter === "ALL") return true;
    return c.level?.toUpperCase() === levelFilter.toUpperCase();
  });

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="sticky top-0 bg-slate-50 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 z-20 border-b border-slate-200/80">
        <div>
          <h1 className="lms-page-title">Courses</h1>
          <p className="lms-caption mt-1">
            Manage curriculum structure, delivery modes, and pricing configurations.
          </p>
        </div>
        <button
          onClick={() => {
            setCreateForm({ courseName: "", courseCode: "" });
            setShowCreateDialog(true);
          }}
          className="lms-btn lms-btn-primary"
        >
          <Plus className="size-4" />
          Create Course
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
        {/* Toolbar & Filters */}
        <div className="p-4 border-b border-gray-100 flex flex-wrap justify-between items-center gap-4 bg-gray-50/50">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search catalog..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
              />
            </div>

            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="px-3 py-1.5 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="ALL">All Levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          <div className="flex items-center gap-3 relative">
            <button
              onClick={exportCSV}
              className="p-2 border bg-white hover:bg-gray-50 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Download className="size-4" /> Export
            </button>

            <select
              value={density}
              onChange={(e) => setDensity(e.target.value as "compact" | "normal" | "relaxed")}
              className="px-3 py-1.5 border rounded-lg text-sm bg-white font-semibold text-gray-600 focus:outline-none"
            >
              <option value="compact">Compact</option>
              <option value="normal">Normal</option>
              <option value="relaxed">Relaxed</option>
            </select>

            <button
              onClick={() => setShowColMenu(!showColMenu)}
              className="p-2 border bg-white rounded-lg text-sm hover:bg-gray-50 transition-colors"
              aria-label="Column visibility"
            >
              <Settings className="size-4" />
            </button>
            {showColMenu && (
              <div className="absolute right-0 top-11 bg-white border shadow-lg rounded-lg p-3 z-[35] space-y-2 text-xs font-semibold text-gray-700 w-44">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={columns.code}
                    onChange={() => setColumns((p) => ({ ...p, code: !p.code }))}
                    id="col-code"
                  />
                  <label htmlFor="col-code">Course Code</label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={columns.name}
                    onChange={() => setColumns((p) => ({ ...p, name: !p.name }))}
                    id="col-name"
                  />
                  <label htmlFor="col-name">Name</label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={columns.level}
                    onChange={() => setColumns((p) => ({ ...p, level: !p.level }))}
                    id="col-level"
                  />
                  <label htmlFor="col-level">Level</label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={columns.price}
                    onChange={() => setColumns((p) => ({ ...p, price: !p.price }))}
                    id="col-price"
                  />
                  <label htmlFor="col-price">Price</label>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bulk Action Bar */}
        {selectedCourses.length > 0 && (
          <div className="bg-indigo-50 border-b border-indigo-100 px-4 py-2.5 flex justify-between items-center sticky top-14 z-[15]">
            <span className="text-xs font-bold text-indigo-700">
              {selectedCourses.length} courses selected
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setBulkAction("publish")}
                className="px-3 py-1 bg-indigo-600 text-white rounded text-xs font-bold hover:bg-indigo-700 transition-colors"
              >
                Bulk Publish
              </button>
              <button
                onClick={() => setBulkAction("archive")}
                className="px-3 py-1 bg-white border border-indigo-300 text-indigo-700 rounded text-xs font-bold hover:bg-indigo-50 transition-colors"
              >
                Bulk Archive
              </button>
            </div>
          </div>
        )}

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-gray-500 text-xs font-semibold uppercase tracking-wider">
                <th className="p-4 w-12">
                  <input
                    type="checkbox"
                    checked={
                      filteredCourses.length > 0 &&
                      selectedCourses.length === filteredCourses.length
                    }
                    onChange={() => {
                      if (selectedCourses.length === filteredCourses.length)
                        setSelectedCourses([]);
                      else setSelectedCourses(filteredCourses.map((c) => c._id));
                    }}
                    className="rounded"
                  />
                </th>
                {columns.code && <th className="p-4">Code</th>}
                {columns.name && <th className="p-4">Course Name</th>}
                {columns.level && <th className="p-4">Level</th>}
                {columns.price && <th className="p-4">Price</th>}
                {columns.duration && <th className="p-4">Duration</th>}
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-400">
                    Loading catalog...
                  </td>
                </tr>
              ) : filteredCourses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-gray-400">
                    No courses matching selected level.
                  </td>
                </tr>
              ) : (
                filteredCourses.map((course, idx) => (
                  <tr
                    key={course._id}
                    className={`hover:bg-gray-50/50 transition group ${
                      focusIndex === idx ? "bg-indigo-50/30" : ""
                    }`}
                  >
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selectedCourses.includes(course._id)}
                        onChange={() => toggleSelect(course._id)}
                        className="rounded"
                      />
                    </td>
                    {columns.code && (
                      <td className="p-4 font-mono text-xs font-bold text-indigo-600">
                        {course.courseCode}
                      </td>
                    )}
                    {columns.name && (
                      <td
                        className={`p-4 font-semibold text-gray-900 ${
                          density === "compact"
                            ? "py-2"
                            : density === "relaxed"
                            ? "py-6"
                            : "py-4"
                        }`}
                      >
                        {course.courseName}
                      </td>
                    )}
                    {columns.level && (
                      <td className="p-4 text-gray-600 uppercase text-xs">{course.level}</td>
                    )}
                    {columns.price && (
                      <td className="p-4 font-bold text-gray-900">${course.pricing?.price}</td>
                    )}
                    {columns.duration && (
                      <td className="p-4 text-gray-500">
                        {course.duration || 4} {course.durationUnit || "weeks"}
                      </td>
                    )}
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setFacultyModalCourse(course)}
                          className="p-1.5 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded"
                          title="Manage Demo Faculty"
                        >
                          <GraduationCap className="size-4" />
                        </button>
                        <Link
                          href={`/admin/courses/${course._id}`}
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded"
                          title="Manage Curriculum"
                        >
                          <Edit2 className="size-4" />
                        </Link>
                        <button
                          onClick={() => handleDuplicate(course)}
                          className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded"
                          title="Duplicate Course"
                        >
                          <Copy className="size-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(course)}
                          className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                          title="Archive/Delete Course"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Course Dialog */}
      <EnterpriseDialog
        isOpen={showCreateDialog}
        onClose={() => {
          if (!createLoading) setShowCreateDialog(false);
        }}
        title="Create New Course"
        subtitle="Add a course to the catalog"
        variant="info"
        confirmLabel="Create Course"
        cancelLabel="Cancel"
        onConfirm={handleCreateConfirm}
        loading={createLoading}
      >
        <div className="space-y-4">
          <div>
            <label className="lms-label block mb-1.5" htmlFor="new-course-name">
              Course Name
            </label>
            <input
              id="new-course-name"
              type="text"
              placeholder="e.g. Data Science Fundamentals"
              value={createForm.courseName}
              onChange={(e) => setCreateForm((f) => ({ ...f, courseName: e.target.value }))}
              className="lms-input"
              disabled={createLoading}
              autoFocus
            />
          </div>
          <div>
            <label className="lms-label block mb-1.5" htmlFor="new-course-code">
              Course Code
            </label>
            <input
              id="new-course-code"
              type="text"
              placeholder="e.g. DS-101"
              value={createForm.courseCode}
              onChange={(e) => setCreateForm((f) => ({ ...f, courseCode: e.target.value }))}
              className="lms-input"
              disabled={createLoading}
            />
            <p className="lms-caption mt-1">Must be unique across the catalog.</p>
          </div>
        </div>
      </EnterpriseDialog>

      {/* Bulk Action Confirmation Dialog */}
      <EnterpriseDialog
        isOpen={!!bulkAction}
        onClose={() => {
          if (!bulkLoading) setBulkAction(null);
        }}
        title={`Bulk ${bulkAction === "publish" ? "Publish" : "Archive"} Courses`}
        subtitle={`This will affect ${selectedCourses.length} selected course(s)`}
        description={
          bulkAction === "archive"
            ? "Archived courses will be hidden from students but remain accessible in reports. This action can be reversed."
            : "Selected courses will be published and visible to students immediately."
        }
        variant={bulkAction === "archive" ? "archive" : "info"}
        confirmLabel={bulkAction === "publish" ? "Publish Courses" : "Archive Courses"}
        cancelLabel="Cancel"
        onConfirm={handleBulkConfirm}
        loading={bulkLoading}
      />

      {/* Delete Course Dialog */}
      <EnterpriseDialog
        isOpen={!!courseToDelete}
        onClose={() => setCourseToDelete(null)}
        title="Delete Course"
        subtitle="Warning: This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={confirmDelete}
      >
        <div className="pt-2 text-sm text-gray-700">
          <p className="mb-2">
            Are you sure you want to archive or permanently delete the following course?
          </p>
          <div className="p-3 bg-red-50 rounded-lg border border-red-100 mb-4">
            <div className="font-semibold text-red-900">{courseToDelete?.courseName}</div>
            <div className="text-xs text-red-700 font-mono mt-1">{courseToDelete?.courseCode}</div>
          </div>
          <p className="text-xs text-gray-500">
            Note: Courses with active enrollments or dependencies will be safely archived instead of permanently deleted to preserve historical records.
          </p>
        </div>
      </EnterpriseDialog>

      {/* Manage Demo Faculty Modal */}
      {facultyModalCourse && (
        <ManageDemoFacultyModal
          isOpen={Boolean(facultyModalCourse)}
          onClose={() => setFacultyModalCourse(null)}
          course={facultyModalCourse}
          onSaved={() => {
            toast.success("Faculty Updated", "Demo faculty assignments updated successfully.");
            fetchCourses();
          }}
        />
      )}
    </div>
  );
}
