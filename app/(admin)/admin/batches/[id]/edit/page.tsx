"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { WorkspaceHeader } from "@/components/workspace/WorkspaceHeader";
import { DashboardCard } from "@/components/ui/DashboardCard";
import { ArrowLeft, Edit } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ui/dialogs/ToastProvider";

export default function EditBatchPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const toast = useToast();
  
  const [saving, setSaving] = useState(false);
  const [cohorts, setCohorts] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [batchId, setBatchId] = useState("");

  const [formData, setFormData] = useState({
    batchName: "",
    cohort: "",
    course: "",
    primaryTeacher: "",
    assistantTeacher: "",
    mentor: "",
    defaultCapacity: 50,
    batchStart: "",
    batchEnd: "",
    status: "open",
  });

  useEffect(() => {
    params.then((p) => {
      setBatchId(p.id);
      fetchData(p.id);
    });
  }, [params]);

  const fetchData = async (id: string) => {
    try {
      const [cRes, coRes, bRes, tRes] = await Promise.all([
        fetch("/api/public/courses"),
        fetch("/api/cohorts?limit=100"),
        fetch(`/api/batches/${id}`),
        fetch("/api/teachers?limit=100")
      ]);
      const cData = await cRes.json();
      const coData = await coRes.json();
      const bData = await bRes.json();
      const tData = await tRes.json();
      
      if (cData.success) setCourses(cData.data);
      if (coData.success) setCohorts(coData.data);
      if (tData.success) setTeachers(tData.data);
      
      if (bData.success) {
        const b = bData.data;
        setFormData({
          batchName: b.batchName || "",
          cohort: b.cohort?._id || b.cohort || "",
          course: b.course?._id || b.course || "",
          primaryTeacher: b.primaryTeacher?._id || b.primaryTeacher || "",
          assistantTeacher: b.assistantTeacher?._id || b.assistantTeacher || "",
          mentor: b.mentor?._id || b.mentor || "",
          defaultCapacity: b.defaultCapacity || 50,
          batchStart: b.batchStart ? new Date(b.batchStart).toISOString().split('T')[0] : "",
          batchEnd: b.batchEnd ? new Date(b.batchEnd).toISOString().split('T')[0] : "",
          status: b.status || "open",
        });
      }
    } catch (err) {
      console.error("Failed to fetch data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.batchName || !formData.course || !formData.cohort) {
      toast.error("Validation Error", "Please fill all required fields.");
      return;
    }
    
    setSaving(true);
    try {
      const res = await fetch(`/api/batches/${batchId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          batchStart: formData.batchStart ? new Date(formData.batchStart).toISOString() : undefined,
          batchEnd: formData.batchEnd ? new Date(formData.batchEnd).toISOString() : undefined,
          defaultCapacity: parseInt(formData.defaultCapacity as any, 10),
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Batch Updated", "Batch has been successfully updated.");
        router.push(`/admin/batches/${batchId}`);
        router.refresh();
      } else {
        toast.error("Update Failed", data.error || data.message || "Failed to update batch");
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
        entityName="Edit Batch"
        description="Update batch settings and capacity."
        moduleIcon={<Edit className="w-5 h-5 text-indigo-500" />}
        primaryAction={
          <Link href={`/admin/batches/${batchId}`} className="lms-btn lms-btn-secondary">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Batch
          </Link>
        }
      />

      <DashboardCard title="Batch Details" subtitle="Configuration for the batch.">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2 col-span-full">
            <label className="lms-label">Batch Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              className="lms-input"
              value={formData.batchName}
              onChange={(e) => setFormData({ ...formData, batchName: e.target.value })}
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
            <label className="lms-label">Cohort <span className="text-red-500">*</span></label>
            <select
              className="lms-input"
              value={formData.cohort}
              onChange={(e) => setFormData({ ...formData, cohort: e.target.value })}
            >
              <option value="" disabled>Select a cohort</option>
              {cohorts.map(c => (
                <option key={c._id} value={c._id}>{c.cohortName}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="lms-label">Primary Teacher</label>
            <select
              className="lms-input"
              value={formData.primaryTeacher}
              onChange={(e) => setFormData({ ...formData, primaryTeacher: e.target.value })}
            >
              <option value="">Unassigned</option>
              {teachers.map(t => (
                <option key={t._id} value={t._id}>{t.firstName} {t.lastName}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="lms-label">Assistant Teacher</label>
            <select
              className="lms-input"
              value={formData.assistantTeacher}
              onChange={(e) => setFormData({ ...formData, assistantTeacher: e.target.value })}
            >
              <option value="">Unassigned</option>
              {teachers.map(t => (
                <option key={t._id} value={t._id}>{t.firstName} {t.lastName}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="lms-label">Mentor</label>
            <select
              className="lms-input"
              value={formData.mentor}
              onChange={(e) => setFormData({ ...formData, mentor: e.target.value })}
            >
              <option value="">Unassigned</option>
              {teachers.map(t => (
                <option key={t._id} value={t._id}>{t.firstName} {t.lastName}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="lms-label">Start Date</label>
            <input
              type="date"
              className="lms-input"
              value={formData.batchStart}
              onChange={(e) => setFormData({ ...formData, batchStart: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="lms-label">End Date</label>
            <input
              type="date"
              className="lms-input"
              value={formData.batchEnd}
              onChange={(e) => setFormData({ ...formData, batchEnd: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="lms-label">Capacity</label>
            <input
              type="number"
              className="lms-input"
              value={formData.defaultCapacity}
              onChange={(e) => setFormData({ ...formData, defaultCapacity: parseInt(e.target.value) || 0 })}
            />
          </div>
          
          <div className="space-y-2">
            <label className="lms-label">Status</label>
            <select
              className="lms-input"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="open">Open</option>
              <option value="full">Full</option>
              <option value="closed">Closed</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
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
