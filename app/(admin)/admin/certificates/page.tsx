"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Download,
  Settings,
  Plus,
  Award,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileCheck,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { EnterpriseDialog } from "@/components/ui/dialogs/EnterpriseDialog";
import { useToast } from "@/components/ui/dialogs/ToastProvider";
import CertificateEligibilityRulesCard from "@/components/certificates/CertificateEligibilityRulesCard";

export default function CertificatesDashboard() {
  const router = useRouter();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<"eligible" | "ledger">("eligible");
  const [certificates, setCertificates] = useState<any[]>([]);
  const [eligibleCandidates, setEligibleCandidates] = useState<any[]>([]);
  const [rules, setRules] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadingEligible, setLoadingEligible] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  // Manual Exception Dialog State
  const [showManualDialog, setShowManualDialog] = useState(false);
  const [manualEnrollmentId, setManualEnrollmentId] = useState("");
  const [manualGrade, setManualGrade] = useState("A");
  const [manualLoading, setManualLoading] = useState(false);

  // Column Visibility
  const [columns, setColumns] = useState({
    certNumber: true,
    student: true,
    course: true,
    verification: true,
    status: true,
    issueDate: true,
  });

  const fetchCertificates = () => {
    setLoading(true);
    fetch(`/api/certificates?search=${encodeURIComponent(search)}&limit=100`)
      .then((res) => res.json())
      .then((data) => {
        const parsed = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data?.data?.data)
          ? data.data.data
          : [];
        setCertificates(parsed);
      })
      .catch((err) => {
        console.error("Error fetching certificates:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const fetchEligibleCandidates = () => {
    setLoadingEligible(true);
    fetch("/api/admin/certificates/eligible")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          setEligibleCandidates(json.data.candidates || []);
          setRules(json.data.rules || null);
        }
      })
      .catch((err) => {
        console.error("Error fetching eligible candidates:", err);
      })
      .finally(() => {
        setLoadingEligible(false);
      });
  };

  useEffect(() => {
    fetchCertificates();
    fetchEligibleCandidates();
  }, [search]);

  // Primary Action: Review & Issue (or Generate Draft) for an eligible student
  const handleReviewAndIssue = async (candidate: any) => {
    // If draft already exists, route directly to certificate editor
    if (candidate.certificate?.id) {
      router.push(`/admin/certificates/${candidate.certificate.id}`);
      return;
    }

    // Otherwise generate draft and route to editor
    setGeneratingId(candidate.enrollmentId);
    try {
      const res = await fetch("/api/admin/certificates/eligible", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enrollmentId: candidate.enrollmentId }),
      });
      const data = await res.json();
      if (data.success && data.data?._id) {
        toast.success("Draft Generated", "Certificate draft created. Proceeding to presentation review.");
        router.push(`/admin/certificates/${data.data._id}`);
      } else {
        toast.error("Generation Failed", data.message || "Failed to generate certificate draft.");
      }
    } catch {
      toast.error("Network Error", "Unable to contact certificate generator.");
    } finally {
      setGeneratingId(null);
    }
  };

  const handleManualCreate = async () => {
    if (!manualEnrollmentId.trim()) {
      toast.error("Validation Error", "Please select an enrollment candidate.");
      return;
    }

    setManualLoading(true);
    try {
      const res = await fetch("/api/admin/certificates/eligible", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enrollmentId: manualEnrollmentId.trim() }),
      });
      const data = await res.json();
      if (data.success && data.data?._id) {
        setShowManualDialog(false);
        setManualEnrollmentId("");
        toast.success("Certificate Draft Created", "Draft created. Opening editor.");
        router.push(`/admin/certificates/${data.data._id}`);
      } else {
        toast.error("Creation Failed", data.message || "Could not generate certificate draft.");
      }
    } catch {
      toast.error("Network Error", "Failed to connect to the server.");
    } finally {
      setManualLoading(false);
    }
  };

  const exportCSV = () => {
    const headers = ["Cert Number", "Student", "Course", "Grade", "Status", "Verification Code"];
    const rows = filteredCertificates.map((c) => [
      c.certificateNumber,
      c.student ? `${c.student.firstName} ${c.student.lastName}` : "Student Profile",
      c.course?.name || c.course?.courseName || "N/A",
      c.grade || "Pass",
      c.status,
      c.verificationCode || "",
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `truelern_certificates_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredCertificates = certificates.filter((c) => {
    if (statusFilter === "ALL") return true;
    return c.status === statusFilter;
  });

  // Calculate quick stats
  const totalIssued = certificates.filter((c) => c.status === "issued").length;
  const totalDrafts = certificates.filter((c) => c.status === "draft").length;
  const totalEligible = eligibleCandidates.filter((c) => c.eligibility?.isEligible).length;

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto py-2">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <Award className="size-6 text-indigo-600" />
            <h1 className="text-2xl font-black text-slate-900">Certificate Governance & Ledger</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Evaluate course completion criteria, customize presentation fields, preview exact PDFs, and issue verifiable credentials.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              fetchCertificates();
              fetchEligibleCandidates();
            }}
            className="p-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl text-slate-600 text-xs font-bold transition flex items-center gap-1.5"
            title="Refresh records"
          >
            <RefreshCw className="size-3.5" /> Refresh
          </button>

          <button
            onClick={() => setShowManualDialog(true)}
            className="px-3.5 py-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 transition flex items-center gap-1.5"
          >
            <Plus className="size-3.5 text-indigo-600" />
            Administrative Exception
          </button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
            <Sparkles className="size-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{totalEligible}</div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Eligible Learners Ready</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center">
            <Clock className="size-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-indigo-600">{totalDrafts}</div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Drafts In Review</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
            <ShieldCheck className="size-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-600">{totalIssued}</div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Officially Issued</div>
          </div>
        </div>
      </div>

      {/* Dynamic Certificate Eligibility Rules Card */}
      <CertificateEligibilityRulesCard />

      {/* Primary Workspace Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pt-2">
        <button
          onClick={() => setActiveTab("eligible")}
          className={`pb-3 px-4 text-sm font-extrabold transition-all relative flex items-center gap-2 ${
            activeTab === "eligible"
              ? "text-indigo-600 border-b-2 border-indigo-600"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <Award className="size-4" />
          Eligible Learners & Course Completions
          {totalEligible > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-indigo-50 text-indigo-700 border border-indigo-200">
              {totalEligible}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("ledger")}
          className={`pb-3 px-4 text-sm font-extrabold transition-all relative flex items-center gap-2 ${
            activeTab === "ledger"
              ? "text-indigo-600 border-b-2 border-indigo-600"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <FileCheck className="size-4" />
          Certificate Registry & Audit Ledger
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-100 text-slate-600">
            {certificates.length}
          </span>
        </button>
      </div>

      {/* TAB 1: ELIGIBLE LEARNERS (PRIMARY WORKFLOW) */}
      {activeTab === "eligible" && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 bg-slate-50/70 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900">
                Course Completions & Certificate Readiness
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Students evaluated in real-time against configured thresholds (Attendance ≥{rules?.attendanceThreshold || 80}%, Assignments ≥{rules?.assignmentSubmissionThreshold || 75}%, Assessments ≥{rules?.quizPassingThreshold || 60}%).
              </p>
            </div>
          </div>

          {loadingEligible ? (
            <div className="py-16 text-center text-slate-400 text-sm">Evaluating student course completions...</div>
          ) : eligibleCandidates.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-sm">
              No completed enrollments found. When students complete courses, they will appear here automatically.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                    <th className="p-4">Learner</th>
                    <th className="p-4">Course</th>
                    <th className="p-4 text-center">Attendance</th>
                    <th className="p-4 text-center">Assignments</th>
                    <th className="p-4 text-center">Assessments</th>
                    <th className="p-4 text-center">Syllabus</th>
                    <th className="p-4 text-center">Eligibility</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {eligibleCandidates.map((c) => {
                    const el = c.eligibility;
                    const isEligible = el?.isEligible;
                    const hasDraft = c.certificate?.status === "draft";
                    const hasIssued = c.certificate?.status === "issued";

                    return (
                      <tr key={c.enrollmentId} className="hover:bg-slate-50/60 transition">
                        <td className="p-4 font-semibold text-slate-900">
                          <div>
                            {c.student ? `${c.student.firstName} ${c.student.lastName}` : "Learner Profile"}
                          </div>
                          <div className="text-[11px] font-normal text-slate-400">{c.student?.email}</div>
                        </td>

                        <td className="p-4 text-slate-600 font-medium">
                          {c.course?.name || c.course?.courseName || "Course"}
                        </td>

                        <td className="p-4 text-center font-mono text-xs">
                          {el ? (
                            <span
                              className={`px-2 py-0.5 rounded font-bold ${
                                el.attendancePercentage >= (rules?.attendanceThreshold || 80)
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-red-50 text-red-700"
                              }`}
                            >
                              {el.attendancePercentage}%
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        <td className="p-4 text-center font-mono text-xs">
                          {el ? (
                            <span
                              className={`px-2 py-0.5 rounded font-bold ${
                                el.assignmentCompletionRate >= (rules?.assignmentSubmissionThreshold || 75)
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-red-50 text-red-700"
                              }`}
                            >
                              {el.assignmentCompletionRate}%
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        <td className="p-4 text-center font-mono text-xs">
                          {el ? (
                            <span
                              className={`px-2 py-0.5 rounded font-bold ${
                                el.assessmentPassStatus
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-red-50 text-red-700"
                              }`}
                            >
                              {el.assessmentPassStatus ? "PASS" : "FAIL"}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        <td className="p-4 text-center font-mono text-xs">
                          <span
                            className={`px-2 py-0.5 rounded font-bold ${
                              c.enrollmentStatus === "completed"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {c.enrollmentStatus === "completed" ? "COMPLETE" : c.enrollmentStatus}
                          </span>
                        </td>

                        <td className="p-4 text-center">
                          {hasIssued ? (
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center gap-1">
                              <CheckCircle2 className="size-3" /> Issued
                            </span>
                          ) : hasDraft ? (
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center gap-1">
                              <Clock className="size-3" /> Draft In Review
                            </span>
                          ) : isEligible ? (
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center gap-1">
                              <Sparkles className="size-3" /> Ready For Review
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-500">
                              Criteria Pending
                            </span>
                          )}
                        </td>

                        <td className="p-4 text-right">
                          {hasIssued ? (
                            <Link
                              href={`/admin/certificates/${c.certificate.id}`}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition inline-flex items-center gap-1"
                            >
                              View Credential <ChevronRight className="size-3.5" />
                            </Link>
                          ) : isEligible || hasDraft ? (
                            <button
                              onClick={() => handleReviewAndIssue(c)}
                              disabled={generatingId === c.enrollmentId}
                              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition inline-flex items-center gap-1 shadow-sm"
                            >
                              {generatingId === c.enrollmentId ? (
                                "Generating Draft..."
                              ) : hasDraft ? (
                                <>
                                  Review & Edit Draft <ChevronRight className="size-3.5" />
                                </>
                              ) : (
                                <>
                                  Generate & Review <ChevronRight className="size-3.5" />
                                </>
                              )}
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400 italic">Ineligible</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CERTIFICATE REGISTRY & LEDGER */}
      {activeTab === "ledger" && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          {/* Toolbar & Filters */}
          <div className="p-4 border-b border-slate-100 flex flex-wrap justify-between items-center gap-4 bg-slate-50/50">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search certificate # or code..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white font-medium text-slate-700"
              >
                <option value="ALL">All Statuses</option>
                <option value="draft">Draft (Pending Review)</option>
                <option value="issued">Issued</option>
                <option value="revoked">Revoked</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={exportCSV}
                className="px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg text-xs font-bold text-slate-700 flex items-center gap-1.5 transition"
              >
                <Download className="size-3.5" /> Export CSV
              </button>
            </div>
          </div>

          {/* Ledger Table */}
          {loading ? (
            <div className="py-16 text-center text-slate-400 text-sm">Loading certificate ledger...</div>
          ) : filteredCertificates.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-sm">No certificates found matching criteria.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                    {columns.certNumber && <th className="p-4">Certificate Number</th>}
                    {columns.student && <th className="p-4">Learner</th>}
                    {columns.course && <th className="p-4">Course</th>}
                    {columns.verification && <th className="p-4">Verification Code</th>}
                    {columns.status && <th className="p-4 text-center">Status</th>}
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCertificates.map((cert) => (
                    <tr key={cert._id} className="hover:bg-slate-50/60 transition">
                      {columns.certNumber && (
                        <td className="p-4 font-mono text-xs font-bold text-indigo-600">
                          <Link href={`/admin/certificates/${cert._id}`} className="hover:underline">
                            {cert.certificateNumber}
                          </Link>
                          {cert.revisionNumber && cert.revisionNumber > 1 && (
                            <span className="ml-1.5 px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 text-[10px] font-bold">
                              Rev #{cert.revisionNumber}
                            </span>
                          )}
                        </td>
                      )}
                      {columns.student && (
                        <td className="p-4 font-semibold text-slate-900">
                          {cert.student ? `${cert.student.firstName} ${cert.student.lastName}` : "Learner Profile"}
                        </td>
                      )}
                      {columns.course && (
                        <td className="p-4 text-slate-600">
                          {cert.course?.name || cert.course?.courseName || "Academic Course"}
                        </td>
                      )}
                      {columns.verification && (
                        <td className="p-4 font-mono text-xs text-slate-500">
                          {cert.verificationCode}
                        </td>
                      )}
                      {columns.status && (
                        <td className="p-4 text-center">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 ${
                              cert.status === "issued"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : cert.status === "draft"
                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                : "bg-red-50 text-red-700 border border-red-200"
                            }`}
                          >
                            {cert.status === "issued" && <CheckCircle2 className="size-3" />}
                            {cert.status === "draft" && <Clock className="size-3" />}
                            {cert.status === "revoked" && <AlertCircle className="size-3" />}
                            {cert.status === "draft" ? "Draft — Review Pending" : cert.status.toUpperCase()}
                          </span>
                        </td>
                      )}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/certificates/${cert._id}`}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                              cert.status === "draft"
                                ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                                : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                            }`}
                          >
                            {cert.status === "draft" ? "Review & Issue" : "Manage"}
                          </Link>
                          {cert.status === "issued" && (
                            <Link
                              href={`/api/certificates/${cert._id}/download`}
                              target="_blank"
                              className="p-1.5 border border-slate-200 hover:bg-slate-100 rounded-lg text-slate-600 transition"
                              title="Download PDF"
                            >
                              <Download className="size-3.5" />
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Manual Exception Dialog (Selectable, NOT blind typing) */}
      <EnterpriseDialog
        isOpen={showManualDialog}
        onClose={() => {
          if (!manualLoading) setShowManualDialog(false);
        }}
        title="Create Certificate (Administrative Exception)"
        subtitle="Select an enrollment candidate to generate an administrative certificate draft."
        variant="info"
        confirmLabel="Generate Draft"
        cancelLabel="Cancel"
        onConfirm={handleManualCreate}
        loading={manualLoading}
      >
        <div className="space-y-4">
          <div>
            <label className="lms-label block mb-1.5" htmlFor="manual-enr">
              Select Completed Enrollment Candidate
            </label>
            <select
              id="manual-enr"
              value={manualEnrollmentId}
              onChange={(e) => setManualEnrollmentId(e.target.value)}
              className="lms-input"
              disabled={manualLoading}
            >
              <option value="">-- Choose Candidate --</option>
              {eligibleCandidates.map((c) => (
                <option key={c.enrollmentId} value={c.enrollmentId}>
                  {c.student ? `${c.student.firstName} ${c.student.lastName}` : "Learner"} —{" "}
                  {c.course?.name || "Course"} ({c.enrollmentStatus})
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400 mt-1">
              Authoritative student and course records are derived from the selected enrollment.
            </p>
          </div>

          <div>
            <label className="lms-label block mb-1.5" htmlFor="manual-grade">
              Academic Standing / Grade
            </label>
            <input
              id="manual-grade"
              type="text"
              value={manualGrade}
              onChange={(e) => setManualGrade(e.target.value)}
              className="lms-input"
              placeholder="e.g. A, Distinction, Pass"
              disabled={manualLoading}
            />
          </div>
        </div>
      </EnterpriseDialog>
    </div>
  );
}
