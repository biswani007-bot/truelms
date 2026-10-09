"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/dialogs/ToastProvider";
import { calculateAge } from "@/utils/age-helper";

export function EditStudentModal({ 
  studentId, 
  initialData, 
  onClose 
}: { 
  studentId: string, 
  initialData: any, 
  onClose: () => void 
}) {
  const router = useRouter();
  const toast = useToast();
  
  const [saving, setSaving] = useState(false);

  let initialDobFormatted = "";
  if (initialData.dob) {
    try {
      initialDobFormatted = new Date(initialData.dob).toISOString().slice(0, 10);
    } catch {
      initialDobFormatted = "";
    }
  }

  const [formData, setFormData] = useState({
    firstName: initialData.firstName || "",
    middleName: initialData.middleName || "",
    lastName: initialData.lastName || "",
    dob: initialDobFormatted,
    gender: initialData.gender || "",
    phone: initialData.phone || "",
    city: initialData.city || "",
    state: initialData.state || "",
    country: initialData.country || "",
    schoolCollege: initialData.schoolCollege || "",
    highestQualification: initialData.highestQualification || "",
    status: initialData.status || "active",
  });

  const calculatedAge = formData.dob ? calculateAge(formData.dob) : null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      toast.error("Validation Error", "First Name and Last Name are required.");
      return;
    }

    if (formData.dob) {
      const parsed = new Date(formData.dob);
      if (isNaN(parsed.getTime())) {
        toast.error("Validation Error", "Please provide a valid Date of Birth.");
        return;
      }
      if (parsed > new Date()) {
        toast.error("Validation Error", "Date of Birth cannot be in the future.");
        return;
      }
    }

    setSaving(true);
    
    try {
      const res = await fetch(`/api/students/${studentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: formData.firstName.trim(),
          middleName: formData.middleName.trim() || undefined,
          lastName: formData.lastName.trim(),
          dob: formData.dob || undefined,
          gender: formData.gender || undefined,
          phone: formData.phone.trim(),
          city: formData.city.trim() || undefined,
          state: formData.state.trim() || undefined,
          country: formData.country.trim() || undefined,
          schoolCollege: formData.schoolCollege.trim() || undefined,
          highestQualification: formData.highestQualification.trim() || undefined,
          status: formData.status,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Student Updated", "Student profile has been successfully updated.");
        onClose();
        router.refresh();
      } else {
        toast.error("Update Failed", data.error || data.message || "Failed to update student");
      }
    } catch {
      toast.error("Network Error", "Error updating student profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h2 className="text-lg font-extrabold text-slate-900">Edit Student Profile</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
        
        <div className="p-6 overflow-y-auto">
          <form id="edit-student-form" onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">First Name *</label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Middle Name</label>
              <input
                type="text"
                value={formData.middleName}
                onChange={e => setFormData({ ...formData, middleName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Last Name *</label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 text-sm"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-500">Date of Birth</label>
                {calculatedAge !== null && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700">
                    {calculatedAge} yrs (calc)
                  </span>
                )}
              </div>
              <input
                type="date"
                value={formData.dob}
                onChange={e => setFormData({ ...formData, dob: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Gender</label>
              <select
                value={formData.gender}
                onChange={e => setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 text-sm capitalize"
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer-not-to-say">Prefer not to say</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 text-sm"
              >
                <option value="prospect">Prospect</option>
                <option value="registered">Registered</option>
                <option value="admission-pending">Admission Pending</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
                <option value="dropped">Dropped</option>
                <option value="completed">Completed</option>
                <option value="alumni">Alumni</option>
              </select>
            </div>

            <div className="md:col-span-1">
              <label className="block text-xs font-bold text-slate-500 mb-1">Phone *</label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 text-sm"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 mb-1">School / College</label>
              <input
                type="text"
                value={formData.schoolCollege}
                onChange={e => setFormData({ ...formData, schoolCollege: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">City</label>
              <input
                type="text"
                value={formData.city}
                onChange={e => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">State</label>
              <input
                type="text"
                value={formData.state}
                onChange={e => setFormData({ ...formData, state: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Country</label>
              <input
                type="text"
                value={formData.country}
                onChange={e => setFormData({ ...formData, country: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 text-sm"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs font-bold text-slate-500 mb-1">Highest Qualification</label>
              <input
                type="text"
                value={formData.highestQualification}
                onChange={e => setFormData({ ...formData, highestQualification: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 text-sm"
              />
            </div>
          </form>
        </div>
        
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="edit-student-form"
            className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50"
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
