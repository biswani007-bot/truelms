/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { testimonialRepository } from "../../../../repositories/testimonial.repository";
import { connectDB } from "../../../../config/db";

export default async function CMSTestimonials() {
  await connectDB();
  const testimonials = await testimonialRepository.findMany({});

  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Student Testimonials</h1>
          <p className="text-sm text-gray-500 mt-1">Review student reviews, ratings, and configure featured states.</p>
        </div>
        <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-lg transition">
          + Add Testimonial
        </button>
      </div>

      <div className="border border-gray-200 rounded-2xl bg-gray-50 overflow-hidden">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-gray-500 text-xs font-semibold uppercase">
              <th className="p-4">Name</th>
              <th className="p-4">Designation</th>
              <th className="p-4">Rating</th>
              <th className="p-4">Featured</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200/60">
            {testimonials.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-400">No testimonials found.</td>
              </tr>
            ) : (
              testimonials.map((t: any) => (
                <tr key={t._id} className="hover:bg-white/25 transition">
                  <td className="p-4 font-semibold text-white">{t.name}</td>
                  <td className="p-4 text-gray-500">{t.designation} at {t.company}</td>
                  <td className="p-4 text-gray-500 font-semibold text-yellow-500">{"★".repeat(t.rating)}</td>
                  <td className="p-4 text-gray-500">{t.featured ? "★ Yes" : "No"}</td>
                  <td className="p-4 text-right space-x-2">
                    <button className="text-xs font-semibold text-gray-500 hover:text-gray-900 transition">Edit</button>
                    <button className="text-xs font-semibold text-red-400 hover:text-red-300 transition">Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
