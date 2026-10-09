"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { WorkspaceHeader } from "@/components/workspace/WorkspaceHeader";
import { DashboardCard } from "@/components/ui/DashboardCard";
import { ArrowLeft, Edit } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ui/dialogs/ToastProvider";

export default function EditCohortPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const toast = useToast();
  
  const [saving, setSaving] = useState(false);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cohortId, setCohortId] = useState("");

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
    // Unroll params promise (Next 15)
    params.then((p) => {
      setCohortId(p.id);
      fetchData(p.id);
    });
  }, [params]);

  const fetchData = async (id: string) => {
    try {
      const [coursesRes, cohortRes] = await Promise.all([
        fetch("/api/public/courses"),
        fetch(`/api/cohorts/${id}`)
      ]);
      const coursesData = await coursesRes.json();
      const cohortData = await cohortRes.json();

      if (coursesData.success) {
        setCourses(coursesData.data);
      }
      
      if (cohortData.success) {
        const c = cohortData.data;
        setFormData({
          cohortName: c.cohortName || "",
          course: c.course?._id || c.course || "",
          startDate: c.startDate ? new Date(c.startDate).toISOString().split('T')[0] : "",
          endDate: c.endDate ? new Date(c.endDate).toISOString().split('T')[0] : "",
          deliveryMode: c.deliveryMode || "live-online",
          status: c.status || "planning",
          maxCapacity: c.maxCapacity || 50,
        });
      }
    } catch (err) {
      console.error("Failed to fetch data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.cohortName || !formData.course || !formData.startDate || !formData.endDate) {
      toast.error("Validation Error", "Please fill all required fields.");
      return;
    }
    
    setSaving(true);
    try {
      const res = await fetch(`/api/cohorts/${cohortId}`, {
        method: "PUT",
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
        toast.success("Cohort Updated", "Cohort has been successfully updated.");
        router.push(`/admin/cohorts/${cohortId}`);
        router.refresh();
      } else {
        toast.error("Update Failed", data.error || data.message || "Failed to update cohort");
      }
    } catch (err) {
      toast.error("Error", "Network or server error occurred");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-10 text-center">Loading...</div>;

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
      <WorkspaceHeader
        entityName="Edit Cohort"
        description="Update cohort details and capacity."
        moduleIcon={<Edit className="w-5 h-5 text-indigo-500" />}
        primaryAction={
          <Link href={`/admin/cohorts/${cohortId}`} className="lms-btn lms-btn-secondary">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Cohort
          </Link>
        }
      />

      <DashboardCard title="Cohort Details" subtitle="Configuration for the cohort run.">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="lms-label">Cohort Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              className="lms-input"
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
            <label className="lms-label">Status</label>
            <select
              className="lms-input"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="planning">Planning</option>
              <option value="enrollment-open">Enrollment Open</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
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
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </DashboardCard>
    </div>
  );
}
