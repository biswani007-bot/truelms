import React from "react";
import TeacherShell from "../../components/teacher/TeacherShell";
import { getAuthenticatedTeacher } from "../../lib/auth/teacher-session";
import { connectDB } from "../../config/db";

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  await connectDB();
  let teacher = null;
  try {
    const rawTeacher = await getAuthenticatedTeacher();
    if (rawTeacher) {
      // serialize to plain object for client component
      teacher = JSON.parse(JSON.stringify(rawTeacher));
    }
  } catch (err) {
    // ignore
  }

  return (
    <TeacherShell teacher={teacher}>
      {children}
    </TeacherShell>
  );
}
