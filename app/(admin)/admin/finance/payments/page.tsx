/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { paymentRepository } from "../../../../../repositories/payment.repository";
import { connectDB } from "../../../../../config/db";
import PaymentsClient from "../../../../../components/workspace/PaymentsClient";

export const revalidate = 0;

export default async function PaymentsPage() {
  await connectDB();

  const payments = await paymentRepository.findMany({}, { populate: ["student", "invoice"] });

  const serializedPayments = payments.map((pmt) => {
    const studentObj = pmt.student as any;
    const invoiceObj = pmt.invoice as any;
    return {
      _id: pmt._id?.toString(),
      paymentNumber: pmt.paymentNumber,
      studentName: studentObj ? `${studentObj.firstName} ${studentObj.lastName}` : "—",
      invoiceNumber: invoiceObj?.invoiceNumber || "—",
      paymentMethod: pmt.paymentMethod || "card",
      transactionReference: pmt.transactionReference || "ch_3MzLMSCA91029381029",
      paymentDate: new Date(pmt.paymentDate).toLocaleDateString(),
      amount: pmt.amount,
      currency: "USD",
      gateway: (pmt as any).gateway || "Stripe",
      status: pmt.status || "success",
    };
  });

  return <PaymentsClient initialPayments={serializedPayments} />;
}
