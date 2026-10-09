"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Lock,
  Save,
  CheckCircle2,
  Download,
  ExternalLink,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Clock,
  ChevronLeft,
  FileText,
  User,
  GraduationCap,
  Calendar,
  Layers,
  Edit3,
} from "lucide-react";
import { EnterpriseDialog } from "@/components/ui/dialogs/EnterpriseDialog";
import { useToast } from "@/components/ui/dialogs/ToastProvider";
import CertificatePdfPreview from "./CertificatePdfPreview";

interface WorkstationProps {
  initialCertificate: any;
  verifications: any[];
  timeline: any[];
}

export default function CertificateEditorWorkstation({
  initialCertificate,
  verifications,
  timeline,
}: WorkstationProps) {
  const router = useRouter();
  const toast = useToast();

  const [cert, setCert] = useState<any>(initialCertificate);
  const [refreshKey, setRefreshKey] = useState(0);

  // Editable presentation fields
  const [customization, setCustomization] = useState<any>({
    title: cert.customization?.title || "Certificate of Achievement",
    subtitle: cert.customization?.subtitle || "This credential is proudly conferred upon",
    courseDisplayName: cert.customization?.courseDisplayName || cert.course?.name || cert.course?.courseName || "",
    achievementWording:
      cert.customization?.achievementWording ||
      "for successfully completing the prescribed curriculum, assessments, and academic milestones in",
    instructorDisplayName: cert.customization?.instructorDisplayName || "",
    instructorTitle: cert.customization?.instructorTitle || "Course Lead Faculty",
    signatoryDisplayName: cert.customization?.signatoryDisplayName || "",
    signatoryTitle: cert.customization?.signatoryTitle || "Academic Director",
    institutionName: cert.customization?.institutionName || "TrueLern Academy",
    footerWording:
      cert.customization?.footerWording ||
      "TrueLern Academy • Learn • Grow • Lead • Cryptographically Secure Credential",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isIssuing, setIsIssuing] = useState(false);
  const [showIssueConfirm, setShowIssueConfirm] = useState(false);

  // Revise & Reissue Dialog State
  const [showReviseDialog, setShowReviseDialog] = useState(false);
  const [revisionReason, setRevisionReason] = useState("");
  const [isRevising, setIsRevising] = useState(false);

  const isDraft = cert.status === "draft";
  const isIssued = cert.status === "issued";
  const isRevoked = cert.status === "revoked";

  // Handle Save Presentation Changes
  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/certificates/${cert._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customization,
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        setCert(data.data);
        setRefreshKey((prev) => prev + 1); // Trigger instant PDF preview reload
        toast.success(
          "Presentation Changes Saved",
          "Certificate preview updated with customized presentation fields."
        );
      } else {
        toast.error("Save Failed", data.message || "Failed to update presentation fields.");
      }
    } catch {
      toast.error("Network Error", "Unable to save presentation modifications.");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Issue Certificate
  const handleIssueConfirm = async () => {
    setIsIssuing(true);
    setShowIssueConfirm(false);
    try {
      // First ensure any pending presentation edits are saved
      await fetch(`/api/certificates/${cert._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customization }),
      });

      // Call authoritative issue endpoint
      const res = await fetch(`/api/certificates/${cert._id}/issue`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      if (data.success && data.data) {
        setCert(data.data);
        setRefreshKey((prev) => prev + 1);
        toast.success(
          "Certificate Officially Issued",
          "Credential has been approved, sealed, and is now verifiable."
        );
        router.refresh();
      } else {
        toast.error("Issuance Denied", data.message || "Criteria not satisfied for issuance.");
      }
    } catch {
      toast.error("Network Error", "Failed to connect to issuance service.");
    } finally {
      setIsIssuing(false);
    }
  };

  // Handle Revise & Reissue
  const handleReviseConfirm = async () => {
    if (!revisionReason.trim()) {
      toast.error("Validation Error", "Please provide a reason for revising this certificate.");
      return;
    }

    setIsRevising(true);
    try {
      const res = await fetch(`/api/certificates/${cert._id}/revise`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: revisionReason.trim(),
          customization,
        }),
      });

      const data = await res.json();
      if (data.success && data.data?._id) {
        setShowReviseDialog(false);
        toast.success(
          "Revision Draft Created",
          "Historical certificate preserved. Proceeding to review new revision."
        );
        router.push(`/admin/certificates/${data.data._id}`);
      } else {
        toast.error("Revision Failed", data.message || "Failed to create revision draft.");
      }
    } catch {
      toast.error("Network Error", "Failed to connect to server.");
    } finally {
      setIsRevising(false);
    }
  };

  const studentObj = cert.student || {};
  const courseObj = cert.course || {};
  const batchObj = cert.batch || {};

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto py-2">
      {/* Top Header & Action Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-200">
        <div>
          <Link
            href="/admin/certificates"
            className="text-xs font-bold text-slate-500 hover:text-indigo-600 transition flex items-center gap-1 mb-2"
          >
            <ChevronLeft className="size-3.5" /> Back to Certificate Ledger
          </Link>

          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-slate-900">
              {studentObj.firstName ? `${studentObj.firstName} ${studentObj.lastName}` : "Learner Credential"}
            </h1>

            <span className="font-mono text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-extrabold border border-slate-200">
              {cert.certificateNumber}
            </span>

            {/* Lifecycle Status Badge */}
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                isIssued
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : isDraft
                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {isIssued && <CheckCircle2 className="size-3.5" />}
              {isDraft && <Clock className="size-3.5" />}
              {isRevoked && <AlertTriangle className="size-3.5" />}
              {isDraft ? "Draft — Review Pending" : cert.status.toUpperCase()}
            </span>

            {cert.revisionNumber && cert.revisionNumber > 1 && (
              <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 text-xs font-bold border border-purple-200">
                Revision #{cert.revisionNumber}
              </span>
            )}
          </div>

          <p className="text-xs text-slate-500 mt-1">
            Course: <strong className="text-slate-700">{courseObj.name || courseObj.courseName || "Academic Program"}</strong>
            {batchObj.batchName && ` • Batch: ${batchObj.batchName}`}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {isDraft && (
            <>
              <button
                onClick={handleSaveChanges}
                disabled={isSaving}
                className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 transition flex items-center gap-1.5 shadow-sm"
              >
                <Save className="size-3.5 text-indigo-600" />
                {isSaving ? "Saving Changes..." : "Save Draft Changes"}
              </button>

              <button
                onClick={() => setShowIssueConfirm(true)}
                disabled={isIssuing}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              >
                <CheckCircle2 className="size-3.5" />
                {isIssuing ? "Issuing..." : "Approve & Issue Certificate"}
              </button>
            </>
          )}

          {isIssued && (
            <>
              <Link
                href={`/api/certificates/${cert._id}/download`}
                target="_blank"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              >
                <Download className="size-3.5" />
                Download Official PDF
              </Link>

              <Link
                href={`/verify-certificate/${cert.verificationCode}`}
                target="_blank"
                className="px-3.5 py-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 transition flex items-center gap-1.5 shadow-sm"
              >
                <ExternalLink className="size-3.5 text-indigo-600" />
                Public Verification
              </Link>

              <button
                onClick={() => setShowReviseDialog(true)}
                className="px-3.5 py-2 border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              >
                <RotateCcw className="size-3.5" />
                Revise & Reissue
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Data & Customization Form (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* PANEL 1: LOCKED ACADEMIC DATA */}
          <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Lock className="size-4 text-slate-400" />
                <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-600">
                  Authoritative Academic Records (Locked)
                </h2>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200/60 text-slate-600">
                Immutable
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 font-semibold block">Learner</span>
                <span className="font-bold text-slate-800 truncate block mt-0.5">
                  {studentObj.firstName} {studentObj.lastName}
                </span>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 font-semibold block">Academic Standing</span>
                <span className="font-bold text-slate-800 block mt-0.5">
                  Grade {cert.grade || "Pass"} ({cert.percentage || 100}%)
                </span>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 font-semibold block">Completion Date</span>
                <span className="font-bold text-slate-800 block mt-0.5">
                  {new Date(cert.completionDate).toLocaleDateString()}
                </span>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 font-semibold block">Verification Code</span>
                <span className="font-mono font-bold text-indigo-600 block mt-0.5">
                  {cert.verificationCode}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 mt-3 leading-relaxed">
              Academic outcomes, grades, and completion metrics are protected server-side and cannot be edited.
            </p>
          </div>

          {/* PANEL 2: PRESENTATION CUSTOMIZATION */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Edit3 className="size-4 text-indigo-600" />
                <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
                  Presentation & Document Customization
                </h2>
              </div>
              {isDraft ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Editable Before Issuance
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-500">
                  Fixed for Issued Credential
                </span>
              )}
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Certificate Title</label>
                <input
                  type="text"
                  value={customization.title}
                  disabled={!isDraft}
                  onChange={(e) => setCustomization({ ...customization, title: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50"
                  placeholder="e.g. Certificate of Achievement"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Subtitle / Conferred Notice</label>
                <input
                  type="text"
                  value={customization.subtitle}
                  disabled={!isDraft}
                  onChange={(e) => setCustomization({ ...customization, subtitle: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50"
                  placeholder="e.g. This credential is proudly conferred upon"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Course Display Name</label>
                <input
                  type="text"
                  value={customization.courseDisplayName}
                  disabled={!isDraft}
                  onChange={(e) => setCustomization({ ...customization, courseDisplayName: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50"
                  placeholder="Official Course or Program Name"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Achievement Recognition Wording</label>
                <textarea
                  rows={2}
                  value={customization.achievementWording}
                  disabled={!isDraft}
                  onChange={(e) => setCustomization({ ...customization, achievementWording: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50"
                  placeholder="for successfully completing the prescribed curriculum..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Instructor Name</label>
                  <input
                    type="text"
                    value={customization.instructorDisplayName}
                    disabled={!isDraft}
                    onChange={(e) => setCustomization({ ...customization, instructorDisplayName: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50"
                    placeholder="e.g. Dr. Jane Smith"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Instructor Title</label>
                  <input
                    type="text"
                    value={customization.instructorTitle}
                    disabled={!isDraft}
                    onChange={(e) => setCustomization({ ...customization, instructorTitle: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50"
                    placeholder="Course Lead Faculty"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Signatory Name</label>
                  <input
                    type="text"
                    value={customization.signatoryDisplayName}
                    disabled={!isDraft}
                    onChange={(e) => setCustomization({ ...customization, signatoryDisplayName: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50"
                    placeholder="e.g. Prof. Arthur Pendelton"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Signatory Title</label>
                  <input
                    type="text"
                    value={customization.signatoryTitle}
                    disabled={!isDraft}
                    onChange={(e) => setCustomization({ ...customization, signatoryTitle: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50"
                    placeholder="Academic Director"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Footer / Institutional Text</label>
                <input
                  type="text"
                  value={customization.footerWording}
                  disabled={!isDraft}
                  onChange={(e) => setCustomization({ ...customization, footerWording: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50"
                  placeholder="TrueLern Academy • Learn • Grow • Lead"
                />
              </div>
            </div>

            {isDraft && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleSaveChanges}
                  disabled={isSaving}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Save className="size-3.5" />
                  {isSaving ? "Saving..." : "Save & Regenerate PDF Preview"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Live PDF Document Preview & Audit Trail (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Exact PDF Preview */}
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-extrabold text-slate-900">Exact Generated PDF Document</h2>
                <p className="text-[11px] text-slate-400">
                  This preview renders the authentic PDF binary stream with QR verification that will be officially issued.
                </p>
              </div>
              <button
                onClick={() => setRefreshKey((k) => k + 1)}
                className="p-1.5 border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-500 text-xs font-bold transition flex items-center gap-1"
                title="Reload preview"
              >
                <RotateCcw className="size-3" /> Refresh
              </button>
            </div>

            <div className="w-full aspect-[1.414/1] bg-slate-100 rounded-xl overflow-hidden border border-slate-200 shadow-inner">
              <CertificatePdfPreview id={cert._id} refreshKey={refreshKey} />
            </div>
          </div>

          {/* Lifecycle Audit Trail */}
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 mb-4">
              Certificate Governance & Lifecycle Audit Trail
            </h2>

            <div className="space-y-3.5 border-l-2 border-indigo-100 pl-4 ml-2 text-xs">
              {timeline.map((item) => (
                <div key={item._id?.toString()} className="relative">
                  <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-600 ring-4 ring-white"></div>
                  <div className="font-bold text-slate-800 capitalize flex items-center gap-2">
                    {item.event}
                    <span className="text-[10px] font-normal text-slate-400">
                      {new Date(item.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-slate-600 mt-0.5 leading-relaxed">{item.description}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Verification Registry Logs (If issued) */}
          {verifications && verifications.length > 0 && (
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 mb-3">
                Digital Verification Scan Logs
              </h2>
              <div className="space-y-2 text-xs">
                {verifications.map((v) => (
                  <div
                    key={v._id?.toString()}
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-semibold text-slate-800">Scanned via Public Registry</span>
                      <span className="text-slate-400 block text-[10px]">
                        IP: {v.ipAddress || "127.0.0.1"} • {new Date(v.verifiedAt).toLocaleString()}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      VERIFIED
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Dialog: Approve & Issue */}
      <EnterpriseDialog
        isOpen={showIssueConfirm}
        onClose={() => setShowIssueConfirm(false)}
        title="Approve & Officially Issue Certificate"
        subtitle="This action verifies academic criteria, stamps the official credential, and enables student and parent downloads."
        variant="info"
        confirmLabel="Confirm & Issue"
        cancelLabel="Cancel"
        onConfirm={handleIssueConfirm}
        loading={isIssuing}
      >
        <div className="text-xs text-slate-600 space-y-2">
          <p>
            You are about to issue official credential <strong>{cert.certificateNumber}</strong> to learner{" "}
            <strong>{studentObj.firstName} {studentObj.lastName}</strong>.
          </p>
          <p className="text-slate-500">
            The generated PDF will match your customized presentation fields and will become permanently verifiable at{" "}
            <span className="font-mono text-indigo-600">/verify-certificate/{cert.verificationCode}</span>.
          </p>
        </div>
      </EnterpriseDialog>

      {/* Controlled Revise & Reissue Dialog */}
      <EnterpriseDialog
        isOpen={showReviseDialog}
        onClose={() => setShowReviseDialog(false)}
        title="Revise & Reissue Credential"
        subtitle="Create a new credential revision while preserving historical audit records."
        variant="warning"
        confirmLabel="Create Revision Draft"
        cancelLabel="Cancel"
        onConfirm={handleReviseConfirm}
        loading={isRevising}
      >
        <div className="space-y-3.5 text-xs">
          <p className="text-slate-600 leading-relaxed">
            Historical issued credentials cannot be overwritten silently. This workflow marks the current credential as
            superseded and opens a new revision draft for administrative review.
          </p>

          <div>
            <label className="font-bold text-slate-800 block mb-1">
              Revision Reason (Mandatory Audit Requirement)
            </label>
            <input
              type="text"
              value={revisionReason}
              onChange={(e) => setRevisionReason(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              placeholder="e.g. Corrected course title typography, updated signatory title"
              autoFocus
            />
          </div>
        </div>
      </EnterpriseDialog>
    </div>
  );
}
