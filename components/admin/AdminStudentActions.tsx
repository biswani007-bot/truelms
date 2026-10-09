"use client";

import React, { useState } from "react";
import { EditStudentModal } from "@/components/admin/EditStudentModal";
import { Edit2 } from "lucide-react";

export function AdminStudentActions({ student }: { student: any }) {
  const [showEdit, setShowEdit] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowEdit(true)}
        className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition shadow-sm"
      >
        <Edit2 className="size-4" />
        Edit Profile
      </button>

      {showEdit && (
        <EditStudentModal
          studentId={student._id?.toString() || student.id}
          initialData={student}
          onClose={() => setShowEdit(false)}
        />
      )}
    </>
  );
}
