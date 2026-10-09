/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { faqRepository } from "../../../../repositories/faq.repository";
import { connectDB } from "../../../../config/db";

export default async function CMSFAQs() {
  await connectDB();
  const faqs = await faqRepository.findMany({});

  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">FAQs Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage public frequently asked questions and categories.</p>
        </div>
        <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-lg transition">
          + Add FAQ
        </button>
      </div>

      <div className="border border-gray-200 rounded-2xl bg-gray-50 overflow-hidden">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-gray-500 text-xs font-semibold uppercase">
              <th className="p-4">Question</th>
              <th className="p-4">Category</th>
              <th className="p-4">Order</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200/60">
            {faqs.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-gray-400">No FAQ items found.</td>
              </tr>
            ) : (
              faqs.map((f: any) => (
                <tr key={f._id} className="hover:bg-white/25 transition">
                  <td className="p-4 font-semibold text-white max-w-xs truncate">{f.question}</td>
                  <td className="p-4 text-gray-500 capitalize">{f.category}</td>
                  <td className="p-4 text-gray-500">{f.sortOrder}</td>
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
