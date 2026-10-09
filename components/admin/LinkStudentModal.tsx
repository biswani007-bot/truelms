"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/dialogs/ToastProvider";

export function LinkStudentModal({ 
  parentId, 
  onClose,
  onSuccess
}: { 
  parentId: string, 
  onClose: () => void,
  onSuccess: () => void
}) {
  const router = useRouter();
  const toast = useToast();
  
  const [saving, setSaving] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);

  const [formData, setFormData] = useState({
    studentId: "",
    relationshipType: "guardian",
    isEmergencyContact: true,
  });

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await fetch("/api/admin/students");
        const data = await res.json();
        if (data.success && data.data) {
          setStudents(data.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingStudents(false);
      }
    };
    fetchStudents();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.studentId) return;
    
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/parents/link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentId,
          studentId: formData.studentId,
          relationshipType: formData.relationshipType,
          isEmergencyContact: formData.isEmergencyContact
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Student Linked", "The student has been linked to this parent.");
        onSuccess();
        onClose();
      } else {
        toast.error("Link Failed", data.error || data.message || "Failed to link student");
      }
    } catch (err) {
      toast.error("Network Error", "Error linking student");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h2 className="text-lg font-extrabold text-slate-900">Link New Student</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
        
        <div className="p-6 overflow-y-auto">
          <form id="link-student-form" onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Select Student</label>
              {loadingStudents ? (
                <div className="text-xs text-slate-500">Loading students...</div>
              ) : (
                <select
                  required
                  value={formData.studentId}
                  onChange={e => setFormData({ ...formData, studentId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
                >
                  <option value="" disabled>-- Select a Student --</option>
                  {students.map(s => (
                    <option key={s._id} value={s._id}>
                      {s.firstName} {s.lastName} ({s.studentId})
                    </option>
                  ))}
                </select>
              )}
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Relationship</label>
              <select
                value={formData.relationshipType}
                onChange={e => setFormData({ ...formData, relationshipType: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
              >
                <option value="father">Father</option>
                <option value="mother">Mother</option>
                <option value="guardian">Guardian</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="emergency-contact"
                checked={formData.isEmergencyContact}
                onChange={e => setFormData({ ...formData, isEmergencyContact: e.target.checked })}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="emergency-contact" className="text-sm font-medium text-slate-700">
                Mark as Emergency Contact
              </label>
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
            form="link-student-form"
            className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50"
            disabled={saving || !formData.studentId}
          >
            {saving ? "Linking..." : "Link Student"}
          </button>
        </div>
      </div>
    </div>
  );
}
