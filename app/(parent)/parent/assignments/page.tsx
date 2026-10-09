"use client";

import React, { useEffect, useState } from "react";
import { useParentChild } from "@/components/parent/parent-child-context";
import {
  FileText,
  Calendar,
  CheckCircle2,
  Clock,
  MessageSquare,
  Upload,
  Link as LinkIcon,
  Download,
  AlertCircle,
  X,
  FileCheck,
  Send,
  Sparkles,
  Info,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { RichTextRenderer } from "@/components/ui/rich-text-renderer";
import { formatDateSafe } from "@/lib/utils/date-formatter";

interface AssignmentAttachment {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize?: number;
  fileType?: string;
}

interface AssignmentItem {
  id: string;
  title: string;
  description: string;
  instructions?: string;
  type?: string;
  difficultyLevel?: string;
  totalMarks: number;
  passingMarks?: number;
  dueDate: string;
  status: string;
  maxAttempts: number;
  totalAttemptsUsed: number;
  canSubmit: boolean;
  lateSubmissionAllowed?: boolean;
  attachments: AssignmentAttachment[];
  submission?: {
    id: string;
    submissionNumber: string;
    submittedAt: string;
    attemptNumber: number;
    status: string;
    lateSubmission?: boolean;
    files: string[];
    links: string[];
    comments?: string;
    marksAwarded?: number;
    grade?: string;
    feedback?: string;
    isGraded?: boolean;
  } | null;
}

export default function ParentAssignmentsPage() {
  const { selectedChild } = useParentChild();
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submittingAssignment, setSubmittingAssignment] = useState<AssignmentItem | null>(null);
  const [expandedDetailsId, setExpandedDetailsId] = useState<string | null>(null);

  // Form states for submission modal
  const [fileList, setFileList] = useState<File[]>([]);
  const [linkInput, setLinkInput] = useState<string>("");
  const [linksList, setLinksList] = useState<string[]>([]);
  const [comments, setComments] = useState<string>("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fetchAssignments = () => {
    if (selectedChild?.studentId) {
      setLoading(true);
      fetch(`/api/parent/children/${selectedChild.studentId}/assignments`, { credentials: "include" })
        .then((res) => res.json())
        .then((json) => {
          if (json.success) {
            setAssignments(json.data || []);
          }
        })
        .catch((err) => {
          console.error("Failed to load assignments", err);
        })
        .finally(() => setLoading(false));
    }
  };

  useEffect(() => {
    fetchAssignments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChild?.studentId]);

  const openSubmitModal = (assignment: AssignmentItem) => {
    setSubmittingAssignment(assignment);
    const draft = assignment.submission?.status === "draft" ? assignment.submission : null;
    setFileList([]);
    setLinkInput("");
    setLinksList(draft?.links || []);
    setComments(draft?.comments || "");
    setSubmitError(null);
    setSubmitSuccess(null);
  };

  const closeSubmitModal = () => {
    if (isSubmitting) return;
    setSubmittingAssignment(null);
    setFileList([]);
    setLinkInput("");
    setLinksList([]);
    setComments("");
    setSubmitError(null);
    setSubmitSuccess(null);
  };

  const handleAddLink = () => {
    if (!linkInput.trim()) return;
    try {
      new URL(linkInput.trim());
      setLinksList((prev) => [...prev, linkInput.trim()]);
      setLinkInput("");
    } catch {
      setSubmitError("Please enter a valid URL (e.g. https://github.com/...)");
    }
  };

  const handleRemoveLink = (index: number) => {
    setLinksList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const allowedExts = [".pdf", ".doc", ".docx", ".txt", ".png", ".jpg", ".jpeg", ".zip", ".csv", ".xlsx", ".pptx"];
      const newFiles: File[] = [];
      const filesArr = Array.from(e.target.files);

      for (const file of filesArr) {
        const ext = "." + file.name.split(".").pop()?.toLowerCase();
        if (!allowedExts.includes(ext)) {
          setSubmitError(`File "${file.name}" has an unsupported format. Allowed: ${allowedExts.join(", ")}`);
          return;
        }
        if (file.size > 10 * 1024 * 1024) {
          setSubmitError(`File "${file.name}" exceeds 10MB limit.`);
          return;
        }
        newFiles.push(file);
      }

      setSubmitError(null);
      setFileList((prev) => [...prev, ...newFiles]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setFileList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submittingAssignment || !selectedChild) return;

    if (fileList.length === 0 && linksList.length === 0 && !comments.trim()) {
      setSubmitError("Please attach at least one file, a document link, or submission notes.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Convert files to base64 Data URIs or simulated upload paths
      const filePromises = fileList.map(
        (file) =>
          new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              resolve(reader.result as string);
            };
            reader.readAsDataURL(file);
          })
      );

      const uploadedDataUris = await Promise.all(filePromises);

      const payload = {
        files: uploadedDataUris,
        links: linksList,
        comments: comments.trim() || undefined,
      };

      const res = await fetch(
        `/api/parent/children/${selectedChild.studentId}/assignments/${submittingAssignment.id}/submit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        }
      );

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to submit assignment");
      }

      setSubmitSuccess(
        `Assignment submitted successfully! Reference: ${json.data?.submissionNumber || "Confirmed"}`
      );
      setTimeout(() => {
        closeSubmitModal();
        fetchAssignments();
      }, 1400);
    } catch (err: any) {
      setSubmitError(err.message || "An unexpected error occurred during submission");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!submittingAssignment || !selectedChild) return;
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      const payload = {
        files: [], // Simplified for draft
        links: linksList,
        comments: comments.trim() || undefined,
      };

      const res = await fetch(
        `/api/parent/children/${selectedChild.studentId}/assignments/${submittingAssignment.id}/draft`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        }
      );
      
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to save draft");
      setSubmitSuccess("Draft saved successfully");
      setTimeout(() => {
        closeSubmitModal();
        fetchAssignments();
      }, 1000);
    } catch (err: any) {
      setSubmitError(err.message || "Failed to save draft");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleDetails = (id: string) => {
    setExpandedDetailsId((prev) => (prev === id ? null : id));
  };

  const pendingCount = assignments.filter((a) => !a.submission).length;
  const submittedCount = assignments.filter((a) => !!a.submission).length;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-20 bg-slate-100 rounded-3xl animate-pulse" />
        <div className="h-64 bg-slate-200/60 rounded-3xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with KPI chips */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Assignments & Coursework</h1>
          <p className="text-xs text-slate-500 mt-1">
            Review deadlines, download resources, and submit coursework on behalf of{" "}
            <span className="font-semibold text-slate-700">{selectedChild?.firstName}</span>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3.5 py-1.5 bg-amber-50 border border-amber-200/80 rounded-2xl text-xs font-semibold text-amber-700 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>{pendingCount} Pending</span>
          </div>
          <div className="px-3.5 py-1.5 bg-emerald-50 border border-emerald-200/80 rounded-2xl text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{submittedCount} Submitted</span>
          </div>
        </div>
      </div>

      {/* Assignment List */}
      <div className="space-y-4">
        {assignments.length > 0 ? (
          assignments.map((a) => {
            const isExpanded = expandedDetailsId === a.id;
            const isPastDue = new Date() > new Date(a.dueDate);

            return (
              <div
                key={a.id}
                className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm hover:border-slate-300 transition-all"
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  {/* Left Column: Title and Details */}
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                      <FileText className="w-5 h-5" />
                    </div>

                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900">{a.title}</h3>
                        {a.difficultyLevel && (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase rounded-md">
                            {a.difficultyLevel}
                          </span>
                        )}
                        {a.type && (
                          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold uppercase rounded-md">
                            {a.type}
                          </span>
                        )}
                      </div>

                      <div className="max-w-2xl">
                        <RichTextRenderer
                          content={a.description}
                          fallback="No description provided."
                          className="text-xs text-slate-600 leading-relaxed"
                        />
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 font-medium pt-1">
                        <span
                          className={`flex items-center gap-1 font-semibold ${
                            isPastDue && !a.submission ? "text-rose-600" : "text-slate-600"
                          }`}
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          Due: {formatDateSafe(a.dueDate)}{" "}
                          {isPastDue && !a.submission && "(Overdue)"}
                        </span>
                        <span>• Max Marks: {a.totalMarks}</span>
                        {a.passingMarks && <span>• Pass: {a.passingMarks}</span>}
                        <span>
                          • Attempts: {a.totalAttemptsUsed} / {a.maxAttempts}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Status & Submission Actions */}
                  <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-3 shrink-0">
                    <div className="space-y-1 text-left lg:text-right">
                      {a.submission && a.submission.status !== "draft" ? (
                        <div className="flex flex-col items-start lg:items-end gap-1">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Submitted (Attempt #{a.submission.attemptNumber})
                          </span>
                          {a.submission.isGraded && a.submission.marksAwarded !== undefined ? (
                            <p className="text-xs font-bold text-slate-900">
                              Score: {a.submission.marksAwarded} / {a.totalMarks}{" "}
                              {a.submission.grade && (
                                <span className="text-emerald-600 ml-1 font-extrabold">
                                  ({a.submission.grade})
                                </span>
                              )}
                            </p>
                          ) : (
                            <p className="text-[11px] text-slate-400 font-medium">Awaiting evaluation</p>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-full border border-amber-200">
                          <Clock className="w-3.5 h-3.5" /> {a.submission?.status === "draft" ? "Draft Saved" : "Pending Submission"}
                        </span>
                      )}
                    </div>

                    {/* Primary Action Button */}
                    <div className="flex items-center gap-2">
                      {a.canSubmit && (
                        <button
                          onClick={() => openSubmitModal(a)}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white text-xs font-bold rounded-xl shadow-sm shadow-indigo-200 flex items-center gap-1.5 transition-all"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>{a.submission ? "Resubmit Work" : "Submit Work"}</span>
                        </button>
                      )}

                      <button
                        onClick={() => toggleDetails(a.id)}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1 transition-all"
                      >
                        <span>{isExpanded ? "Hide Details" : "View Details"}</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Details: Instructions, Attachments & Submission Records */}
                {isExpanded && (
                  <div className="mt-5 pt-5 border-t border-slate-100 space-y-4 text-xs animate-in fade-in duration-200">
                    {/* Instructions */}
                    {a.instructions && (
                      <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/60">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800 mb-1">
                          <Info className="w-4 h-4 text-indigo-500" />
                          <span>Assignment Instructions</span>
                        </div>
                        <div className="pl-5">
                          <RichTextRenderer
                            content={a.instructions}
                            className="text-slate-600 leading-relaxed prose prose-sm max-w-none"
                          />
                        </div>
                      </div>
                    )}

                    {/* Teacher Attachments */}
                    {a.attachments && a.attachments.length > 0 && (
                      <div>
                        <h4 className="font-bold text-slate-700 mb-2">Teacher Resources & Attachments</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                          {a.attachments.map((att) => (
                            <a
                              key={att.id}
                              href={att.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2.5 rounded-xl border border-slate-200 hover:border-indigo-300 bg-white flex items-center justify-between group transition-all"
                            >
                              <div className="flex items-center gap-2 truncate pr-2">
                                <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                                <span className="truncate font-medium text-slate-700 group-hover:text-indigo-600">
                                  {att.fileName}
                                </span>
                              </div>
                              <Download className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 shrink-0" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Submission History / Details */}
                    {a.submission && (
                      <div className="p-4 rounded-2xl bg-indigo-50/40 border border-indigo-100 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 font-bold text-indigo-950">
                            <FileCheck className="w-4 h-4 text-indigo-600" />
                            <span>Submission Reference: {a.submission.submissionNumber}</span>
                          </div>
                          <span className="text-slate-500 text-[11px]">
                            Submitted: {new Date(a.submission.submittedAt).toLocaleString()}
                          </span>
                        </div>

                        {/* Files and Links */}
                        <div className="space-y-2">
                          {a.submission.files.length > 0 && (
                            <div>
                              <span className="font-semibold text-slate-700">Submitted Files:</span>
                              <div className="flex flex-wrap gap-2 mt-1">
                                {a.submission.files.map((file, idx) => (
                                  <a
                                    key={idx}
                                    href={file}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-2.5 py-1 bg-white rounded-lg border border-slate-200 text-indigo-600 hover:underline flex items-center gap-1 font-medium"
                                  >
                                    <FileText className="w-3.5 h-3.5" />
                                    <span>Attachment {idx + 1}</span>
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}

                          {a.submission.links.length > 0 && (
                            <div>
                              <span className="font-semibold text-slate-700">Submitted Resource Links:</span>
                              <div className="flex flex-wrap gap-2 mt-1">
                                {a.submission.links.map((link, idx) => (
                                  <a
                                    key={idx}
                                    href={link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-2.5 py-1 bg-white rounded-lg border border-slate-200 text-indigo-600 hover:underline flex items-center gap-1 font-medium"
                                  >
                                    <LinkIcon className="w-3.5 h-3.5" />
                                    <span className="truncate max-w-[200px]">{link}</span>
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}

                          {a.submission.comments && (
                            <div>
                              <span className="font-semibold text-slate-700">Student/Parent Notes:</span>
                              <p className="text-slate-600 mt-0.5 italic pl-2 border-l-2 border-slate-300">
                                {a.submission.comments}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Teacher Feedback / Remarks */}
                        {a.submission.feedback && (
                          <div className="mt-3 p-3 rounded-xl bg-white border border-slate-200/80 flex items-start gap-2.5">
                            <MessageSquare className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold text-slate-800">Teacher Remarks: </span>
                              <span className="text-slate-700">{a.submission.feedback}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="py-16 text-center text-xs text-slate-400 bg-white rounded-3xl border border-slate-200">
            No assignments recorded for this cohort.
          </div>
        )}
      </div>

      {/* Submission Modal Dialog */}
      {submittingAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-600">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Submit Work for {selectedChild?.firstName}</span>
                </div>
                <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                  {submittingAssignment.title}
                </h2>
              </div>
              <button
                onClick={closeSubmitModal}
                disabled={isSubmitting}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
              {submitError && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-700">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <span>{submitError}</span>
                </div>
              )}

              {submitSuccess && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-xs text-emerald-700">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                  <span>{submitSuccess}</span>
                </div>
              )}

              {/* Due Date & Attempt Indicator */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
                <span className="text-slate-500">
                  Due: <strong className="text-slate-700">{formatDateSafe(submittingAssignment.dueDate)}</strong>
                </span>
                <span className="text-slate-500">
                  Attempt:{" "}
                  <strong className="text-indigo-600 font-bold">
                    {submittingAssignment.totalAttemptsUsed + 1} of {submittingAssignment.maxAttempts}
                  </strong>
                </span>
              </div>

              {/* File Attachment Upload */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  Upload Documents or Work (.pdf, .docx, .zip, .png, .jpg)
                </label>
                <div className="relative border-2 border-dashed border-slate-200 hover:border-indigo-300 rounded-2xl p-4 text-center transition-all bg-slate-50/50">
                  <input
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    disabled={isSubmitting}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Upload className="w-6 h-6 text-indigo-500 mx-auto mb-1.5" />
                  <p className="text-xs font-semibold text-slate-700">
                    Click or drag files here to attach
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Maximum file size: 10MB per file</p>
                </div>

                {/* Selected Files List */}
                {fileList.length > 0 && (
                  <div className="space-y-1.5 pt-2">
                    {fileList.map((file, idx) => (
                      <div
                        key={idx}
                        className="px-3 py-2 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                      >
                        <span className="truncate max-w-[280px] font-medium text-slate-700">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(idx)}
                          className="text-rose-500 hover:text-rose-700 text-[11px] font-bold"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* External Resource Links */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  External Repository or Document Links (Optional)
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={linkInput}
                    onChange={(e) => setLinkInput(e.target.value)}
                    placeholder="https://github.com/..."
                    disabled={isSubmitting}
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddLink}
                    disabled={isSubmitting}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
                  >
                    Add Link
                  </button>
                </div>

                {/* Added Links List */}
                {linksList.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    {linksList.map((lnk, idx) => (
                      <div
                        key={idx}
                        className="px-3 py-2 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                      >
                        <span className="truncate max-w-[280px] text-indigo-600">{lnk}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveLink(idx)}
                          className="text-rose-500 hover:text-rose-700 text-[11px] font-bold"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Comments / Notes */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  Comments or Explanations for the Instructor (Optional)
                </label>
                <textarea
                  rows={3}
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Add any notes regarding your work, methodology, or questions..."
                  disabled={isSubmitting}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              {/* Form Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closeSubmitModal}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-indigo-600 border border-indigo-200 hover:bg-indigo-50 transition-all"
                >
                  Save Draft
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-sm shadow-indigo-200 flex items-center gap-1.5 transition-all"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Confirm Submission</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
