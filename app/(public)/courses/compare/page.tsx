/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import Link from "next/link";
import { connectDB } from "../../../../config/db";
import { courseRepository } from "../../../../repositories/course.repository";

export const revalidate = 60;

export default async function CourseComparePage({ searchParams }: { searchParams: Promise<{ ids?: string }> }) {
  await connectDB();
  const resolvedParams = await searchParams;
  const ids = resolvedParams?.ids ? resolvedParams.ids.split(",") : [];

  let courses: any[] = [];
  if (ids.length > 0) {
    courses = await courseRepository.findMany({ _id: { $in: ids } });
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-16">
      <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">Course Comparison</h1>
      <p className="text-slate-500 mb-10">Compare curriculum, fees, and outcomes side-by-side.</p>

      {courses.length === 0 ? (
        <div className="text-center py-16 bg-slate-50 border border-slate-200 rounded-2xl">
          <p className="text-slate-500 mb-4">No courses selected for comparison.</p>
          <Link href="/courses" className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl text-sm">
            Browse Courses to Compare
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto border border-slate-200 rounded-2xl bg-white shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="p-4 text-xs font-bold uppercase text-slate-400">Feature</th>
                {courses.map((course) => (
                  <th key={course._id} className="p-4 text-slate-900 font-extrabold text-lg min-w-[250px]">
                    {course.title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              <tr>
                <td className="p-4 font-bold text-slate-500">Category</td>
                {courses.map((c) => (
                  <td key={c._id} className="p-4 text-slate-800">{c.category}</td>
                ))}
              </tr>
              <tr>
                <td className="p-4 font-bold text-slate-500">Level</td>
                {courses.map((c) => (
                  <td key={c._id} className="p-4 text-slate-800">{c.level}</td>
                ))}
              </tr>
              <tr>
                <td className="p-4 font-bold text-slate-500">Duration</td>
                {courses.map((c) => (
                  <td key={c._id} className="p-4 text-slate-800">{c.duration || "N/A"}</td>
                ))}
              </tr>
              <tr>
                <td className="p-4 font-bold text-slate-500">Delivery Mode</td>
                {courses.map((c) => (
                  <td key={c._id} className="p-4 text-slate-800 uppercase">{c.deliveryMode || "Live"}</td>
                ))}
              </tr>
              <tr>
                <td className="p-4 font-bold text-slate-500">Action</td>
                {courses.map((c) => (
                  <td key={c._id} className="p-4">
                    <Link href={`/admissions/apply?course=${encodeURIComponent(c.title)}`} className="inline-block px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-lg">
                      Apply Now
                    </Link>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
