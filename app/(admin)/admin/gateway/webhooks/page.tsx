/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import Link from "next/link";
import { webhookRepository } from "../../../../../repositories/webhook.repository";
import { webhookDeliveryRepository } from "../../../../../repositories/webhook-delivery.repository";
import { connectDB } from "../../../../../config/db";

export const revalidate = 0;

export default async function WebhooksPage() {
  await connectDB();

  const [webhooks, deliveries] = await Promise.all([
    webhookRepository.findMany({}, { populate: ["apiClient"] } as any),
    webhookDeliveryRepository.findMany({}, { populate: ["webhook", "webhookEvent"], sort: "timestamp", order: "desc" } as any),
  ]);

  return (
    <div className="flex flex-col gap-10">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Webhook Registry</h1>
          <p className="text-sm text-gray-500 mt-1">
            Configure target HTTP endpoints to consume internal business events payload models.
          </p>
        </div>
        <Link
          href="/admin/gateway"
          className="px-4 py-2 border border-gray-200 text-slate-355 hover:bg-white hover:text-white rounded-lg text-sm transition"
        >
          ← Gateway Home
        </Link>
      </div>

      {/* Registry Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Subscriptions registry list */}
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 flex flex-col gap-4">
          <h2 className="text-sm font-bold text-gray-900">Registered Webhooks</h2>
          <div className="flex flex-col gap-3">
            {webhooks.map((item) => {
              const clientObj = item.apiClient as any;
              return (
                <div key={item._id?.toString()} className="p-4 bg-gray-50 rounded-xl border border-slate-850 flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-semibold text-white">{clientObj?.name || "Client Webhook"}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                      item.isActive ? "bg-emerald-50 text-emerald-600 border border-emerald-500/10" : "bg-red-950 text-red-400"
                    }`}>
                      {item.isActive ? "Active" : "Paused"}
                    </span>
                  </div>
                  <div className="text-[10px] text-indigo-600 font-mono break-all">{item.targetUrl}</div>

                  <div className="border-t border-slate-850 pt-2 mt-2">
                    <span className="text-[9px] text-slate-550 uppercase tracking-wider">Subscribed Events:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {item.subscribedEvents.map((ev, i) => (
                        <span key={i} className="px-1 py-0.5 rounded text-[8px] bg-white text-gray-500 border border-gray-200 font-mono">
                          {ev}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
            {webhooks.length === 0 && (
              <span className="text-xs text-slate-550">No webhook target routes configured.</span>
            )}
          </div>
        </div>

        {/* Deliveries Ledger */}
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 flex flex-col gap-4">
          <h2 className="text-sm font-bold text-gray-900">Delivery Runs History</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-850 text-slate-550">
                  <th className="py-2">Event</th>
                  <th className="py-2">Response</th>
                  <th className="py-2">Attempt</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {deliveries.slice(0, 8).map((item) => {
                  const eventObj = item.webhookEvent as any;
                  return (
                    <tr key={item._id?.toString()} className="border-b border-slate-850 hover:bg-white">
                      <td className="py-3 text-gray-600 font-semibold">{eventObj?.eventName || "Event"}</td>
                      <td className="py-3 text-gray-500">{item.responseStatusCode || "—"}</td>
                      <td className="py-3 text-gray-400">#{item.attemptNumber}</td>
                      <td className="py-3">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                          item.status === "delivered" ? "bg-emerald-50 text-emerald-600" :
                          item.status === "failed" ? "bg-red-950 text-red-400" :
                          "bg-white text-slate-550"
                        }`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
