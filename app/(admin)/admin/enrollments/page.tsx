import React from "react";
import Link from "next/link";
import { enrollmentRepository } from "../../../../repositories/enrollment.repository";
import { connectDB } from "../../../../config/db";

export const revalidate = 0; // Fresh listing

export default async function EnrollmentListPage() {
  await connectDB();
  const enrollments = await enrollmentRepository.findMany({}, { 
    populate: ["student", "course", "admissionCounselor"],
    sort: { createdAt: -1 }
  });

  return (
    <div className="flex flex-col gap-10">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Enrollment Engine Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Monitor course conversions, scholarship codes, and registration status transitions.</p>
        </div>
        <Link
          href="/admin/enrollments/new"
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition"
        >
          + New Enrollment
        </Link>
      </div>

      {/* Enrollments Table */}
      <div className="bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-xs font-bold uppercase tracking-wider text-gray-500">
              <th className="py-4 px-6">Enrollment #</th>
              <th className="py-4 px-6">Student</th>
              <th className="py-4 px-6">Course Code</th>
              <th className="py-4 px-6">Session</th>
              <th className="py-4 px-6">Discount</th>
              <th className="py-4 px-6">Status</th>
              <th className="py-4 px-6">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 text-sm">
            {enrollments.map((enr) => (
              <tr key={enr._id?.toString()} className="hover:bg-gray-50 transition">
                <td className="py-4 px-6 font-bold text-indigo-600">{enr.enrollmentNumber}</td>
                <td className="py-4 px-6 text-gray-900 font-medium">
                  {enr.student ? `${(enr.student as unknown as { firstName: string; lastName: string }).firstName} ${(enr.student as unknown as { firstName: string; lastName: string }).lastName}` : "Archived Student"}
                </td>
                <td className="py-4 px-6 text-gray-600">{(enr.course as unknown as { courseCode: string })?.courseCode || "N/A"}</td>
                <td className="py-4 px-6 text-gray-500">{enr.academicSession}</td>
                <td className="py-4 px-6 text-gray-500">{enr.discount?.value ? `${enr.discount.value}%` : "0%"}</td>
                <td className="py-4 px-6">
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-emerald-50 border border-emerald-200 text-emerald-600`}>
                    {enr.status}
                  </span>
                </td>
                <td className="py-4 px-6">
                  <Link
                    href={`/admin/enrollments/${enr._id?.toString()}`}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-500 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-200 transition"
                  >
                    View File
                  </Link>
                </td>
              </tr>
            ))}
            {enrollments.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-gray-500">No enrollment files tracked.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
