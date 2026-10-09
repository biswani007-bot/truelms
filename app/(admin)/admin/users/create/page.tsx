"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { WorkspaceHeader } from "@/components/workspace/WorkspaceHeader";
import { DashboardCard } from "@/components/ui/DashboardCard";
import { ArrowLeft, UserPlus } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ui/dialogs/ToastProvider";

export default function CreateUserPage() {
  const router = useRouter();
  const toast = useToast();
  
  const [saving, setSaving] = useState(false);
  const [roles, setRoles] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "",
  });

  useEffect(() => {
    // Fetch roles
    const fetchRoles = async () => {
      try {
        const res = await fetch("/api/admin/roles");
        const data = await res.json();
        if (data.success) {
          setRoles(data.data || data.roles || []);
          if (data.data?.length > 0) {
            setFormData(prev => ({ ...prev, role: data.data[0]._id }));
          }
        }
      } catch (err) {
        console.error("Failed to fetch roles", err);
      }
    };
    fetchRoles();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("User Provisioned", "User has been successfully created.");
        router.push("/admin/users");
        router.refresh();
      } else {
        toast.error("Creation Failed", data.error || data.message || "Failed to create user");
      }
    } catch (err) {
      toast.error("Network Error", "Error creating user");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto">
      <WorkspaceHeader
        entityName="Provision New User"
        description="Create a new system account and assign base roles."
        moduleIcon={<UserPlus className="size-5" />}
        breadcrumb={[
          { label: "Dashboard", href: "/admin" },
          { label: "Users", href: "/admin/users" },
          { label: "Provision User" },
        ]}
        secondaryActions={
          <div className="flex gap-2">
            <Link
              href="/admin/users"
              className="px-4 py-2 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50"
            >
              Cancel
            </Link>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50"
              disabled={saving || !formData.firstName || !formData.email || !formData.password}
            >
              {saving ? "Provisioning..." : "Provision User"}
            </button>
          </div>
        }
      />

      <DashboardCard title="Account Details">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">First Name *</label>
            <input
              type="text"
              value={formData.firstName}
              onChange={e => setFormData({ ...formData, firstName: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Last Name *</label>
            <input
              type="text"
              value={formData.lastName}
              onChange={e => setFormData({ ...formData, lastName: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Email Address *</label>
            <input
              type="email"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Initial Password *</label>
            <input
              type="password"
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
              required
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">System Role *</label>
            <select
              value={formData.role}
              onChange={e => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
              required
            >
              <option value="" disabled>Select a role...</option>
              {roles.map(r => (
                <option key={r._id} value={r._id}>{r.name}</option>
              ))}
            </select>
          </div>
        </div>
      </DashboardCard>
    </div>
  );
}
