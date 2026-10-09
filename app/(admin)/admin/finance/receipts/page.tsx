/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import Link from "next/link";
import { receiptRepository } from "../../../../../repositories/receipt.repository";
import { connectDB } from "../../../../../config/db";

export const revalidate = 0;

export default async function ReceiptsPage() {
  await connectDB();

  const receipts = await receiptRepository.findMany({}, { populate: ["invoice", "payment"] });

  const totalIssued = receipts.reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="flex flex-col gap-10">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Receipts Vault</h1>
          <p className="text-sm text-gray-500 mt-1">
            Digital receipt metadata generated for every successful payment.
          </p>
        </div>
        <Link
          href="/admin/finance"
          className="px-4 py-2 border border-gray-200 text-gray-600 hover:bg-white hover:text-white rounded-lg text-sm transition"
        >
          ← Finance Home
        </Link>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Total Receipts", val: receipts.length, color: "text-indigo-600" },
          { label: "Total Issued Amount", val: `$${(totalIssued / 100).toFixed(2)}`, color: "text-emerald-600" },
          { label: "Tax Collected", val: `$${(receipts.reduce((s, r) => s + r.taxes, 0) / 100).toFixed(2)}`, color: "text-amber-700" },
        ].map((kpi, idx) => (
          <div key={idx} className="bg-gray-50 border border-gray-200 p-6 rounded-2xl">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{kpi.label}</div>
            <div className={`text-2xl font-black mt-2 ${kpi.color}`}>{kpi.val}</div>
          </div>
        ))}
      </div>

      {/* Receipts Table */}
      <div className="bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-base font-bold text-gray-900">Receipt Manifest</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-xs text-gray-400 uppercase tracking-wider">
                <th className="text-left px-6 py-3">Receipt No</th>
                <th className="text-left px-6 py-3">Invoice</th>
                <th className="text-left px-6 py-3">Payment Ref</th>
                <th className="text-left px-6 py-3">Issue Date</th>
                <th className="text-left px-6 py-3">Taxes</th>
                <th className="text-left px-6 py-3">Amount</th>
              </tr>
            </thead>
            <tbody>
              {receipts.map((rcp) => {
                const invoiceObj = rcp.invoice as any;
                const paymentObj = rcp.payment as any;
                return (
                  <tr key={rcp._id?.toString()} className="border-b border-slate-850 hover:bg-white transition">
                    <td className="px-6 py-4 font-mono text-xs text-indigo-600">{rcp.receiptNumber}</td>
                    <td className="px-6 py-4 text-gray-500 text-xs font-mono">
                      {invoiceObj?.invoiceNumber || "—"}
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs font-mono">
                      {paymentObj?.paymentNumber || "—"}
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs">{new Date(rcp.issueDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-gray-500 font-mono text-xs">${(rcp.taxes / 100).toFixed(2)}</td>
                    <td className="px-6 py-4 text-white font-mono font-semibold text-xs">
                      ${(rcp.amount / 100).toFixed(2)}
                    </td>
                  </tr>
                );
              })}
              {receipts.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-550 text-xs">No receipts issued yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
