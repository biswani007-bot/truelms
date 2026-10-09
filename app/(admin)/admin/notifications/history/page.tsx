/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import Link from "next/link";
import { notificationDeliveryRepository } from "../../../../../repositories/notification-delivery.repository";
import { connectDB } from "../../../../../config/db";

export const revalidate = 0;

export default async function DeliveryHistoryPage() {
  await connectDB();

  const deliveries = await notificationDeliveryRepository.findMany(
    {},
    { populate: ["recipient", "queueItem"], sort: "deliveredAt", order: "desc" } as any
  );

  return (
    <div className="flex flex-col gap-10">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Delivery History</h1>
          <p className="text-sm text-gray-500 mt-1">
            Complete trace of all processed notifications across dynamic channels.
          </p>
        </div>
        <Link
          href="/admin/notifications"
          className="px-4 py-2 border border-gray-200 text-gray-600 hover:bg-white hover:text-white rounded-lg text-sm transition"
        >
          ← Dashboard Home
        </Link>
      </div>

      {/* Deliveries Ledger */}
      <div className="bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-base font-bold text-gray-900">Historical logs</h2>
          <span className="text-xs text-gray-400">{deliveries.length} entries</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-xs text-gray-400 uppercase tracking-wider">
                <th className="text-left px-6 py-3">Recipient</th>
                <th className="text-left px-6 py-3">Channel</th>
                <th className="text-left px-6 py-3">Status</th>
                <th className="text-left px-6 py-3">Delivered At</th>
                <th className="text-left px-6 py-3">Error Info</th>
              </tr>
            </thead>
            <tbody>
              {deliveries.map((item) => {
                const recObj = item.recipient as any;
                return (
                  <tr key={item._id?.toString()} className="border-b border-slate-850 hover:bg-white transition">
                    <td className="px-6 py-4">
                      <div className="text-white text-xs font-semibold">
                        {recObj ? `${recObj.firstName} ${recObj.lastName}` : "User"}
                      </div>
                      <div className="text-[10px] text-gray-400 font-mono mt-0.5">{recObj?.email}</div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs uppercase text-gray-500">{item.channel}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                        item.status === "success" ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-red-950 text-red-400 border-red-500/20"
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs">
                      {new Date(item.deliveredAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-gray-400 font-mono text-xs max-w-xs truncate">
                      {item.errorMessage || "—"}
                    </td>
                  </tr>
                );
              })}
              {deliveries.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-550 text-xs">No delivery history records logged.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
