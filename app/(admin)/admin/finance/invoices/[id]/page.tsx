/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import Link from "next/link";
import { invoiceRepository } from "../../../../../../repositories/invoice.repository";
import { paymentRepository } from "../../../../../../repositories/payment.repository";
import { receiptRepository } from "../../../../../../repositories/receipt.repository";
import { refundRepository } from "../../../../../../repositories/refund.repository";
import { financeTimelineRepository } from "../../../../../../repositories/finance-timeline.repository";
import { connectDB } from "../../../../../../config/db";
import InvoiceDetailClient from "../../../../../../components/workspace/InvoiceDetailClient";

interface InvoiceDetailPageProps {
  params: Promise<{ id: string }>;
}

export const revalidate = 0;

export default async function InvoiceDetailPage({ params }: InvoiceDetailPageProps) {
  await connectDB();
  const { id } = await params;

  const invoice = await invoiceRepository.findById(id, {
    populate: ["student", "course"],
  });

  if (!invoice) {
    return (
      <div className="py-20 text-center text-slate-500">
        Invoice not found.{" "}
        <Link href="/admin/finance" className="text-indigo-600 underline font-semibold">
          Return to Finance
        </Link>
      </div>
    );
  }

  // Load payments, receipts, refunds, timeline logs
  const payments = await paymentRepository.findMany({ invoice: id });
  const receipts = await receiptRepository.findMany({ invoice: id });
  const refunds = await refundRepository.findMany({ invoice: id });
  const timeline = await financeTimelineRepository.findMany(
    { referenceId: id },
    { sort: "timestamp", order: "desc" } as any
  );

  const studentObj = invoice.student as any;
  const courseObj = invoice.course as any;

  const serializedInvoice = {
    _id: invoice._id?.toString(),
    invoiceNumber: invoice.invoiceNumber,
    studentName: studentObj ? `${studentObj.firstName} ${studentObj.lastName}` : "Student Profile",
    studentEmail: studentObj?.email || "student@lmsca-edu.com",
    courseName: courseObj?.name || "Academic Program",
    baseAmount: invoice.baseAmount,
    taxAmount: invoice.taxAmount,
    discountAmount: invoice.discountAmount,
    scholarshipAmount: invoice.scholarshipAmount,
    totalAmount: invoice.totalAmount,
    outstandingAmount: invoice.outstandingAmount,
    status: invoice.status,
    issueDate: new Date(invoice.issueDate).toLocaleDateString(),
    dueDate: new Date(invoice.dueDate).toLocaleDateString(),
    gateway: (invoice as any).gateway || "Stripe",
  };

  return (
    <InvoiceDetailClient
      invoice={serializedInvoice}
      payments={JSON.parse(JSON.stringify(payments))}
      receipts={JSON.parse(JSON.stringify(receipts))}
      refunds={JSON.parse(JSON.stringify(refunds))}
      timeline={JSON.parse(JSON.stringify(timeline))}
    />
  );
}
