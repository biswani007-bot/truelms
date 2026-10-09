"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { WorkspaceHeader } from "@/components/workspace/WorkspaceHeader";
import { DashboardCard } from "@/components/ui/DashboardCard";
import { ArrowLeft, Edit } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ui/dialogs/ToastProvider";

export default function EditEnrollmentPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const toast = useToast();
  
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [enrollmentId, setEnrollmentId] = useState("");

  const [formData, setFormData] = useState({
    academicSession: "",
    status: "pending",
    remarks: "",
  });

  useEffect(() => {
    params.then((p) => {
      setEnrollmentId(p.id);
      fetchData(p.id);
    });
  }, [params]);

  const fetchData = async (id: string) => {
    try {
      const res = await fetch(`/api/enrollments/${id}`);
      const data = await res.json();
      if (data.success) {
        const e = data.data;
        setFormData({
          academicSession: e.academicSession || "",
          status: e.status || "pending",
          remarks: e.remarks || "",
        });
      }
    } catch (err) {
      console.error("Failed to fetch enrollment", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/enrollments/${enrollmentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Enrollment Updated", "Enrollment has been successfully updated.");
        router.push(`/admin/enrollments/${enrollmentId}`);
        router.refresh();
      } else {
        toast.error("Update Failed", data.error || data.message || "Failed to update enrollment");
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
        entityName="Edit Enrollment"
        description="Update enrollment status and details."
        moduleIcon={<Edit className="w-5 h-5 text-indigo-500" />}
        primaryAction={
          <Link href={`/admin/enrollments/${enrollmentId}`} className="lms-btn lms-btn-secondary">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Enrollment
          </Link>
        }
      />

      <DashboardCard title="Enrollment Details" subtitle="Update academic session, remarks, and status.">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="lms-label">Academic Session</label>
            <input
              type="text"
              className="lms-input"
              value={formData.academicSession}
              onChange={(e) => setFormData({ ...formData, academicSession: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="lms-label">Status</label>
            <select
              className="lms-input"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="waiting-payment">Waiting Payment</option>
              <option value="confirmed">Confirmed</option>
              <option value="batch-assigned">Batch Assigned</option>
              <option value="learning-started">Learning Started</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>

          <div className="space-y-2 col-span-full">
            <label className="lms-label">Remarks</label>
            <textarea
              className="lms-input min-h-[100px]"
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              placeholder="Internal remarks..."
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
