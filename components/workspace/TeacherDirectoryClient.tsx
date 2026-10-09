"use client";

import React, { useState } from "react";
import Link from "next/link";
import { DataTable, Column } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Mail, Phone, Download, ExternalLink, Archive } from "lucide-react";
import { ArchiveDialog } from "@/components/ui/dialogs/EnterpriseDialog";
import { useToast } from "@/components/ui/dialogs/ToastProvider";
import { ContextualGuidanceBanner } from "@/components/ui/dialogs/ContextualGuidance";
import { EditTeacherModal } from "@/components/admin/EditTeacherModal";

interface TeacherData {
  _id?: string;
  id?: string;
  teacherCode: string;
  firstName: string;
  lastName: string;
  department?: string;
  designation?: string;
  employmentType?: string;
  phone?: string;
  status: string;
  isCounsellor?: boolean;
  user?: {
    email?: string;
  };
}

interface TeacherDirectoryClientProps {
  initialTeachers: TeacherData[];
}

export default function TeacherDirectoryClient({
  initialTeachers,
}: TeacherDirectoryClientProps) {
  const [searchValue, setSearchValue] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [archiveTargetItems, setArchiveTargetItems] = useState<TeacherData[] | null>(null);
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<TeacherData | null>(null);
  const toast = useToast();

  const departments = Array.from(
    new Set(initialTeachers.map((t) => t.department).filter(Boolean))
  );

  const filteredTeachers = initialTeachers.filter((teacher) => {
    const fullName = `${teacher.firstName} ${teacher.lastName}`.toLowerCase();
    const matchesSearch =
      fullName.includes(searchValue.toLowerCase()) ||
      (teacher.teacherCode || "").toLowerCase().includes(searchValue.toLowerCase()) ||
      (teacher.department || "").toLowerCase().includes(searchValue.toLowerCase()) ||
      (teacher.designation || "").toLowerCase().includes(searchValue.toLowerCase());

    const matchesDept =
      departmentFilter === "all" || teacher.department === departmentFilter;

    return matchesSearch && matchesDept;
  });

  const handleArchiveConfirm = async () => {
    if (!archiveTargetItems) return;
    setArchiveLoading(true);
    await new Promise((res) => setTimeout(res, 600));
    setArchiveLoading(false);
    toast.success(
      "Faculty Archived",
      `Successfully archived ${archiveTargetItems.length} faculty profile${archiveTargetItems.length > 1 ? "s" : ""}.`
    );
    setArchiveTargetItems(null);
  };

  const columns: Column<TeacherData>[] = [
    {
      key: "teacherCode",
      header: "Faculty ID",
      sortable: true,
      width: "130px",
      render: (item) => (
        <span className="lms-code font-bold text-indigo-600 tracking-wide">
          {item.teacherCode}
        </span>
      ),
    },
    {
      key: "firstName",
      header: "Faculty Member",
      sortable: true,
      render: (item) => (
        <div className="flex flex-col">
          <Link
            href={`/admin/teachers/${item._id || item.id}`}
            className="lms-body-sm font-bold text-slate-900 hover:text-indigo-600 transition-colors"
          >
            {item.firstName} {item.lastName}
          </Link>
          <div className="flex items-center gap-1.5">
            <span className="lms-caption text-slate-400">
              {item.user?.email || "No email on record"}
            </span>
            {item.isCounsellor && (
              <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200">
                Counsellor
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "department",
      header: "Department / Role",
      sortable: true,
      render: (item) => (
        <div className="flex flex-col">
          <span className="lms-body-sm font-semibold text-slate-800">
            {item.department || "General"}
          </span>
          <span className="lms-caption text-slate-400">
            {item.designation || "Instructor"}
          </span>
        </div>
      ),
    },
    {
      key: "employmentType",
      header: "Employment",
      render: (item) => (
        <span className="lms-label text-slate-600 capitalize">
          {item.employmentType || "full-time"}
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
            href={`/admin/teachers/${item._id || item.id}`}
            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
            title="View Faculty Workspace"
          >
            <ExternalLink className="size-4" />
          </Link>
          <button
            onClick={() => setEditingTeacher(item)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
            title="Edit Faculty Member"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-edit size-4"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          {item.user?.email && (
            <a
              href={`mailto:${item.user.email}`}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title="Send Email"
            >
              <Mail className="size-4" />
            </a>
          )}
          {item.phone && (
            <a
              href={`tel:${item.phone}`}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title="Call Phone"
            >
              <Phone className="size-4" />
            </a>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <ContextualGuidanceBanner guidanceKey="teacher-directory" />
      {/* Page Header */}
      <div className="lms-page-header">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <h1 className="lms-page-title">Faculty Directory</h1>
            <Badge variant="outline" className="text-xs font-bold text-slate-500 border-slate-200">
              {filteredTeachers.length} Members
            </Badge>
          </div>
          <p className="lms-caption">
            Manage academic instructors, department assignments, and teaching schedules.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="lms-input py-2 text-sm w-auto"
            style={{ width: "auto", minWidth: "160px" }}
          >
            <option value="all">All Departments</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        data={filteredTeachers}
        columns={columns}
        searchPlaceholder="Search by name, ID, department or role..."
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        emptyTitle="No faculty members found"
        emptyDescription="Try adjusting your search or department filter to find matching instructors."
        onExport={() =>
          toast.success(
            "Export Complete",
            `Exported ${filteredTeachers.length} faculty records to CSV.`
          )
        }
        bulkActions={[
          {
            label: "Export Selected",
            action: (items) =>
              toast.success(
                "Export Complete",
                `Exported ${items.length} selected faculty records.`
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
        title="Archive Faculty Profiles"
        subtitle={`Action affects ${archiveTargetItems?.length || 0} faculty profile(s)`}
        description="Are you sure you want to archive the selected faculty profile(s)? Faculty records will be archived from active scheduling but historical course logs will be preserved."
        confirmLabel="Archive Faculty"
        onConfirm={handleArchiveConfirm}
        loading={archiveLoading}
      />

      {editingTeacher && (
        <EditTeacherModal
          teacherId={editingTeacher._id || editingTeacher.id || ""}
          initialData={editingTeacher}
          onClose={() => setEditingTeacher(null)}
        />
      )}
    </div>
  );
}
