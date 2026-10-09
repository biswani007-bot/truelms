"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { WorkspaceHeader } from "@/components/workspace/WorkspaceHeader";
import { DashboardCard } from "@/components/ui/DashboardCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ArrowLeft, User, Phone, MapPin, Mail, Briefcase, Link as LinkIcon, Trash2, Plus } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ui/dialogs/ToastProvider";
import { EditParentModal } from "@/components/admin/EditParentModal";
import { LinkStudentModal } from "@/components/admin/LinkStudentModal";

export default function ParentDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const toast = useToast();
  
  const [parentId, setParentId] = useState<string | null>(null);
  const [parent, setParent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [showLink, setShowLink] = useState(false);

  useEffect(() => {
    params.then(p => {
      setParentId(p.id);
      fetchParent(p.id);
    });
  }, [params]);

  const fetchParent = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/parents/${id}`);
      const data = await res.json();
      if (data.success) {
        setParent(data.data);
      } else {
        toast.error("Error", data.error || "Failed to load parent");
      }
    } catch (err) {
      console.error("Failed to fetch parent", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUnlink = async (linkId: string) => {
    if (!confirm("Are you sure you want to unlink this student from the parent?")) return;
    try {
      const res = await fetch(`/api/admin/parents/link?linkId=${linkId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Student Unlinked", "The student has been successfully unlinked.");
        fetchParent(parentId!);
      } else {
        toast.error("Error", data.error || "Failed to unlink student");
      }
    } catch (err) {
      toast.error("Network Error", "Error unlinking student");
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-500 font-medium">Loading parent details...</div>;
  }

  if (!parent) {
    return (
      <div className="py-20 text-center text-slate-500 font-medium">
        Parent profile not found.{" "}
        <Link href="/admin/parents" className="text-indigo-600 font-semibold hover:underline">
          Back to Directory
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto">
      <WorkspaceHeader
        entityName={`${parent.firstName} ${parent.lastName}`}
        status={parent.status}
        entityId={parent.parentId}
        createdDate={new Date(parent.createdAt).toLocaleDateString()}
        moduleIcon={<User className="size-5" />}
        breadcrumb={[
          { label: "Dashboard", href: "/admin" },
          { label: "Parents", href: "/admin/parents" },
          { label: `${parent.firstName} ${parent.lastName}` },
        ]}
        description={`Email: ${parent.email} · Phone: ${parent.phone}`}
        secondaryActions={
          <div className="flex gap-2 items-center">
            <button
              onClick={() => setShowEdit(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition shadow-sm"
            >
              Edit Profile
            </button>
            <Link
              href="/admin/parents"
              className="inline-flex items-center gap-1.5 px-3 py-2 lms-button-text text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors"
            >
              <ArrowLeft className="size-4" />
              Back
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <DashboardCard title="Parent Profile Details">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="lms-label text-slate-400 block mb-1">Email Address</span>
                <span className="lms-body-sm font-semibold text-slate-800 flex items-center gap-1.5 mt-0.5">
                  <Mail className="size-3.5 text-slate-400" />
                  {parent.email}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="lms-label text-slate-400 block mb-1">Contact Phone</span>
                <span className="lms-body-sm font-semibold text-slate-800 flex items-center gap-1.5 mt-0.5">
                  <Phone className="size-3.5 text-slate-400" />
                  {parent.phone}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="lms-label text-slate-400 block mb-1">Occupation</span>
                <span className="lms-body-sm font-semibold text-slate-800 flex items-center gap-1.5 mt-0.5">
                  <Briefcase className="size-3.5 text-slate-400" />
                  {parent.occupation || "—"}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="lms-label text-slate-400 block mb-1">Location</span>
                <span className="lms-body-sm font-semibold text-slate-800 flex items-center gap-1.5 mt-0.5">
                  <MapPin className="size-3.5 text-slate-400" />
                  {parent.city || "—"}, {parent.state || "—"}
                </span>
              </div>
            </div>
          </DashboardCard>

          <DashboardCard 
            title="Linked Students" 
            subtitle="Manage parent-student relationships"
            headerAction={
              <button 
                onClick={() => setShowLink(true)}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100"
              >
                <Plus className="size-3.5" /> Link Student
              </button>
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 bg-slate-50 text-[11px] uppercase tracking-wider font-extrabold text-gray-400">
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Admission No.</th>
                    <th className="py-3 px-4">Relationship</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {parent.students?.map((link: any) => (
                    <tr key={link._id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 font-bold text-gray-900">
                        {link.student?.firstName} {link.student?.lastName}
                      </td>
                      <td className="py-3 px-4 text-gray-600 font-mono text-xs">
                        {link.student?.admissionNumber}
                      </td>
                      <td className="py-3 px-4 capitalize text-gray-700">
                        {link.relationship}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleUnlink(link._id)}
                          className="text-xs font-bold text-rose-600 hover:text-rose-800 flex items-center justify-end gap-1 ml-auto"
                        >
                          <Trash2 className="size-3.5" /> Unlink
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!parent.students?.length && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-500 text-xs font-medium">
                        No students linked to this parent.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </DashboardCard>
        </div>

        <div className="flex flex-col gap-6">
          <DashboardCard title="Account Overview">
             <div className="space-y-4 text-sm">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <span className="text-slate-500 font-medium">Status</span>
                <StatusBadge status={parent.status} showDot />
              </div>
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <span className="text-slate-500 font-medium">Parent ID</span>
                <span className="font-mono text-xs font-bold text-slate-700">{parent.parentId}</span>
              </div>
              <div className="flex justify-between items-center pb-1">
                <span className="text-slate-500 font-medium">Platform Access</span>
                {parent.user ? (
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-xs font-bold border border-emerald-200">Registered</span>
                ) : (
                  <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded text-xs font-bold border border-amber-200">Unregistered</span>
                )}
              </div>
             </div>
          </DashboardCard>
        </div>
      </div>
      
      {showEdit && (
        <EditParentModal
          parentId={parent._id}
          initialData={parent}
          onClose={() => {
            setShowEdit(false);
            fetchParent(parent._id);
          }}
        />
      )}
      {showLink && (
        <LinkStudentModal
          parentId={parent._id}
          onClose={() => setShowLink(false)}
          onSuccess={() => fetchParent(parent._id)}
        />
      )}
    </div>
  );
}
