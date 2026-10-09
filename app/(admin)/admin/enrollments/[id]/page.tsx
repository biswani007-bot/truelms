/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { enrollmentRepository } from "../../../../../repositories/enrollment.repository";
import { enrollmentChecklistRepository } from "../../../../../repositories/enrollment-checklist.repository";
import { admissionOfferRepository } from "../../../../../repositories/admission-offer.repository";
import { enrollmentTimelineRepository } from "../../../../../repositories/enrollment-timeline.repository";
import { invoiceRepository } from "../../../../../repositories/invoice.repository";
import { leadRepository } from "../../../../../repositories/lead.repository";
import { connectDB } from "../../../../../config/db";
import Link from "next/link";

interface EnrollmentDetailsPageProps {
  params: Promise<{ id: string }>;
}

export const revalidate = 0; // Fresh details each time

export default async function EnrollmentDetailsPage({ params }: EnrollmentDetailsPageProps) {
  await connectDB();
  const { id } = await params;

  const enr = await enrollmentRepository.findById(id, { populate: ["student", "course", "admissionCounselor", "lead"] });
  if (!enr) {
    return (
      <div className="py-20 text-center text-gray-500">
        Enrollment record not found. <Link href="/admin/enrollments" className="text-indigo-600 underline">Back to Engine</Link>
      </div>
    );
  }

  // Load sub-documents and related records
  const checklist = await enrollmentChecklistRepository.findOne({ enrollment: id });
  const offer = await admissionOfferRepository.findOne({ enrollment: id });
  const timeline = await enrollmentTimelineRepository.findMany({ enrollment: id }, { sort: "timestamp", order: "desc" } as any);
  const invoice = await invoiceRepository.findOne({ enrollment: id });

  // Resolve Student & Guardian Details
  const student = enr.student as any;
  const course = enr.course as any;
  const lead = (enr.lead as any) || (enr.student ? await leadRepository.findOne({ email: (student as any)?.phone ? undefined : undefined }) : null);

  const { StudentGuardian } = await import("@/models/student-guardian.model");
  const guardian = student?._id ? await StudentGuardian.findOne({ student: student._id }) : null;

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-gray-200 p-6 rounded-2xl shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-gray-900">
              Enrollment #{enr.enrollmentNumber}
            </h1>
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              enr.status === "waiting-payment"
                ? "bg-amber-50 text-amber-700 border border-amber-200"
                : enr.status === "confirmed" || enr.status === "batch-assigned"
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-indigo-50 text-indigo-700 border border-indigo-200"
            }`}>
              {enr.status}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Program: <strong className="text-gray-800">{course?.courseName || course?.name || "Program"}</strong> ({course?.courseCode || "N/A"}) &bull; Session: {enr.academicSession}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/admin/enrollments/${id}/edit`}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs transition shadow-xs"
          >
            Edit Enrollment
          </Link>
          <Link
            href="/admin/enrollments"
            className="px-4 py-2 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-xl text-xs transition shadow-xs"
          >
            Back to Enrollments
          </Link>
        </div>
      </div>

      {/* Main details and workflows layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 columns: Student, Program, Invoice, Guardian, Checklist */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          {/* Learner & Guardian Identity Card */}
          <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-xs space-y-4">
            <h2 className="text-base font-bold text-gray-900 border-b pb-2">Student &amp; Guardian Profile</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="block font-bold text-gray-400 uppercase tracking-wider">Enrolled Student</span>
                <span className="text-gray-900 font-bold text-sm mt-1 block">
                  {student ? `${student.firstName} ${student.lastName}` : "Archived Student"}
                </span>
                <span className="text-gray-500 font-mono text-[11px]">ID: {student?.studentId || "N/A"}</span>
              </div>
              <div>
                <span className="block font-bold text-gray-400 uppercase tracking-wider">Parent / Guardian</span>
                <span className="text-gray-900 font-semibold text-sm mt-1 block">
                  {guardian?.guardianName || (enr.lead as any)?.fullName || "N/A"}
                </span>
                <span className="text-gray-500 text-[11px]">{guardian?.guardianEmail || (enr.lead as any)?.email || "N/A"} &bull; {guardian?.guardianPhone || (enr.lead as any)?.phone || ""}</span>
              </div>
              <div>
                <span className="block font-bold text-gray-400 uppercase tracking-wider">Registration Reference</span>
                <span className="text-gray-800 font-mono mt-1 block">{student?.registrationNumber || "N/A"}</span>
              </div>
              <div>
                <span className="block font-bold text-gray-400 uppercase tracking-wider">Lead Source File</span>
                <span className="text-indigo-600 font-bold mt-1 block">
                  {(enr.lead as any)?.leadId ? (
                    <Link href={`/admin/crm/leads/${(enr.lead as any)._id}`} className="hover:underline">
                      CRM Lead #{(enr.lead as any).leadId} ({(enr.lead as any).fullName})
                    </Link>
                  ) : "Direct Application"}
                </span>
              </div>
            </div>
          </div>

          {/* Authoritative Invoice & Payment Linkage */}
          <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-xs space-y-4">
            <h2 className="text-base font-bold text-gray-900 border-b pb-2">Authoritative Invoice &amp; Financials</h2>
            {invoice ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="block font-bold text-gray-400 uppercase tracking-wider">Invoice #</span>
                  <span className="text-indigo-600 font-mono font-bold text-sm mt-1 block">{invoice.invoiceNumber}</span>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="block font-bold text-gray-400 uppercase tracking-wider">Total Amount</span>
                  <span className="text-gray-900 font-extrabold text-sm mt-1 block">${(invoice.totalAmount / 100).toFixed(2)} USD</span>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="block font-bold text-gray-400 uppercase tracking-wider">Payment Status</span>
                  <span className={`inline-flex px-2 py-0.5 mt-1 rounded text-[11px] font-bold uppercase ${
                    invoice.status === "paid" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                  }`}>
                    {invoice.status}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-500">No invoice generated for this enrollment yet.</p>
            )}
          </div>

          {/* Verification Checklists */}
          <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-xs">
            <h2 className="text-base font-bold text-gray-900 mb-4 border-b pb-2">Verification Checklists</h2>
            <div className="flex flex-col gap-3">
              {checklist?.items.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 border border-gray-100 rounded-xl text-xs">
                  <span className="font-semibold text-gray-700">{item.name}</span>
                  <span className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                    item.status === "completed" ? "bg-emerald-100 text-emerald-700 border border-emerald-200" : "bg-white text-gray-500 border border-gray-200"
                  }`}>
                    {item.status}
                  </span>
                </div>
              ))}
              {(!checklist || checklist.items.length === 0) && (
                <div className="text-gray-400 text-xs py-4 text-center">No checklist items mapped.</div>
              )}
            </div>
          </div>

          {/* Offer Details */}
          {offer && (
            <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-xs">
              <h2 className="text-base font-bold text-gray-900 mb-4 border-b pb-2">Official Admission Offer</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="block font-bold text-gray-400 uppercase tracking-wider">Offer Number</span>
                  <span className="text-gray-900 font-medium mt-0.5 block">{offer.offerNumber}</span>
                </div>
                <div>
                  <span className="block font-bold text-gray-400 uppercase tracking-wider">Expiry Date</span>
                  <span className="text-gray-900 font-medium mt-0.5 block">{new Date(offer.expiryDate).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="block font-bold text-gray-400 uppercase tracking-wider">Discount Offered</span>
                  <span className="text-gray-900 font-medium mt-0.5 block">{offer.discountValue}%</span>
                </div>
                <div>
                  <span className="block font-bold text-gray-400 uppercase tracking-wider">Offer Status</span>
                  <span className="text-gray-900 capitalize font-medium mt-0.5 block">{offer.status}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Timeline updates */}
        <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-xs h-fit">
          <h2 className="text-base font-bold text-gray-900 mb-4 border-b pb-2">Workflow Steps</h2>
          <div className="flex flex-col gap-4 border-l-2 border-indigo-200 pl-4 ml-2">
            {timeline.map((item) => (
              <div key={item._id?.toString()} className="relative text-xs">
                <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-indigo-600 border-2 border-white shadow-xs"></div>
                <div className="font-bold text-gray-700 capitalize">{item.event}</div>
                <div className="text-gray-500 mt-0.5">{item.description}</div>
                <div className="text-gray-400 mt-1 text-[10px]">{new Date(item.timestamp).toLocaleDateString()}</div>
              </div>
            ))}
            {timeline.length === 0 && (
              <div className="text-gray-400 text-xs py-2">No workflow events logged yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
