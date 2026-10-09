import React from "react";
import Link from "next/link";
import { CheckCircle, XCircle, Award } from "lucide-react";
import { certificateRepository } from "../../../../repositories/certificate.repository";
import { certificateVerificationRepository } from "../../../../repositories/certificate-verification.repository";
import { connectDB } from "../../../../config/db";
import { headers } from "next/headers";

interface VerifyPageProps {
  params: Promise<{ id: string }>;
}

export const revalidate = 0;

export default async function CertificateVerificationPage({ params }: VerifyPageProps) {
  await connectDB();
  const { id } = await params; // id can be verificationCode or certificateNumber
  const reqHeaders = await headers();

  const certificate = await certificateRepository.findOne({
    $or: [{ verificationCode: id }, { certificateNumber: id }]
  }, {
    populate: ["student", "course"],
  });

  // Log Verification Attempt
  if (certificate) {
    await certificateVerificationRepository.create({
      certificate: certificate._id,
      verifiedAt: new Date(),
      ipAddress: reqHeaders.get("x-forwarded-for") || reqHeaders.get("x-real-ip") || "127.0.0.1",
      browserInfo: reqHeaders.get("user-agent") || "Unknown Client",
      status: certificate.status === "issued" ? "success" : "failed",
      metadata: { requestedId: id }
    } as any);
  }

  const isValid = certificate && certificate.status === "issued";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-6">
      <div className="max-w-xl w-full bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden relative">
        <div className={`h-2 w-full ${isValid ? "bg-emerald-500" : "bg-red-500"}`}></div>
        
        <div className="p-8 sm:p-12 text-center">
          <div className="flex justify-center mb-6">
            {isValid ? (
              <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center border-4 border-emerald-100">
                <CheckCircle className="size-10 text-emerald-600" />
              </div>
            ) : (
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center border-4 border-red-100">
                <XCircle className="size-10 text-red-600" />
              </div>
            )}
          </div>
          
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2">
            {isValid ? "Credential Verified" : "Verification Failed"}
          </h1>
          <p className="text-slate-500 text-sm mb-8 max-w-md mx-auto">
            {isValid 
              ? "This certificate is officially issued and recognized by TrueLern." 
              : "We could not find a valid issued certificate matching this identifier. It may have been revoked, expired, or never existed."}
          </p>

          {isValid && certificate && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-left space-y-4">
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Learner Name</p>
                <p className="text-sm font-semibold text-slate-900 mt-1 capitalize">
                  {certificate.student ? `${(certificate.student as any).firstName} ${(certificate.student as any).lastName}` : "Student Profile"}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Program / Course</p>
                <p className="text-sm font-semibold text-slate-900 mt-1">
                  {certificate.course ? (certificate.course as any).name : "Program"}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Issue Date</p>
                  <p className="text-sm font-semibold text-slate-900 mt-1">
                    {new Date(certificate.issueDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Certificate Number</p>
                  <p className="text-sm font-semibold text-slate-900 mt-1 font-mono">
                    {certificate.certificateNumber}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-center gap-2">
            <Award className="size-5 text-indigo-600" />
            <span className="font-bold text-slate-900">TrueLern</span>
            <span className="text-slate-400">|</span>
            <span className="text-slate-500 text-sm">Official Credentials</span>
          </div>
        </div>
      </div>
      
      <Link href="/" className="mt-8 text-sm font-semibold text-slate-500 hover:text-indigo-600 transition">
        Return to TrueLern
      </Link>
    </div>
  );
}
