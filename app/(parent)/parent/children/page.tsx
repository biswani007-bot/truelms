"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useParentChild, ChildProfile } from "@/components/parent/parent-child-context";
import { calculateAge } from "@/utils/age-helper";
import {
  Users,
  UserPlus,
  CheckCircle2,
  ShieldCheck,
  PhoneCall,
  Lock,
  ArrowRight,
  Sparkles,
  AlertCircle,
  X,
  User,
  GraduationCap,
  Trash2,
  Pencil,
  MapPin,
  Building2,
  Phone as PhoneIcon,
  Calendar,
} from "lucide-react";
import Link from "next/link";

interface ChildFormState {
  firstName: string;
  middleName: string;
  lastName: string;
  relationshipType: string;
  gender: string;
  dob: string;
  phone: string;
  city: string;
  state: string;
  country: string;
  schoolCollege: string;
}

const emptyForm: ChildFormState = {
  firstName: "",
  middleName: "",
  lastName: "",
  relationshipType: "guardian",
  gender: "",
  dob: "",
  phone: "",
  city: "",
  state: "",
  country: "",
  schoolCollege: "",
};

function getProfileCompletion(child: ChildProfile) {
  const fields = [
    { name: "Name", filled: Boolean(child.firstName && child.lastName) },
    { name: "Date of Birth", filled: Boolean(child.dob) },
    { name: "Gender", filled: Boolean(child.gender) },
    { name: "Phone", filled: Boolean(child.phone) },
    { name: "Location", filled: Boolean(child.city || child.state || child.country) },
    { name: "School / College", filled: Boolean(child.schoolCollege) },
  ];
  const filledCount = fields.filter((f) => f.filled).length;
  const percentage = Math.round((filledCount / fields.length) * 100);
  const missing = fields.filter((f) => !f.filled).map((f) => f.name);
  return { percentage, missing };
}

function MyChildrenContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { children: linkedChildren, selectedChild, setSelectedChild, refreshChildren, loading } = useParentChild();

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [form, setForm] = useState<ChildFormState>(emptyForm);
  const [editingChildId, setEditingChildId] = useState<string | null>(null);

  const [childToDelete, setChildToDelete] = useState<ChildProfile | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Automatically open Add modal if ?add=true is passed
  useEffect(() => {
    if (searchParams.get("add") === "true") {
      handleOpenAddModal();
    }
  }, [searchParams]);

  const handleOpenAddModal = () => {
    setError(null);
    setForm(emptyForm);
    setAddModalOpen(true);
  };

  const handleOpenEditModal = (child: ChildProfile) => {
    setError(null);
    setEditingChildId(child.studentId);
    let dobFormatted = "";
    if (child.dob) {
      try {
        dobFormatted = new Date(child.dob).toISOString().slice(0, 10);
      } catch {
        dobFormatted = "";
      }
    }
    setForm({
      firstName: child.firstName || "",
      middleName: child.middleName || "",
      lastName: child.lastName || "",
      relationshipType: child.relationshipType || "guardian",
      gender: child.gender || "",
      dob: dobFormatted,
      phone: child.phone || "",
      city: child.city || "",
      state: child.state || "",
      country: child.country || "",
      schoolCollege: child.schoolCollege || "",
    });
    setEditModalOpen(true);
  };

  const handleCloseModals = () => {
    if (submitting) return;
    setAddModalOpen(false);
    setEditModalOpen(false);
    setEditingChildId(null);
    setError(null);
  };

  const handleSaveChild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError("First Name and Last Name are required.");
      return;
    }

    if (form.dob) {
      const parsedDob = new Date(form.dob);
      if (isNaN(parsedDob.getTime())) {
        setError("Please enter a valid Date of Birth.");
        return;
      }
      if (parsedDob > new Date()) {
        setError("Date of Birth cannot be in the future.");
        return;
      }
    }

    setSubmitting(true);
    setError(null);

    const isEditing = Boolean(editingChildId);
    const endpoint = isEditing ? `/api/parent/children/${editingChildId}` : "/api/parent/children";
    const method = isEditing ? "PUT" : "POST";

    try {
      const payload: Record<string, any> = {
        firstName: form.firstName.trim(),
        middleName: form.middleName.trim() || undefined,
        lastName: form.lastName.trim(),
        relationshipType: form.relationshipType,
        gender: form.gender ? form.gender : undefined,
        dob: form.dob ? form.dob : undefined,
        phone: form.phone.trim() ? form.phone.trim() : undefined,
        city: form.city.trim() ? form.city.trim() : undefined,
        state: form.state.trim() ? form.state.trim() : undefined,
        country: form.country.trim() ? form.country.trim() : undefined,
        schoolCollege: form.schoolCollege.trim() ? form.schoolCollege.trim() : undefined,
      };

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      let json: any = null;
      try {
        json = await res.json();
      } catch {
        json = null;
      }

      if (!res.ok) {
        throw new Error(json?.message || json?.error || `Request failed (${res.status})`);
      }

      const updatedList = await refreshChildren();

      if (isEditing) {
        const updatedChild = updatedList.find((c) => c.studentId === editingChildId);
        if (updatedChild && selectedChild?.studentId === editingChildId) {
          setSelectedChild(updatedChild);
        }
        setSuccessMsg(`${form.firstName}'s profile updated successfully!`);
      } else {
        const newChildData = json?.data;
        const found = updatedList.find(
          (c) =>
            c.studentId === newChildData?.studentId ||
            (c.firstName.toLowerCase() === form.firstName.trim().toLowerCase() &&
              c.lastName.toLowerCase() === form.lastName.trim().toLowerCase())
        );
        if (found) {
          setSelectedChild(found);
        } else if (updatedList.length > 0) {
          setSelectedChild(updatedList[updatedList.length - 1]);
        }
        setSuccessMsg(`${form.firstName} added successfully to your account!`);
      }

      handleCloseModals();
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteChild = async () => {
    if (!childToDelete) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/parent/children/${childToDelete.studentId}`, {
        method: "DELETE",
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch (e) {}

      if (!res.ok) {
        throw new Error(data?.message || data?.error || "Failed to remove child");
      }

      const updatedList = await refreshChildren();

      if (selectedChild?.studentId === childToDelete.studentId) {
        setSelectedChild(updatedList.length > 0 ? updatedList[0] : null);
      }

      setSuccessMsg(`${childToDelete.firstName} has been removed from your account.`);
      setChildToDelete(null);
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: any) {
      setError(err.message || "An error occurred");
      setChildToDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  const handleViewLearningHub = (child: ChildProfile) => {
    setSelectedChild(child);
    router.push("/parent/academics");
  };

  const currentAge = form.dob ? calculateAge(form.dob) : null;

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="relative overflow-hidden bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl shadow-emerald-950/10">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-emerald-500/30 text-emerald-200 text-[11px] font-bold px-3 py-0.5 rounded-full backdrop-blur-md border border-emerald-400/30 uppercase tracking-wide flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> Family Account
              </span>
              <span className="text-slate-300 text-xs font-medium">TrueLern Guardian Hub</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              My Children
            </h1>
            <p className="text-slate-200 text-xs md:text-sm mt-1 max-w-xl font-medium">
              Manage your linked wards, profile information, and family learning records.
            </p>
          </div>

          <button
            onClick={handleOpenAddModal}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-900/30 transition transform hover:-translate-y-0.5 active:translate-y-0 shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Add Another Child</span>
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-3.5 rounded-2xl text-xs font-semibold flex items-center justify-between gap-3 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button
            onClick={() => setSuccessMsg(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-bold px-2 py-1 rounded-lg"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-slate-200/70 rounded-3xl animate-pulse" />
          ))}
        </div>
      )}

      {/* Zero State */}
      {!loading && linkedChildren.length === 0 && (
        <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center max-w-lg mx-auto shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-5">
            <Sparkles className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">No Children Linked Yet</h2>
          <p className="text-xs text-slate-500 mb-6 leading-relaxed">
            Add your child's profile to activate your family account, schedule cohort demos, and access academic tracking.
          </p>
          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-xl text-xs shadow-md shadow-emerald-600/20 transition"
          >
            <UserPlus className="w-4 h-4" /> Add First Child
          </button>
        </div>
      )}

      {/* Children Cards Grid */}
      {!loading && linkedChildren.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {linkedChildren.map((child) => {
            const { percentage, missing } = getProfileCompletion(child);
            const ageDisplay = child.dob ? calculateAge(child.dob) : null;
            const locationStr = [child.city, child.state, child.country].filter(Boolean).join(", ");

            return (
              <div
                key={child.studentId}
                className="bg-white rounded-3xl border border-slate-200 hover:border-slate-300 transition-all flex flex-col justify-between overflow-hidden shadow-sm"
              >
                <div className="p-6">
                  {/* Top Status Bar with Profile Completion Pill */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          percentage === 100
                            ? "bg-emerald-100 text-emerald-800"
                            : percentage >= 60
                            ? "bg-amber-100 text-amber-800"
                            : "bg-slate-100 text-slate-700"
                        }`}
                        title={missing.length > 0 ? `Missing: ${missing.join(", ")}` : "Complete profile"}
                      >
                        {percentage === 100 ? "Profile Complete" : `${percentage}% Complete`}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono font-semibold text-slate-400">
                      {child.studentCode}
                    </span>
                  </div>

                  {/* Profile Header */}
                  <div className="flex items-center gap-3.5 mb-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-base font-extrabold text-white shrink-0 shadow-sm bg-slate-700">
                      {child.firstName[0]}
                    </div>
                    <div className="truncate">
                      <h2 className="text-base font-bold text-slate-900 truncate">
                        {child.firstName} {child.middleName ? `${child.middleName} ` : ""}{child.lastName}
                      </h2>
                      <p className="text-xs text-slate-500 font-medium">
                        {ageDisplay !== null ? `${ageDisplay} years old` : "Age not set"}
                        {child.gender ? ` • ${child.gender.charAt(0).toUpperCase() + child.gender.slice(1)}` : ""}
                      </p>
                    </div>
                  </div>

                  {/* Academic & Location Info */}
                  <div className="space-y-1.5 py-3 border-t border-slate-100 text-xs text-slate-600">
                    {child.schoolCollege ? (
                      <div className="flex items-center gap-2 truncate">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate font-medium">{child.schoolCollege}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-slate-400 italic">
                        <Building2 className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                        <span>School not specified</span>
                      </div>
                    )}

                    {locationStr ? (
                      <div className="flex items-center gap-2 truncate">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{locationStr}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-slate-400 italic">
                        <MapPin className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                        <span>Location not specified</span>
                      </div>
                    )}

                    {child.phone && (
                      <div className="flex items-center gap-2 truncate">
                        <PhoneIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{child.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Real Badges */}
                  <div className="flex flex-wrap gap-1.5 pt-3 border-t border-slate-100">
                    {child.isCustodial && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[10px] font-semibold">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" /> Custodial
                      </span>
                    )}
                    {child.isEmergencyContact && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[10px] font-semibold">
                        <PhoneCall className="w-3 h-3 text-indigo-600" /> Emergency
                      </span>
                    )}
                    {child.canAccessPortal && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-[10px] font-semibold border border-emerald-200/60">
                        <Lock className="w-3 h-3 text-emerald-600" /> Portal Access
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex items-center gap-2">
                  <button
                    onClick={() => handleViewLearningHub(child)}
                    className="flex-1 text-xs font-bold py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-1.5 bg-white hover:bg-emerald-50 text-slate-800 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300"
                  >
                    <span>Learning Hub</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleOpenEditModal(child)}
                    className="p-2.5 rounded-xl transition flex items-center justify-center bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200"
                    title="Edit Child Profile"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setChildToDelete(child)}
                    className="p-2.5 rounded-xl transition flex items-center justify-center bg-white hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 hover:border-rose-300"
                    title="Remove Child"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Child Modal Dialog */}
      {(addModalOpen || editModalOpen) && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in"
        >
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  {editModalOpen ? <Pencil className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editModalOpen ? "Edit Child Profile" : "Add Child Profile"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {editModalOpen
                      ? "Update profile, date of birth, contact and school information."
                      : "Create a new ward profile linked to your guardian account."}
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseModals}
                disabled={submitting}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Notification */}
            {error && (
              <div className="mx-6 mt-4 bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-2xl text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Modal Form */}
            <form onSubmit={handleSaveChild} className="p-6 space-y-5 overflow-y-auto flex-1">
              {/* SECTION: CHILD INFORMATION */}
              <div>
                <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-3">
                  Child Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      First Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      required
                      type="text"
                      disabled={submitting}
                      placeholder="e.g. Maya"
                      value={form.firstName}
                      onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Middle Name
                    </label>
                    <input
                      type="text"
                      disabled={submitting}
                      placeholder="Optional"
                      value={form.middleName}
                      onChange={(e) => setForm({ ...form, middleName: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Last Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      required
                      type="text"
                      disabled={submitting}
                      placeholder="e.g. Mercer"
                      value={form.lastName}
                      onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700">
                        Date of Birth
                      </label>
                      {currentAge !== null && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          {currentAge} yrs
                        </span>
                      )}
                    </div>
                    <input
                      type="date"
                      disabled={submitting}
                      value={form.dob}
                      onChange={(e) => setForm({ ...form, dob: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Gender
                    </label>
                    <select
                      disabled={submitting}
                      value={form.gender}
                      onChange={(e) => setForm({ ...form, gender: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition capitalize"
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="prefer-not-to-say">Prefer not to say</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Relationship
                    </label>
                    <select
                      disabled={submitting}
                      value={form.relationshipType}
                      onChange={(e) => setForm({ ...form, relationshipType: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition capitalize"
                    >
                      <option value="father">Father</option>
                      <option value="mother">Mother</option>
                      <option value="guardian">Guardian</option>
                      <option value="foster">Foster Parent</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION: CONTACT & LOCATION */}
              <div className="pt-2 border-t border-slate-100">
                <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-3">
                  Contact & Location
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      disabled={submitting}
                      placeholder="e.g. +1 555-0199"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Country
                    </label>
                    <input
                      type="text"
                      disabled={submitting}
                      placeholder="e.g. United States"
                      value={form.country}
                      onChange={(e) => setForm({ ...form, country: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      State / Province
                    </label>
                    <input
                      type="text"
                      disabled={submitting}
                      placeholder="e.g. California"
                      value={form.state}
                      onChange={(e) => setForm({ ...form, state: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      disabled={submitting}
                      placeholder="e.g. San Francisco"
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION: EDUCATION */}
              <div className="pt-2 border-t border-slate-100">
                <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-3">
                  Education
                </h4>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    School / College
                  </label>
                  <input
                    type="text"
                    disabled={submitting}
                    placeholder="e.g. Lincoln High School"
                    value={form.schoolCollege}
                    onChange={(e) => setForm({ ...form, schoolCollege: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={handleCloseModals}
                  disabled={submitting}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-md shadow-emerald-600/20 disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>{editModalOpen ? "Saving Changes..." : "Adding Child..."}</span>
                    </>
                  ) : (
                    <span>{editModalOpen ? "Save Changes" : "Save Child"}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Remove Child Confirmation Modal */}
      {childToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in"
        >
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Remove {childToDelete.firstName}?
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                This will unlink {childToDelete.firstName} from your guardian dashboard. The student learning records are preserved.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setChildToDelete(null)}
                disabled={deleting}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteChild}
                disabled={deleting}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-md shadow-rose-600/20 disabled:opacity-50 flex items-center gap-2"
              >
                {deleting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Removing...</span>
                  </>
                ) : (
                  <span>Remove Child</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MyChildrenPage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-500 font-medium">Loading family records...</div>}>
      <MyChildrenContent />
    </Suspense>
  );
}
