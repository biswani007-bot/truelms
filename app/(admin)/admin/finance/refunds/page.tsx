/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { refundRepository } from "../../../../../repositories/refund.repository";
import { connectDB } from "../../../../../config/db";
import RefundsClient from "../../../../../components/workspace/RefundsClient";

export const revalidate = 0;

export default async function RefundsPage() {
  await connectDB();

  const refunds = await refundRepository.findMany({}, { populate: ["invoice", "payment"] });

  const serializedRefunds = refunds.map((ref) => {
    const invoiceObj = ref.invoice as any;
    return {
      _id: ref._id?.toString(),
      refundNumber: ref.refundNumber,
      invoiceNumber: invoiceObj?.invoiceNumber || "—",
      studentName: invoiceObj?.studentName || "Student Profile",
      reason: ref.reason || "Tuition Fee Reversal",
      refundDate: new Date(ref.refundDate).toLocaleDateString(),
      amount: ref.amount,
      currency: "USD",
      gateway: "Stripe",
      status: ref.status || "pending",
    };
  });

  return <RefundsClient initialRefunds={serializedRefunds} />;
}
