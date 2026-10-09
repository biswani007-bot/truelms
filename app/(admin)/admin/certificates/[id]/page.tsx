/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { certificateRepository } from "@/repositories/certificate.repository";
import { certificateVerificationRepository } from "@/repositories/certificate-verification.repository";
import { certificateTimelineRepository } from "@/repositories/certificate-timeline.repository";
import { connectDB } from "@/config/db";
import CertificateEditorWorkstation from "@/components/certificates/CertificateEditorWorkstation";

import "@/models/user.model";
import "@/models/course.model";
import "@/models/batch.model";
import "@/models/certificate-template.model";

interface CertificateDetailPageProps {
  params: Promise<{ id: string }>;
}

export const revalidate = 0;

export default async function CertificateDetailPage({ params }: CertificateDetailPageProps) {
  await connectDB();
  const { id } = await params;

  const certificate = await certificateRepository.findById(id, {
    populate: ["student", "course", "batch", "template"],
  });

  if (!certificate) {
    return (
      <div className="py-20 text-center text-slate-500">
        <h2 className="text-lg font-bold text-slate-800">Certificate Not Found</h2>
        <p className="text-xs text-slate-400 mt-1">This credential profile does not exist or has been removed.</p>
        <Link
          href="/admin/certificates"
          className="mt-4 inline-block px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold"
        >
          Return to Ledger
        </Link>
      </div>
    );
  }

  // Load verification checks and timeline
  const verifications = await certificateVerificationRepository.findMany({ certificate: id });
  const timeline = await certificateTimelineRepository.findMany(
    { certificate: id },
    { sort: "timestamp", order: "desc" } as any
  );

  // Convert Mongoose documents to plain JSON for client component serialization
  const serializedCert = JSON.parse(JSON.stringify(certificate));
  const serializedVerifications = JSON.parse(JSON.stringify(verifications));
  const serializedTimeline = JSON.parse(JSON.stringify(timeline));

  return (
    <CertificateEditorWorkstation
      initialCertificate={serializedCert}
      verifications={serializedVerifications}
      timeline={serializedTimeline}
    />
  );
}
