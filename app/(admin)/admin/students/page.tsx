import React from "react";
import { studentRepository } from "../../../../repositories/student.repository";
import { connectDB } from "../../../../config/db";
import StudentDirectoryClient from "../../../../components/workspace/StudentDirectoryClient";

export const revalidate = 0; // Fresh listing

export default async function StudentListPage() {
  await connectDB();
  const students = await studentRepository.findMany({}, { populate: "user" });

  // Serialize Mongoose Documents cleanly to JSON POJO
  const serializedStudents = students.map((s) => ({
    _id: s._id?.toString(),
    studentId: s.studentId,
    firstName: s.firstName,
    lastName: s.lastName,
    phone: s.phone,
    city: s.city,
    status: s.status,
    user: (s as any).user ? { email: (s as any).user.email } : undefined,
  }));

  return <StudentDirectoryClient initialStudents={serializedStudents} />;
}

