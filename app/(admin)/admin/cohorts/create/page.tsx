"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { WorkspaceHeader } from "@/components/workspace/WorkspaceHeader";
import { DashboardCard } from "@/components/ui/DashboardCard";
import { ArrowLeft, Users } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ui/dialogs/ToastProvider";

export default function CreateCohortPage() {
  const router = useRouter();
  const toast = useToast();
  
  const [saving, setSaving] = useState(false);
  const [courses, setCourses] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    cohortName: "",
    course: "",
    startDate: "",
    endDate: "",
    deliveryMode: "live-online",
    status: "planning",
    maxCapacity: 50,
  });

  useEffect(() => {
    // Fetch courses
    const fetchCourses = async () => {
      try {
        const res = await fetch("/api/public/courses");
        const data = await res.json();
        if (data.success && data.data?.length > 0) {
          setCourses(data.data);
          setFormData(prev => ({ ...prev, course: data.data[0]._id }));
        }
      } catch (err) {
        console.error("Failed to fetch courses", err);
      }
    };
    fetchCourses();
  }, []);

  const handleSave = async () => {
    if (!formData.cohortName || !formData.course || !formData.startDate || !formData.endDate) {
      toast.error("Validation Error", "Please fill all required fields.");
      return;
    }
    
    setSaving(true);
    try {
      const res = await fetch(`/api/cohorts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          startDate: new Date(formData.startDate).toISOString(),
          endDate: new Date(formData.endDate).toISOString(),
          maxCapacity: parseInt(formData.maxCapacity as any, 10)
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Cohort Created", "Cohort has been successfully provisioned.");
        router.push("/admin/cohorts");
        router.refresh();
      } else {
        toast.error("Creation Failed", data.error || data.message || "Failed to create cohort");
      }
    } catch (err) {
      toast.error("Error", "Network or server error occurred");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
      <WorkspaceHeader
        entityName="Create Cohort"
        description="Provision a new learning cohort and allocate schedules."
        moduleIcon={<Users className="w-5 h-5 text-indigo-500" />}
        primaryAction={
          <Link href="/admin/cohorts" className="lms-btn lms-btn-secondary">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Cohorts
          </Link>
        }
      />

      <DashboardCard title="Cohort Details" subtitle="Basic configuration for the new cohort run.">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="lms-label">Cohort Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              className="lms-input"
              placeholder="e.g. Fall 2026 Engineering"
              value={formData.cohortName}
              onChange={(e) => setFormData({ ...formData, cohortName: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="lms-label">Course <span className="text-red-500">*</span></label>
            <select
              className="lms-input"
              value={formData.course}
              onChange={(e) => setFormData({ ...formData, course: e.target.value })}
            >
              <option value="" disabled>Select a course</option>
              {courses.map(c => (
                <option key={c._id} value={c._id}>{c.courseName}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="lms-label">Start Date <span className="text-red-500">*</span></label>
            <input
              type="date"
              className="lms-input"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="lms-label">End Date <span className="text-red-500">*</span></label>
            <input
              type="date"
              className="lms-input"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="lms-label">Delivery Mode</label>
            <select
              className="lms-input"
              value={formData.deliveryMode}
              onChange={(e) => setFormData({ ...formData, deliveryMode: e.target.value })}
            >
              <option value="live-online">Live Online</option>
              <option value="in-person">In Person</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </div>
          
          <div className="space-y-2">
            <label className="lms-label">Max Capacity</label>
            <input
              type="number"
              className="lms-input"
              value={formData.maxCapacity}
              onChange={(e) => setFormData({ ...formData, maxCapacity: parseInt(e.target.value) || 0 })}
            />
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="lms-btn lms-btn-primary"
          >
            {saving ? "Provisioning..." : "Create Cohort"}
          </button>
        </div>
      </DashboardCard>
    </div>
  );
}
