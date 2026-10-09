"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { WorkspaceHeader } from "@/components/workspace/WorkspaceHeader";
import { DashboardCard } from "@/components/ui/DashboardCard";
import { ArrowLeft, User, Shield, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ui/dialogs/ToastProvider";

export default function UserDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const toast = useToast();
  
  const [userId, setUserId] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    isActive: true,
  });

  useEffect(() => {
    params.then(p => {
      setUserId(p.id);
      fetchUser(p.id);
    });
  }, [params]);

  const fetchUser = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/users/${id}`);
      const data = await res.json();
      if (data.success) {
        setUser(data.data);
        setFormData({
          firstName: data.data.firstName,
          lastName: data.data.lastName,
          email: data.data.email,
          isActive: data.data.isActive,
        });
      }
    } catch (err) {
      console.error("Failed to fetch user", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!userId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("User Updated", "User profile has been successfully updated.");
        setUser(data.data);
        setIsEditing(false);
        router.refresh();
      } else {
        toast.error("Update Failed", data.error || data.message || "Failed to update user");
      }
    } catch (err) {
      toast.error("Network Error", "Error updating user");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-500 font-medium">Loading user details...</div>;
  }

  if (!user) {
    return (
      <div className="py-20 text-center text-slate-500 font-medium">
        User not found.{" "}
        <Link href="/admin/users" className="text-indigo-600 font-semibold hover:underline">
          Back to Directory
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 max-w-7xl">
      <WorkspaceHeader
        entityName={`${user.firstName} ${user.lastName}`}
        status={user.isActive ? "active" : "inactive"}
        entityId={user._id.toString()}
        createdDate={new Date(user.createdAt).toLocaleDateString()}
        moduleIcon={<User className="size-5" />}
        breadcrumb={[
          { label: "Dashboard", href: "/admin" },
          { label: "Users", href: "/admin/users" },
          { label: "Manage User" },
        ]}
        description={`Email: ${user.email}`}
        secondaryActions={
          <div className="flex gap-2">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition"
              >
                Edit User
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50"
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            )}
            <Link
              href="/admin/users"
              className="inline-flex items-center gap-1.5 px-3 py-2 lms-button-text text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors"
            >
              <ArrowLeft className="size-4" />
              Back
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DashboardCard title="Profile Details">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">First Name</label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
                />
              ) : (
                <div className="font-semibold text-slate-900">{user.firstName}</div>
              )}
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Last Name</label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
                />
              ) : (
                <div className="font-semibold text-slate-900">{user.lastName}</div>
              )}
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Email Address</label>
              {isEditing ? (
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
                />
              ) : (
                <div className="font-semibold text-slate-900">{user.email}</div>
              )}
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Account Status</label>
              {isEditing ? (
                <select
                  value={formData.isActive ? "true" : "false"}
                  onChange={e => setFormData({ ...formData, isActive: e.target.value === "true" })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive / Suspended</option>
                </select>
              ) : (
                <div className="flex items-center gap-2 font-semibold">
                  {user.isActive ? (
                    <><CheckCircle2 className="size-4 text-emerald-500" /><span className="text-emerald-700">Active</span></>
                  ) : (
                    <><AlertCircle className="size-4 text-rose-500" /><span className="text-rose-700">Inactive</span></>
                  )}
                </div>
              )}
            </div>
          </div>
        </DashboardCard>
        
        <DashboardCard title="Role & Security">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">System Role</label>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 font-bold rounded-lg border border-indigo-100 uppercase tracking-wide text-xs">
                <Shield className="size-3.5" />
                {user.role?.name || "Unknown"}
              </div>
              {isEditing && (
                <p className="mt-2 text-xs text-slate-500">
                  Role modifications require super-admin privileges and are disabled in this view.
                </p>
              )}
            </div>
          </div>
        </DashboardCard>
      </div>
    </div>
  );
}
