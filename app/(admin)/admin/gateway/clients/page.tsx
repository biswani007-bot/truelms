/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import Link from "next/link";
import { apiClientRepository } from "../../../../../repositories/api-client.repository";
import { apiKeyRepository } from "../../../../../repositories/api-key.repository";
import { connectDB } from "../../../../../config/db";

export const revalidate = 0;

export default async function GatewayClientsPage() {
  await connectDB();

  const [clients, keys] = await Promise.all([
    apiClientRepository.findMany({}),
    apiKeyRepository.findMany({}, { populate: ["apiClient"] } as any),
  ]);

  return (
    <div className="flex flex-col gap-10">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">API Clients & Keys</h1>
          <p className="text-sm text-gray-500 mt-1">
            Registered external clients and active security keys list.
          </p>
        </div>
        <Link
          href="/admin/gateway"
          className="px-4 py-2 border border-gray-200 text-slate-355 hover:bg-white hover:text-white rounded-lg text-sm transition"
        >
          ← Gateway Home
        </Link>
      </div>

      {/* Clients & Tokens Table */}
      <div className="bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-base font-bold text-gray-900">Authorized API Keys</h2>
          <span className="text-xs text-gray-400">{keys.length} tokens active</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-xs text-gray-400 uppercase tracking-wider">
                <th className="text-left px-6 py-3">API Client</th>
                <th className="text-left px-6 py-3">Key ID</th>
                <th className="text-left px-6 py-3">Scopes Granted</th>
                <th className="text-left px-6 py-3">IP Constraints</th>
                <th className="text-left px-6 py-3">Expires At</th>
                <th className="text-left px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {keys.map((item: any) => {
                const clientObj = item.apiClient as any;
                return (
                  <tr key={item._id?.toString()} className="border-b border-slate-850 hover:bg-white transition">
                    <td className="px-6 py-4">
                      <div className="text-white text-xs font-semibold">{clientObj?.name || "System Client"}</div>
                      <div className="text-[10px] text-gray-400 mt-0.5">{clientObj?.contactEmail}</div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-indigo-600">{item.keyId}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {item.scopes.map((scope: string, i: number) => (
                          <span key={i} className="px-1 py-0.5 rounded text-[9px] font-bold uppercase bg-white text-gray-500 border border-gray-200">
                            {scope}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-gray-500">
                      {item.allowedIps && item.allowedIps.length > 0 ? item.allowedIps.join(", ") : "Any IP (*)"}
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs">
                      {new Date(item.expiresAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                        item.status === "active" ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
                        "bg-red-950 text-red-400 border-red-500/20"
                      }`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {keys.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-550 text-xs font-mono">No API tokens configured.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
