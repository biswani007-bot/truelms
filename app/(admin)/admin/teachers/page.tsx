import React from "react";
import { teacherRepository } from "../../../../repositories/teacher.repository";
import { connectDB } from "../../../../config/db";
import TeacherDirectoryClient from "../../../../components/workspace/TeacherDirectoryClient";

export const revalidate = 0; // Fresh listing

export default async function TeacherListPage() {
  await connectDB();
  const teachers = await teacherRepository.findMany({}, { populate: "user" });

  const serializedTeachers = teachers.map((t) => ({
    _id: t._id?.toString(),
    teacherCode: t.teacherCode,
    firstName: t.firstName,
    lastName: t.lastName,
    department: t.department,
    designation: t.designation,
    employmentType: t.employmentType,
    status: t.status,
    isCounsellor: t.isCounsellor || false,
    user: (t as any).user ? { email: (t as any).user.email } : undefined,
  }));

  return <TeacherDirectoryClient initialTeachers={serializedTeachers} />;
}

