"use client";

import React, { useState } from "react";
import { EditTeacherModal } from "@/components/admin/EditTeacherModal";
import { Edit2 } from "lucide-react";

export function AdminTeacherActions({ teacher }: { teacher: any }) {
  const [showEdit, setShowEdit] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowEdit(true)}
        className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition shadow-sm"
      >
        <Edit2 className="size-4" />
        Edit Faculty
      </button>

      {showEdit && (
        <EditTeacherModal
          teacherId={teacher._id?.toString() || teacher.id}
          initialData={teacher}
          onClose={() => setShowEdit(false)}
        />
      )}
    </>
  );
}
