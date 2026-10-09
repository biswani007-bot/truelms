"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/components/ui/dialogs/ToastProvider";

export default function NewEnrollmentPage() {
  const router = useRouter();
  const toast = useToast();
  
  const [students, setStudents] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  
  const [form, setForm] = useState({
    student: "",
    course: "",
    academicSession: "2026-2027",
    status: "pending",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/students?limit=100").then(res => res.json()),
      fetch("/api/courses?limit=100").then(res => res.json())
    ]).then(([studentData, courseData]) => {
      setStudents(studentData.data || []);
      
      const parsedCourses = Array.isArray(courseData)
        ? courseData
        : Array.isArray(courseData?.data)
        ? courseData.data
        : Array.isArray(courseData?.data?.data)
        ? courseData.data.data
        : [];

      setCourses(parsedCourses);
      setLoadingData(false);
    }).catch(() => {
      toast.error("Error", "Failed to load form data");
      setLoadingData(false);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.student || !form.course) {
      toast.error("Validation Error", "Please select a student and course.");
      return;
    }
    setSubmitting(true);
    
    try {
      const res = await fetch("/api/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Enrollment Created", "New enrollment generated successfully.");
        router.push("/admin/enrollments");
        router.refresh();
      } else {
        toast.error("Creation Failed", data.error || data.message || "Unable to create enrollment.");
      }
    } catch (err) {
      toast.error("Network Error", "Failed to create enrollment.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingData) return <div className="p-12 text-center text-slate-500 font-medium">Loading form...</div>;

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto">
      <div className="flex justify-between items-center bg-white border border-gray-200 p-6 rounded-2xl shadow-xs">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">New Enrollment</h1>
          <p className="text-sm text-gray-500 mt-1">Create a new enrollment record for a student.</p>
        </div>
        <Link href="/admin/enrollments" className="text-sm font-semibold text-indigo-600 hover:underline">
          Back
        </Link>
      </div>

      <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-xs">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Student</label>
            <select
              value={form.student}
              onChange={(e) => setForm({ ...form, student: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:border-indigo-500"
            >
              <option value="">Select a student...</option>
              {students.map(s => (
                <option key={s._id} value={s._id}>{s.firstName} {s.lastName} ({s.studentId})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Course</label>
            <select
              value={form.course}
              onChange={(e) => setForm({ ...form, course: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:border-indigo-500"
            >
              <option value="">Select a course...</option>
              {courses.map(c => (
                <option key={c._id} value={c._id}>{c.courseName} ({c.courseCode})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Academic Session</label>
            <input
              type="text"
              value={form.academicSession}
              onChange={(e) => setForm({ ...form, academicSession: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:border-indigo-500"
            >
              <option value="pending">Pending</option>
              <option value="waiting-payment">Waiting Payment</option>
              <option value="confirmed">Confirmed</option>
              <option value="batch-assigned">Batch Assigned</option>
            </select>
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-xl transition shadow-xs disabled:opacity-50"
            >
              {submitting ? "Creating..." : "Create Enrollment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
