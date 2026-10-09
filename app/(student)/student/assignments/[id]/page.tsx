"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  UploadCloud,
  Link2,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  Sparkles,
  Award,
} from "lucide-react";

export default function StudentAssignmentDetailPage() {
  const params = useParams() || {};
  const id = (params.id || "") as string;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [assignment, setAssignment] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states
  const [fileUrl, setFileUrl] = useState("");
  const [repoLink, setRepoLink] = useState("");
  const [comments, setComments] = useState("");

  const loadData = () => {
    if (!id) return;
    setLoading(true);

    Promise.all([
      fetch(`/api/assignments/${id}`).then((res) => res.json()),
      fetch(`/api/assignments/${id}/submissions`).then((res) => res.json()),
    ])
      .then(([assignRes, subRes]) => {
        if (assignRes?.data) {
          setAssignment(assignRes.data);
        } else {
          setError(assignRes?.message || "Assignment not found");
        }

        if (subRes?.data && Array.isArray(subRes.data)) {
          setSubmissions(subRes.data);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading assignment:", err);
        setError("Failed to fetch assignment details.");
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileUrl.trim() && !repoLink.trim()) {
      setError("Please provide at least one file attachment URL or repository link.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const files = fileUrl.trim() ? [fileUrl.trim()] : [];
      const links = repoLink.trim() ? [repoLink.trim()] : [];

      const res = await fetch(`/api/assignments/${id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          files,
          links,
          comments: comments.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to submit assignment");
      }

      setSuccess("Your assignment has been submitted successfully!");
      setFileUrl("");
      setRepoLink("");
      setComments("");
      loadData();
    } catch (err: any) {
      setError(err.message || "An error occurred while submitting your assignment.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-slate-500 text-sm">
        <div className="animate-spin w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full mr-3" />
        Loading assignment workspace...
      </div>
    );
  }

  if (error && !assignment) {
    return (
      <div className="max-w-xl mx-auto text-center py-16">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-2" />
        <h2 className="text-lg font-bold text-slate-900">{error}</h2>
        <Link
          href="/student/assignments"
          className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Assignments
        </Link>
      </div>
    );
  }

  const latestSub = submissions.length > 0 ? submissions[submissions.length - 1] : null;
  const isLate = assignment?.dueDate && new Date(assignment.dueDate) < new Date();
  const maxAttempts = assignment?.maxAttempts || 1;
  const canSubmit = submissions.length < maxAttempts;

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200">
        <div>
          <Link
            href="/student/assignments"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 mb-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> All Assignments
          </Link>
          <h1 className="text-2xl font-extrabold text-slate-900">{assignment.title}</h1>
          <p className="text-xs text-slate-500 font-mono mt-0.5">Code: {assignment.assignmentCode}</p>
        </div>

        <div className="flex items-center gap-2">
          {latestSub ? (
            <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Submitted
            </span>
          ) : isLate ? (
            <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 bg-rose-50 text-rose-700 rounded-full border border-rose-100 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" /> Overdue
            </span>
          ) : (
            <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">
              Open for Submissions
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Requirements & Submission Form */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Assignment Requirements */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 mb-3">Assignment Overview & Instructions</h2>
            <div 
              className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: assignment.description }}
            />

            {assignment.instructions && (
              <div className="mt-6 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Submission Guidelines
                </h4>
                <div 
                  className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: assignment.instructions }}
                />
              </div>
            )}

            {assignment.attachments && assignment.attachments.length > 0 && (
              <div className="mt-6 p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-800 mb-3 flex items-center gap-1.5">
                  <FileText className="w-4 h-4" /> Teacher Resources & Attachments
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {assignment.attachments.map((att: any, idx: number) => (
                    <a
                      key={att._id?.toString() || idx}
                      href={att.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 rounded-xl border border-indigo-100 bg-white hover:border-indigo-300 flex items-center justify-between group transition-all shadow-sm"
                    >
                      <div className="flex items-center gap-2 truncate pr-2">
                        <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                        <span className="truncate text-xs font-bold text-slate-700 group-hover:text-indigo-600">
                          {att.fileName || `Attachment ${idx + 1}`}
                        </span>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Submission Form */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 mb-2">Upload & Submit Coursework</h2>
            <p className="text-xs text-slate-500 mb-6">
              Attach your project repository URL, hosted demo link, or verified cloud file link.
            </p>

            {error && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-700 text-xs flex items-center gap-2 mb-6">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs flex items-center gap-2 mb-6">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            {canSubmit ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="repo-link-input" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Repository or Live Demo Link (e.g. GitHub / Vercel)
                  </label>
                  <div className="relative">
                    <Link2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      id="repo-link-input"
                      type="url"
                      value={repoLink}
                      onChange={(e) => setRepoLink(e.target.value)}
                      placeholder="https://github.com/your-username/project-repo"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="file-link-input" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Attachment URL or Document Link
                  </label>
                  <div className="relative">
                    <UploadCloud className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      id="file-link-input"
                      type="text"
                      value={fileUrl}
                      onChange={(e) => setFileUrl(e.target.value)}
                      placeholder="https://drive.google.com/file/d/... or submission-file.zip"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="submission-notes-input" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Student Notes & Remarks for Instructor
                  </label>
                  <textarea
                    id="submission-notes-input"
                    rows={3}
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder="Provide any context, setup instructions, or notes for the reviewer..."
                    className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-100 transition disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{submitting ? "Submitting Work..." : "Submit Assignment"}</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-slate-900">Submission Limit Reached</h4>
                <p className="text-xs text-slate-500 mt-1">
                  You have submitted the maximum allowed attempts ({maxAttempts}/{maxAttempts}) for this assignment.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Metadata & History */}
        <div className="flex flex-col gap-6">
          {/* Metadata Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <h3 className="font-bold text-slate-900 text-sm mb-4 pb-3 border-b border-slate-100 flex items-center gap-2">
              <Award className="w-4 h-4 text-indigo-600" />
              <span>Assignment Metrics</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center text-slate-600">
                <span>Maximum Marks:</span>
                <strong className="text-slate-900 font-bold">{assignment.totalMarks || 100}</strong>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Passing Threshold:</span>
                <strong className="text-slate-900 font-bold">{assignment.passingMarks || 40}</strong>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Attempt Limits:</span>
                <strong className="text-slate-900 font-bold">{submissions.length} / {maxAttempts}</strong>
              </div>
              {assignment.dueDate && (
                <div className="pt-2 border-t border-slate-100 flex flex-col gap-1 text-slate-600">
                  <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">Due Date:</span>
                  <span className="text-slate-900 font-bold">
                    {new Date(assignment.dueDate).toLocaleString("en-IN", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Submission History */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <h3 className="font-bold text-slate-900 text-sm mb-4 pb-3 border-b border-slate-100 flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600" />
              <span>Submission History</span>
            </h3>

            {submissions.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">No submissions recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {submissions.map((sub, idx) => (
                  <div key={sub._id?.toString() || idx} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="font-bold text-slate-900 font-mono text-[11px]">
                        {sub.submissionNumber || `Attempt #${sub.attemptNumber || idx + 1}`}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                        {sub.status || "Submitted"}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500">
                      {new Date(sub.submittedAt).toLocaleString("en-IN", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </div>

                    {sub.comments && (
                      <p className="text-[11px] text-slate-600 mt-2 bg-white p-2 rounded-lg border border-slate-100">
                        "{sub.comments}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
