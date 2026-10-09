/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import Link from "next/link";
import { apiClientRepository } from "../../../../repositories/api-client.repository";
import { apiUsageRepository } from "../../../../repositories/api-usage.repository";
import { webhookDeliveryRepository } from "../../../../repositories/webhook-delivery.repository";
import { apiAuditLogRepository } from "../../../../repositories/api-audit-log.repository";
import { connectDB } from "../../../../config/db";

export const revalidate = 0;

export default async function ApiGatewayDashboardPage() {
  await connectDB();

  const [clients, usages, deliveries, audits] = await Promise.all([
    apiClientRepository.findMany({}),
    apiUsageRepository.findMany({}),
    webhookDeliveryRepository.findMany({}),
    apiAuditLogRepository.findMany({}),
  ]);

  const activeClients = clients.filter(c => c.status === "active").length;
  const requestsToday = usages.length;
  const auditLogsCount = audits.length;

  const successfulDeliveries = deliveries.filter(d => d.status === "delivered").length;
  const totalDeliveries = deliveries.length;
  const webhookSuccessRate = totalDeliveries > 0
    ? Math.round((successfulDeliveries / totalDeliveries) * 100)
    : 100;

  const avgLatency = requestsToday > 0
    ? Math.round(usages.reduce((sum, u) => sum + (u.durationMs || 0), 0) / requestsToday)
    : 0;

  const rateLimitViolations = audits.filter(a => a.status === "rate-limited").length;

  // Group top consumers
  const consumerCounts: Record<string, number> = {};
  for (const item of usages) {
    const cid = item.apiClient?.toString() || "System";
    consumerCounts[cid] = (consumerCounts[cid] || 0) + 1;
  }

  return (
    <div className="flex flex-col gap-10">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">API Access</h1>
          <p className="text-sm text-gray-500 mt-1">
            Orchestrate third-party access, manage tokens, audit logs, and monitor webhooks dispatch telemetry.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/gateway/clients"
            className="px-4 py-2 bg-indigo-650 text-white hover:bg-indigo-600 rounded-lg text-sm font-semibold transition"
          >
            API Clients & Keys
          </Link>
          <Link
            href="/admin/gateway/webhooks"
            className="px-4 py-2 border border-gray-200 text-slate-355 hover:bg-white hover:text-white rounded-lg text-sm transition"
          >
            Webhook Registry
          </Link>
          <Link
            href="/admin/gateway/logs"
            className="px-4 py-2 border border-gray-200 text-slate-355 hover:bg-white hover:text-white rounded-lg text-sm transition"
          >
            Audit Logs
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: "Requests Today", val: requestsToday, sub: "Gateway requests processed", color: "text-indigo-600" },
          { label: "Active API Clients", val: activeClients, sub: "Authorized external callers", color: "text-emerald-600" },
          { label: "Webhook Success Rate", val: `${webhookSuccessRate}%`, sub: `${successfulDeliveries}/${totalDeliveries} delivered`, color: "text-teal-400" },
          { label: "Average Latency", val: `${avgLatency}ms`, sub: "Gateway overhead routing delay", color: "text-amber-700" },
        ].map((kpi, idx) => (
          <div key={idx} className="bg-gray-50 border border-gray-200 p-6 rounded-2xl">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{kpi.label}</div>
            <div className="text-2xl font-black mt-2 text-white">{kpi.val}</div>
            <div className="text-[11px] text-slate-655 mt-1">{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Top API Consumers */}
        <div className="lg:col-span-2 bg-gray-50 border border-gray-200 rounded-2xl p-6">
          <h2 className="text-base font-bold text-gray-900 mb-4">Top API Consumers</h2>
          <div className="flex flex-col gap-3">
            {Object.entries(consumerCounts)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5)
              .map(([clientId, count], idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-slate-850">
                  <span className="text-xs font-mono text-gray-600">Client ID: {clientId}</span>
                  <span className="text-xs font-bold text-indigo-600">{count} calls</span>
                </div>
              ))}
            {Object.keys(consumerCounts).length === 0 && (
              <span className="text-xs text-gray-500">No telemetry usage logged today.</span>
            )}
          </div>
        </div>

        {/* Security & Rate Limiting Overview */}
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 flex flex-col gap-4">
          <h2 className="text-base font-bold text-gray-900">Security Ledger</h2>
          <div className="flex flex-col gap-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Total Security Audits</span>
              <span className="text-white font-mono">{auditLogsCount}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Rate Limit Blocked Calls</span>
              <span className="text-red-450 font-mono font-bold">{rateLimitViolations}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Active API Keys</span>
              <span className="text-emerald-450 font-mono">Yes</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
