"use client";

import React, { useState } from "react";
import Link from "next/link";
import { DataTable, Column } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Mail, Download, Archive, ExternalLink } from "lucide-react";
import { ArchiveDialog } from "@/components/ui/dialogs/EnterpriseDialog";
import { useToast } from "@/components/ui/dialogs/ToastProvider";
import { ContextualGuidanceBanner } from "@/components/ui/dialogs/ContextualGuidance";

interface StudentData {
  _id?: string;
  id?: string;
  studentId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  city?: string;
  status: string;
  user?: {
    email?: string;
  };
}

interface StudentDirectoryClientProps {
  initialStudents: StudentData[];
}

export default function StudentDirectoryClient({
  initialStudents,
}: StudentDirectoryClientProps) {
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [archiveTargetItems, setArchiveTargetItems] = useState<StudentData[] | null>(null);
  const [archiveLoading, setArchiveLoading] = useState(false);
  const toast = useToast();

  const filteredStudents = initialStudents.filter((student) => {
    const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
    const matchesSearch =
      fullName.includes(searchValue.toLowerCase()) ||
      (student.studentId || "").toLowerCase().includes(searchValue.toLowerCase()) ||
      (student.phone || "").includes(searchValue) ||
      (student.city || "").toLowerCase().includes(searchValue.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || student.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleArchiveConfirm = async () => {
    if (!archiveTargetItems) return;
    setArchiveLoading(true);
    // Simulate archive processing delay
    await new Promise((res) => setTimeout(res, 600));
    setArchiveLoading(false);
    toast.success(
      "Students Archived",
      `Successfully archived ${archiveTargetItems.length} student profile${archiveTargetItems.length > 1 ? "s" : ""}.`
    );
    setArchiveTargetItems(null);
  };

  const columns: Column<StudentData>[] = [
    {
      key: "studentId",
      header: "Student ID",
      sortable: true,
      width: "140px",
      render: (item) => (
        <span className="lms-code font-bold text-indigo-600 tracking-wide">
          {item.studentId}
        </span>
      ),
    },
    {
      key: "firstName",
      header: "Full Name",
      sortable: true,
      render: (item) => (
        <div className="flex flex-col">
          <Link
            href={`/admin/students/${item._id || item.id}`}
            className="lms-body-sm font-bold text-slate-900 hover:text-indigo-600 transition-colors"
          >
            {item.firstName} {item.lastName}
          </Link>
          <span className="lms-caption text-slate-400">
            {item.user?.email || item.email || "No email on record"}
          </span>
        </div>
      ),
    },
    {
      key: "phone",
      header: "Contact",
      render: (item) => (
        <span className="lms-body-sm font-medium text-slate-700">
          {item.phone || "—"}
        </span>
      ),
    },
    {
      key: "city",
      header: "Location",
      sortable: true,
      render: (item) => (
        <span className="lms-body-sm font-medium text-slate-600">
          {item.city || "—"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (item) => <StatusBadge status={item.status} showDot />,
    },
    {
      key: "_id",
      header: "Actions",
      align: "right",
      render: (item) => (
        <div className="flex items-center justify-end gap-1.5">
          <Link
            href={`/admin/students/${item._id || item.id}`}
            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
            title="View Profile Workspace"
          >
            <ExternalLink className="size-4" />
          </Link>
          {item.email && (
            <a
              href={`mailto:${item.email}`}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title="Send Email"
            >
              <Mail className="size-4" />
            </a>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <ContextualGuidanceBanner guidanceKey="student-directory" />
      {/* Page Header */}
      <div className="lms-page-header">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <h1 className="lms-page-title">Student Directory</h1>
            <Badge variant="outline" className="text-xs font-bold text-slate-500 border-slate-200">
              {filteredStudents.length} Profiles
            </Badge>
          </div>
          <p className="lms-caption">
            Manage student registration profiles, qualifications, and academic records.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="lms-input py-2 text-sm w-auto"
            style={{ width: "auto", minWidth: "150px" }}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        data={filteredStudents}
        columns={columns}
        searchPlaceholder="Search by name, ID, phone or city..."
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        emptyTitle="No students found"
        emptyDescription="Try adjusting your search or status filter to find matching students."
        onExport={() =>
          toast.success(
            "Export Complete",
            `Exported ${filteredStudents.length} student records to CSV.`
          )
        }
        bulkActions={[
          {
            label: "Export Selected",
            action: (items) =>
              toast.success(
                "Export Complete",
                `Exported ${items.length} selected student records.`
              ),
            icon: <Download className="size-3.5" />,
          },
          {
            label: "Archive Selected",
            action: (items) => setArchiveTargetItems(items),
            icon: <Archive className="size-3.5" />,
            variant: "danger",
          },
        ]}
      />

      {/* Reusable Enterprise Archive Dialog */}
      <ArchiveDialog
        isOpen={!!archiveTargetItems}
        onClose={() => setArchiveTargetItems(null)}
        title="Archive Selected Students"
        subtitle={`Action affects ${archiveTargetItems?.length || 0} student profile(s)`}
        description="Are you sure you want to archive the selected student profile(s)? Archived profiles will be hidden from the active directory but remain accessible in reporting archives."
        confirmLabel="Archive Profiles"
        onConfirm={handleArchiveConfirm}
        loading={archiveLoading}
      />
    </div>
  );
}
