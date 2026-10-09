"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Shield,
  Briefcase,
  Globe,
  Save,
  CheckCircle2,
  AlertCircle,
  Users,
  Settings,
  ArrowRight,
} from "lucide-react";

interface ParentProfileData {
  profile: {
    id: string;
    parentId: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    email: string;
    phone: string;
    alternatePhone?: string;
    address: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
    languagePreference: string;
    occupation?: string;
    organization?: string;
    designation?: string;
    status: string;
    createdAt: string;
  };
  security: {
    email: string;
    hasPassword: boolean;
    isActive: boolean;
    identities: Array<{
      provider: string;
      linkedAt: string;
    }>;
    createdAt: string;
  };
  linkedWards: Array<{
    linkId: string;
    studentId: string;
    studentCode: string;
    name: string;
    relationshipType: string;
    canAccessPortal: boolean;
    status: string;
  }>;
}

export default function ParentProfilePage() {
  const [data, setData] = useState<ParentProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form state
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    alternatePhone: "",
    address: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",
    occupation: "",
    organization: "",
    designation: "",
    languagePreference: "en",
  });

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/parent/profile");
      if (!res.ok) {
        throw new Error("Failed to load parent profile");
      }
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
        const p = json.data.profile;
        setForm({
          firstName: p.firstName || "",
          lastName: p.lastName || "",
          phone: p.phone || "",
          alternatePhone: p.alternatePhone || "",
          address: p.address || "",
          city: p.city || "",
          state: p.state || "",
          country: p.country || "USA",
          postalCode: p.postalCode || "",
          occupation: p.occupation || "",
          organization: p.organization || "",
          designation: p.designation || "",
          languagePreference: p.languagePreference || "en",
        });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to load profile" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setMessage(null);
      const res = await fetch("/api/parent/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to update profile");
      }
      setData(json.data);
      setMessage({ type: "success", text: "Parent profile details updated successfully." });
      setTimeout(() => setMessage(null), 4000);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to save profile changes" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="h-28 bg-slate-100 rounded-3xl animate-pulse" />
        <div className="h-96 bg-slate-100 rounded-3xl animate-pulse" />
      </div>
    );
  }

  const p = data?.profile;

  return (
    <div className="space-y-8 max-w-[1600px] w-full mx-auto">
      {/* Header & Quick Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Parent & Guardian Profile</h1>
          <p className="text-xs text-slate-500 mt-1">
            Primary authenticated guardian details and verified student relationships.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/parent/settings"
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Account Settings</span>
          </Link>
          <Link
            href="/parent/security"
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Security</span>
          </Link>
        </div>
      </div>

      {/* Alert banner */}
      {message && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-2.5 ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Identity Banner Card */}
      <div className="bg-gradient-to-tr from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-emerald-900/30">
              {p?.firstName?.[0] || "P"}
              {p?.lastName?.[0] || "G"}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-black tracking-tight">
                  {p?.firstName} {p?.lastName}
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {p?.status || "Active"}
                </span>
              </div>
              <p className="text-xs text-slate-300 font-mono mt-1">
                Parent ID: <strong className="text-emerald-400 font-bold">{p?.parentId}</strong>
              </p>
              <p className="text-xs text-slate-400 mt-0.5">{p?.email}</p>
            </div>
          </div>

          <div className="flex sm:flex-col items-start sm:items-end justify-between border-t sm:border-t-0 pt-4 sm:pt-0 border-slate-700/60 text-xs text-slate-400">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Family Portal Access
              </span>
              <span className="text-emerald-400 font-semibold text-xs flex items-center gap-1 mt-0.5">
                <Shield className="w-3.5 h-3.5" />
                Verified Guardian
              </span>
            </div>
            {p?.createdAt && (
              <span className="text-[10px] text-slate-400 mt-2">
                Member since {new Date(p.createdAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Profile Grid: Editable Form & Linked Children */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Editable Information Form */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSave} className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-base font-black text-slate-900">Personal & Contact Details</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Keep your residential address and contact numbers up-to-date for school correspondence.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">First Name</label>
                <input
                  type="text"
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">Last Name</label>
                <input
                  type="text"
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  Primary Email (Account ID)
                </label>
                <input
                  type="email"
                  value={p?.email || ""}
                  disabled
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 font-medium cursor-not-allowed"
                />
                <span className="text-[10px] text-slate-400">To change your primary email, contact platform support.</span>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  Primary Phone
                </label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  Alternate Phone (Optional)
                </label>
                <input
                  type="text"
                  value={form.alternatePhone}
                  onChange={(e) => setForm({ ...form, alternatePhone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                  placeholder="+1-555-0100"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-slate-400" />
                  Preferred Language
                </label>
                <select
                  value={form.languagePreference}
                  onChange={(e) => setForm({ ...form, languagePreference: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium bg-white"
                >
                  <option value="en">English (US)</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="hi">Hindi</option>
                </select>
              </div>
            </div>

            {/* Address Subsection */}
            <div className="pt-4 border-t border-slate-100 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                Residential Address
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="font-bold text-slate-700 block">Street Address</label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">City</label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">State / Province</label>
                  <input
                    type="text"
                    value={form.state}
                    onChange={(e) => setForm({ ...form, state: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">Postal Code</label>
                  <input
                    type="text"
                    value={form.postalCode}
                    onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">Country</label>
                  <input
                    type="text"
                    value={form.country}
                    onChange={(e) => setForm({ ...form, country: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Professional / Occupation Subsection */}
            <div className="pt-4 border-t border-slate-100 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                Professional Background (Optional)
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">Occupation</label>
                  <input
                    type="text"
                    value={form.occupation}
                    onChange={(e) => setForm({ ...form, occupation: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                    placeholder="e.g. Engineer"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">Organization</label>
                  <input
                    type="text"
                    value={form.organization}
                    onChange={(e) => setForm({ ...form, organization: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                    placeholder="e.g. Tech Corp"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">Designation</label>
                  <input
                    type="text"
                    value={form.designation}
                    onChange={(e) => setForm({ ...form, designation: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                    placeholder="e.g. Director"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm shadow-emerald-600/20 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? "Saving Changes..." : "Save Profile Changes"}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right 1 Col: Linked Wards & Security Summary */}
        <div className="space-y-6">
          {/* Linked Wards Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">Linked Wards</h3>
              </div>
              <span className="text-[10px] font-extrabold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full">
                {data?.linkedWards?.length || 0} Children
              </span>
            </div>

            <p className="text-xs text-slate-500">
              Students legally linked to this guardian account with portal access privileges.
            </p>

            <div className="space-y-2.5">
              {data?.linkedWards && data.linkedWards.length > 0 ? (
                data.linkedWards.map((w) => (
                  <div
                    key={w.studentId}
                    className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between"
                  >
                    <div className="truncate">
                      <p className="text-xs font-bold text-slate-900 truncate">{w.name}</p>
                      <p className="text-[10px] text-slate-500 capitalize">
                        {w.relationshipType} • {w.studentCode}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-emerald-100/70 text-emerald-800 rounded-lg shrink-0">
                      {w.status}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl">
                  No linked wards found.
                </div>
              )}
            </div>

            <div className="pt-2">
              <Link
                href="/parent/children"
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
              >
                <span>Manage Children</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Quick Account Security Summary Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Shield className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">Account Security</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Password</span>
                <span className="font-bold text-slate-800 flex items-center gap-1">
                  {data?.security.hasPassword ? (
                    <span className="text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Set & Active
                    </span>
                  ) : (
                    <span className="text-amber-600">OAuth Only</span>
                  )}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500">Linked Providers</span>
                <span className="font-bold text-slate-800">
                  {data?.security.identities && data.security.identities.length > 0
                    ? data.security.identities.map((id) => id.provider).join(", ")
                    : "Email & Password"}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500">Account Status</span>
                <span className="font-bold text-emerald-600 uppercase text-[10px]">
                  {data?.security.isActive ? "Active & Verified" : "Suspended"}
                </span>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href="/parent/settings"
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Security & Password Settings</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
