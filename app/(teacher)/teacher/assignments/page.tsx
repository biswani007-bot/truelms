"use client";

import React, { useEffect, useState } from "react";
import {
  ClipboardCheck,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  ExternalLink,
  Award,
  MessageSquare,
  X,
  ChevronRight,
  Filter,
  Paperclip,
  UploadCloud,
  Eye,
  Download,
  Image as ImageIcon,
} from "lucide-react";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";
import { Portal } from "@/components/ui/portal";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });


interface Assignment {
  _id: string;
  assignmentCode: string;
  title: string;
  totalMarks: number;
  passingMarks?: number;
  status: string;
  dueDate: string;
  description?: string;
  attachments?: any[];
  course?: { name: string };
  batch?: { batchName: string };
}

interface Submission {
  _id: string;
  submissionNumber: string;
  student?: { firstName: string; lastName: string; studentId: string; email: string; name?: string; code?: string };
  parent?: { firstName: string; lastName: string; name?: string };
  attemptNumber?: number;
  submittedAt: string;
  status: string;
  fileUrls?: string[];
  repoUrl?: string;
  studentNotes?: string;
  assignment?: { _id: string; title: string; totalMarks: number; course?: { name: string }; batch?: { batchName: string }; dueDate?: string };
}

export default function TeacherAssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [search, setSearch] = useState("");
  
  // Edit State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({ id: "", title: "", totalMarks: 100, passingMarks: 40, instructions: "", dueDate: "" });
  const [editAttachments, setEditAttachments] = useState<File[]>([]);
  const [editing, setEditing] = useState(false);

  // Preview Modal State
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<{ fileUrl: string, fileName: string, fileType?: string } | null>(null);

  // Create Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [batches, setBatches] = useState<any[]>([]);
  const [courses, setCourses] = useState<{ _id: string; name: string }[]>([]);
  const [createForm, setCreateForm] = useState({
    title: "",
    courseId: "",
    batchId: "",
    totalMarks: 100,
    passingMarks: 40,
    instructions: "",
    dueDate: "",
  });
  const [attachments, setAttachments] = useState<File[]>([]);
  const [creating, setCreating] = useState(false);

  // Evaluate Modal State
  const [gradingSubmission, setGradingSubmission] = useState<Submission | null>(null);
  const [gradeForm, setGradeForm] = useState({ marksObtained: 0, feedback: "" });
  const [evaluating, setEvaluating] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const isAnyModalOpen = Boolean(gradingSubmission || createModalOpen || editModalOpen || previewModalOpen);

  useEffect(() => {
    fetchAssignments();
    fetchBatches();
  }, []);

  // Lock body scroll and handle Escape key for all modals
  useEffect(() => {
    if (isAnyModalOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          if (previewModalOpen) {
            setPreviewModalOpen(false);
            setPreviewFile(null);
          } else if (gradingSubmission && !evaluating) {
            setGradingSubmission(null);
          } else if (editModalOpen && !editing) {
            setEditModalOpen(false);
          } else if (createModalOpen && !creating) {
            setCreateModalOpen(false);
          }
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = originalOverflow;
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [isAnyModalOpen, previewModalOpen, gradingSubmission, editModalOpen, createModalOpen, evaluating, editing, creating]);

  const fetchBatches = async () => {
    try {
      const res = await fetch("/api/teacher/batches");
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setBatches(data.data);
        
        // Extract unique courses
        const uniqueCourses = new Map();
        data.data.forEach((b: any) => {
          const courseId = b.course?.id || b.course?._id;
          if (courseId) {
            console.log("Processing batch:", b._id, "Course:", b.course);
            uniqueCourses.set(courseId, { _id: courseId, name: b.course.courseName || b.course.name || b.course.title || "Unknown Course" });
          }
        });
        console.log("Unique courses:", Array.from(uniqueCourses.values()));
        setCourses(Array.from(uniqueCourses.values()));
      }
    } catch (err) {
      console.error("Error fetching batches:", err);
    }
  };

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/assignments?limit=100");
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setAssignments(data.data);
        if (data.data.length > 0 && !selectedAssignment) {
          selectAssignment(data.data[0]);
        }
      } else {
        setAssignments([]);
      }
    } catch (err) {
      console.error("Error fetching assignments:", err);
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  const selectAssignment = async (assign: Assignment) => {
    setSelectedAssignment(assign);
    setLoadingSubmissions(true);
    try {
      // Fetch full details with attachments
      const detailRes = await fetch(`/api/assignments/${assign._id}`);
      const detailData = await detailRes.json();
      if (detailData.success) {
        setSelectedAssignment(detailData.data);
      }

      const res = await fetch(`/api/assignments/${assign._id}/submissions`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setSubmissions(data.data);
      } else {
        setSubmissions([]);
      }
    } catch (err) {
      console.error("Error loading submissions:", err);
      setSubmissions([]);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.title || !createForm.batchId) return;
    setCreating(true);
    try {
      let uploadedAttachments = [];
      if (attachments.length > 0) {
        const formData = new FormData();
        attachments.forEach(f => formData.append("files", f));
        const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
        const uploadData = await uploadRes.json();
        if (uploadData.success) {
          uploadedAttachments = uploadData.data;
        }
      }

      const res = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: createForm.title,
          batchId: createForm.batchId,
          totalMarks: Number(createForm.totalMarks),
          passingMarks: Number(createForm.passingMarks),
          description: createForm.instructions,
          dueDate: createForm.dueDate ? new Date(createForm.dueDate) : new Date(Date.now() + 7 * 24 * 3600000),
          attachments: uploadedAttachments,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNotification({ type: "success", message: "Assignment created and published successfully." });
        setCreateModalOpen(false);
        setCreateForm({ title: "", courseId: "", batchId: "", totalMarks: 100, passingMarks: 40, instructions: "", dueDate: "" });
        setAttachments([]);
        fetchAssignments();
      } else {
        setNotification({ type: "error", message: data.message || "Failed to create assignment" });
      }
    } catch (err) {
      setNotification({ type: "error", message: "Network error creating assignment" });
    } finally {
      setCreating(false);
    }
  };

  const handleEditAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.id || !editForm.title) return;
    setEditing(true);
    try {
      let uploadedAttachments = [];
      if (editAttachments.length > 0) {
        const formData = new FormData();
        editAttachments.forEach(f => formData.append("files", f));
        const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
        const uploadData = await uploadRes.json();
        if (uploadData.success) {
          uploadedAttachments = uploadData.data;
        }
      }

      const res = await fetch(`/api/assignments/${editForm.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editForm.title,
          totalMarks: Number(editForm.totalMarks),
          passingMarks: Number(editForm.passingMarks),
          description: editForm.instructions,
          dueDate: editForm.dueDate ? new Date(editForm.dueDate) : undefined,
          attachments: uploadedAttachments,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNotification({ type: "success", message: "Assignment updated successfully." });
        setEditModalOpen(false);
        fetchAssignments();
        // Update selected assignment to reflect changes immediately
        setSelectedAssignment((prev) => prev && prev._id === editForm.id ? { ...prev, ...data.data } : prev);
      } else {
        setNotification({ type: "error", message: data.message || "Failed to update assignment" });
      }
    } catch (err) {
      setNotification({ type: "error", message: "Network error updating assignment" });
    } finally {
      setEditing(false);
    }
  };

  const handleEvaluateSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingSubmission) return;
    setEvaluating(true);
    try {
      const res = await fetch(`/api/assignments/${gradingSubmission._id}/evaluate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          marksObtained: Number(gradeForm.marksObtained),
          feedback: gradeForm.feedback,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNotification({ type: "success", message: `Submission #${gradingSubmission.submissionNumber} graded successfully.` });
        setGradingSubmission(null);
        setGradeForm({ marksObtained: 0, feedback: "" });
        if (selectedAssignment) {
          selectAssignment(selectedAssignment);
        }
      } else {
        setNotification({ type: "error", message: data.message || "Failed to grade submission" });
      }
    } catch (err) {
      setNotification({ type: "error", message: "Network error saving evaluation" });
    } finally {
      setEvaluating(false);
    }
  };

  const filteredAssignments = assignments.filter((a) =>
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    (a.assignmentCode && a.assignmentCode.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Faculty Assignment & Grading Hub</h1>
          <p className="text-sm text-slate-500 mt-2">
            Review student repository submissions, grade practical assignments, and provide written feedback.
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Assignment</span>
        </button>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between text-xs font-semibold ${
            notification.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)} className="p-1 hover:bg-black/5 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Assignment List (4 cols) */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex flex-col gap-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search assignments..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {loading ? (
            <div className="text-center py-12 text-xs text-slate-400">Loading assignments...</div>
          ) : filteredAssignments.length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-400">No assignments found.</div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {filteredAssignments.map((assign) => {
                const isSelected = selectedAssignment?._id === assign._id;
                return (
                  <button
                    key={assign._id}
                    onClick={() => selectAssignment(assign)}
                    className={`w-full text-left p-4 rounded-2xl border transition flex items-center justify-between gap-3 ${
                      isSelected
                        ? "bg-indigo-50/70 border-indigo-300 text-indigo-950 shadow-sm"
                        : "bg-white border-slate-100 hover:border-slate-300 text-slate-700"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                          {assign.assignmentCode || "ASM"}
                        </span>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.2 rounded-full bg-slate-100 text-slate-600">
                          {assign.status}
                        </span>
                      </div>
                      <h4 className="font-bold text-xs truncate text-slate-900">{assign.title}</h4>
                      <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
                        <span>Max: {assign.totalMarks} pts</span>
                        <span>•</span>
                        <span>Due: {new Date(assign.dueDate).toLocaleDateString("en-IN")}</span>
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 shrink-0 ${isSelected ? "text-indigo-600" : "text-slate-300"}`} />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Submissions Grading Workspace (8 cols) */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col gap-6">
          {selectedAssignment ? (
            <>
              {/* Selected Assignment Summary Banner */}
              <div className="bg-slate-50/70 rounded-2xl p-5 border border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 font-mono">
                      {selectedAssignment.assignmentCode}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      Total Weight: {selectedAssignment.totalMarks} Marks (Pass: {selectedAssignment.passingMarks || 40})
                    </span>
                  </div>
                  <h2 className="text-lg font-extrabold text-slate-900">{selectedAssignment.title}</h2>
                </div>

                <div className="flex items-center gap-3 text-right">
                  <button
                    onClick={async () => {
                      if (!confirm("Are you sure you want to delete this assignment?")) return;
                      try {
                        const res = await fetch(`/api/assignments/${selectedAssignment._id}`, { method: "DELETE" });
                        const data = await res.json();
                        if (data.success) {
                          setSelectedAssignment(null);
                          fetchAssignments();
                          setNotification({ type: "success", message: "Assignment deleted successfully" });
                        } else {
                          setNotification({ type: "error", message: data.message || "Failed to delete assignment" });
                        }
                      } catch {
                        setNotification({ type: "error", message: "Network error while deleting assignment" });
                      }
                    }}
                    className="px-4 py-1.5 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-600 font-bold text-xs rounded-xl shadow-sm transition"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => {
                      setEditForm({
                        id: selectedAssignment._id,
                        title: selectedAssignment.title,
                        totalMarks: selectedAssignment.totalMarks,
                        passingMarks: selectedAssignment.passingMarks || 40,
                        instructions: selectedAssignment.description || "",
                        dueDate: selectedAssignment.dueDate ? new Date(selectedAssignment.dueDate).toISOString().split('T')[0] : "",
                      });
                      setEditAttachments([]);
                      setEditModalOpen(true);
                    }}
                    className="px-4 py-1.5 bg-white border border-slate-200 hover:border-indigo-300 text-indigo-600 font-bold text-xs rounded-xl shadow-sm transition"
                  >
                    Edit Assignment
                  </button>
                  <span className="text-xs font-bold text-indigo-600 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm">
                    {submissions.length} Total Submissions
                  </span>
                </div>
              </div>

              {/* Assignment Details (Rich Text & Attachments) */}
              {(selectedAssignment.description || (selectedAssignment.attachments && selectedAssignment.attachments.length > 0)) && (
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 mb-2">
                  {selectedAssignment.description && (
                    <div className="text-sm text-slate-700 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: selectedAssignment.description }} />
                  )}
                  {selectedAssignment.attachments && selectedAssignment.attachments.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-200">
                      <span className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Attachments</span>
                      <ul className="flex flex-col gap-2">
                        {selectedAssignment.attachments.map((att: any) => {
                          const isImage = att.fileType?.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp)$/i.test(att.fileName);
                          const isPdf = att.fileType === "application/pdf" || /\.pdf$/i.test(att.fileName);
                          const isDoc = att.fileType === "application/msword" || att.fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || /\.(doc|docx)$/i.test(att.fileName);
                          
                          return (
                          <li key={att._id.toString()} className="flex items-center justify-between bg-white border border-slate-200 rounded-lg p-2.5 shadow-sm">
                            <div className="flex items-center gap-3 overflow-hidden">
                              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
                                {isImage ? <ImageIcon className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                              </div>
                              <span className="text-xs font-medium text-slate-700 truncate" title={att.fileName}>
                                {att.fileName}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0 ml-4">
                              {(isImage || isPdf || isDoc) && (
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setPreviewFile({ fileUrl: att.fileUrl, fileName: att.fileName, fileType: att.fileType });
                                    setPreviewModalOpen(true);
                                  }}
                                  className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-md transition"
                                  title="Preview"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                              )}
                              <a
                                href={att.fileUrl}
                                download
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition"
                                title="Download"
                              >
                                <Download className="w-4 h-4" />
                              </a>
                            </div>
                          </li>
                        )})}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Submissions List */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Student Submissions Ledger
                </h3>

                {loadingSubmissions ? (
                  <div className="text-center py-12 text-xs text-slate-400">Loading student submissions...</div>
                ) : submissions.length === 0 ? (
                  <div className="text-center py-12 text-xs text-slate-400 bg-slate-50 rounded-2xl border border-slate-100">
                    No submissions received for this assignment yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-slate-100 text-slate-400 uppercase font-bold text-[10px] tracking-wider">
                        <tr>
                          <th className="pb-3">Student</th>
                          <th className="pb-3">Submission #</th>
                          <th className="pb-3">Submitted At</th>
                          <th className="pb-3">Status</th>
                          <th className="pb-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                        {submissions.map((sub) => {
                          const student = sub.student as any;
                          return (
                            <tr key={sub._id} className="hover:bg-slate-50/50 transition">
                              <td className="py-3.5">
                                <div className="font-bold text-slate-900">
                                  {student?.name || "Unknown Student"}
                                </div>
                                <div className="text-[11px] text-slate-400 font-mono">{student?.code}</div>
                              </td>
                              <td className="py-3.5 font-mono text-[11px] text-slate-500">
                                {sub.submissionNumber || "SUB-001"}
                              </td>
                              <td className="py-3.5 text-slate-500">
                                {new Date(sub.submittedAt).toLocaleDateString("en-IN", {
                                  dateStyle: "medium",
                                })}
                              </td>
                              <td className="py-3.5">
                                <span
                                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                    sub.status === "accepted"
                                      ? "bg-emerald-50 text-emerald-700"
                                      : sub.status === "late"
                                      ? "bg-amber-50 text-amber-700"
                                      : "bg-sky-50 text-sky-700"
                                  }`}
                                >
                                  {sub.status}
                                </span>
                              </td>
                              <td className="py-3.5 text-right">
                                <button
                                  onClick={() => {
                                    setGradingSubmission(sub);
                                    setGradeForm({ marksObtained: 0, feedback: "" });
                                  }}
                                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition"
                                >
                                  Review & Grade
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-16 text-slate-400 text-sm">
              Select an assignment from the left to review student submissions.
            </div>
          )}
        </div>
      </div>

      {/* Grade Submission Modal */}
      {gradingSubmission && (
        <Portal>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-hidden">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity"
              onClick={() => {
                if (!evaluating) setGradingSubmission(null);
              }}
            />

            {/* Modal Surface */}
            <div className="relative bg-white rounded-3xl max-w-5xl w-full shadow-2xl border border-slate-100 flex flex-col max-h-[calc(100vh-2.5rem)] sm:max-h-[calc(100vh-4rem)] overflow-hidden z-10 animate-scale-in">
              {/* Modal Header */}
              <div className="p-5 sm:p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50/70 rounded-t-3xl shrink-0">
                <div className="flex gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                    <ClipboardCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 font-mono bg-indigo-50 px-2 py-0.5 rounded">
                        {gradingSubmission.submissionNumber} (Attempt #{gradingSubmission.attemptNumber || 1})
                      </span>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        gradingSubmission.status === "accepted" ? "bg-emerald-100 text-emerald-700" :
                        gradingSubmission.status === "late" ? "bg-amber-100 text-amber-700" :
                        "bg-sky-100 text-sky-700"
                      }`}>
                        {gradingSubmission.status}
                      </span>
                    </div>
                    <h3 className="text-xl font-extrabold text-slate-900">
                      Review: {gradingSubmission.student?.name || "Unknown Student"}
                    </h3>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setGradingSubmission(null)}
                  disabled={evaluating}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition shrink-0"
                  aria-label="Close modal"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 overflow-y-auto flex-1">
              {/* Left Column: Context & Submission Content */}
              <div className="lg:col-span-8 flex flex-col gap-6">
                
                {/* Academic Context Block */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-100 text-xs">
                  <div>
                    <span className="block text-[10px] font-bold uppercase text-slate-400 mb-0.5">Student ID</span>
                    <span className="font-semibold text-slate-700 font-mono">{gradingSubmission.student?.code}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold uppercase text-slate-400 mb-0.5">Parent/Guardian</span>
                    <span className="font-semibold text-slate-700">{gradingSubmission.parent ? `${gradingSubmission.parent.firstName} ${gradingSubmission.parent.lastName}` : "Not Linked"}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold uppercase text-slate-400 mb-0.5">Submitted On</span>
                    <span className="font-semibold text-slate-700">
                      {new Date(gradingSubmission.submittedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                    </span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="block text-[10px] font-bold uppercase text-slate-400 mb-0.5">Program & Batch</span>
                    <span className="font-semibold text-slate-700">
                      {gradingSubmission.assignment?.course?.name || selectedAssignment?.course?.name || "N/A"} 
                      {" • "}
                      {gradingSubmission.assignment?.batch?.batchName || selectedAssignment?.batch?.batchName || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold uppercase text-slate-400 mb-0.5">Due Date</span>
                    <span className="font-semibold text-slate-700">
                      {selectedAssignment?.dueDate ? new Date(selectedAssignment.dueDate).toLocaleDateString("en-IN") : "N/A"}
                    </span>
                  </div>
                </div>

                {/* Submission Evidence */}
                <div>
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2 mb-4">
                    <FileText className="w-4 h-4 text-slate-400" />
                    Submission Content
                  </h4>

                  <div className="space-y-4 text-sm text-slate-700">
                    {gradingSubmission.studentNotes && (
                      <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100">
                        <strong className="block text-[10px] uppercase text-amber-600 mb-2">Student Response / Notes:</strong>
                        <div className="whitespace-pre-wrap">{gradingSubmission.studentNotes}</div>
                      </div>
                    )}

                    {gradingSubmission.repoUrl && (
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <strong className="block text-[10px] uppercase text-slate-400 mb-2">External Link / Repository:</strong>
                        <a href={gradingSubmission.repoUrl} target="_blank" rel="noreferrer" className="text-indigo-600 font-bold hover:underline inline-flex items-center gap-1.5 break-all">
                          <span>{gradingSubmission.repoUrl}</span>
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    )}

                    {gradingSubmission.fileUrls && gradingSubmission.fileUrls.filter((f: string) => f !== "submission-document.pdf").length > 0 && (
                      <div>
                        <strong className="block text-[10px] uppercase text-slate-400 mb-2">Attached Files:</strong>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {gradingSubmission.fileUrls.filter((f: string) => f !== "submission-document.pdf").map((url: string, i: number) => {
                            const isImage = url.match(/\.(jpeg|jpg|gif|png)$/i) != null;
                            const isPdf = url.match(/\.(pdf)$/i) != null;
                            return (
                              <a
                                key={i}
                                href={url}
                                target="_blank"
                                rel="noreferrer"
                                className="flex flex-col gap-2 p-3 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 transition group"
                              >
                                <div className="h-20 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden">
                                  {isImage ? (
                                    <img src={url} alt="Attachment" className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                                  ) : isPdf ? (
                                    <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded">PDF</span>
                                  ) : (
                                    <FileText className="w-8 h-8 text-slate-400" />
                                  )}
                                </div>
                                <span className="text-[11px] font-semibold text-slate-600 truncate">Document_{i + 1}</span>
                              </a>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {!gradingSubmission.studentNotes && !gradingSubmission.repoUrl && (!gradingSubmission.fileUrls || gradingSubmission.fileUrls.filter((f: string) => f !== "submission-document.pdf").length === 0) && (
                      <p className="text-slate-500 italic text-center py-6 bg-slate-50 rounded-xl">No content was provided in this submission.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Evaluation Panel */}
              <div className="lg:col-span-4 flex flex-col gap-5">
                <div className="bg-slate-900 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Award className="w-24 h-24" />
                  </div>
                  <h4 className="text-sm font-bold flex items-center gap-2 mb-4 relative z-10">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Evaluation Workspace
                  </h4>
                  
                  <form onSubmit={handleEvaluateSubmission} className="relative z-10 space-y-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                        Marks Awarded (Max: {selectedAssignment?.totalMarks || 100})
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={selectedAssignment?.totalMarks || 100}
                        required
                        value={gradeForm.marksObtained}
                        onChange={(e) => setGradeForm({ ...gradeForm, marksObtained: Number(e.target.value) })}
                        className="w-full px-3.5 py-2.5 bg-white/10 border border-white/20 rounded-xl text-lg font-bold text-white focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                        Instructor Feedback
                      </label>
                      <textarea
                        rows={4}
                        placeholder="Provide constructive feedback, highlight strengths, and note areas to improve..."
                        value={gradeForm.feedback}
                        onChange={(e) => setGradeForm({ ...gradeForm, feedback: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-white/10 border border-white/20 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                      />
                    </div>

                    <div className="pt-2 flex flex-col gap-2">
                      <button
                        type="submit"
                        disabled={evaluating}
                        className="w-full py-3 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 text-white text-sm font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2"
                      >
                        {evaluating ? "Saving Evaluation..." : "Submit Evaluation"}
                      </button>
                      <button
                        type="button"
                        className="w-full py-2.5 bg-transparent border border-slate-600 hover:bg-white/10 text-slate-300 text-xs font-bold rounded-xl transition"
                      >
                        Save Draft
                      </button>
                      <button
                        type="button"
                        className="w-full py-2.5 bg-transparent border border-rose-500/30 hover:bg-rose-500/20 text-rose-300 text-xs font-bold rounded-xl transition"
                      >
                        Return for Revision
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Portal>
      )}

      {/* Create Assignment Modal */}
      {createModalOpen && (
        <Portal>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-hidden">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
              onClick={() => {
                if (!creating) setCreateModalOpen(false);
              }}
            />

            {/* Modal Surface */}
            <div className="relative bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-100 flex flex-col max-h-[calc(100vh-2.5rem)] sm:max-h-[calc(100vh-4rem)] overflow-hidden z-10 animate-scale-in">
              <div className="p-5 sm:p-6 border-b border-slate-100 flex justify-between items-start shrink-0">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">Create New Assignment</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Publish a coursework project for your students.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  disabled={creating}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition shrink-0"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateAssignment} className="flex flex-col flex-1 overflow-hidden">
                <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Assignment Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Practical Web App Implementation"
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Course *</label>
                <select
                  required
                  value={createForm.courseId}
                  onChange={(e) => setCreateForm({ ...createForm, courseId: e.target.value, batchId: "" })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="" disabled>Select a course</option>
                  {courses.map((c) => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Target Batch / Cohort *</label>
                <select
                  required
                  value={createForm.batchId}
                  onChange={(e) => setCreateForm({ ...createForm, batchId: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  disabled={!createForm.courseId}
                >
                  <option value="" disabled>Select a batch</option>
                  {batches.filter((b) => b.course && b.course._id === createForm.courseId).map((b) => (
                    <option key={b._id} value={b._id}>{b.batchName}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Total Marks</label>
                  <input
                    type="number"
                    min={1}
                    value={createForm.totalMarks}
                    onChange={(e) => setCreateForm({ ...createForm, totalMarks: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Passing Marks</label>
                  <input
                    type="number"
                    min={1}
                    value={createForm.passingMarks}
                    onChange={(e) => setCreateForm({ ...createForm, passingMarks: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Submission Deadline</label>
                <input
                  type="date"
                  value={createForm.dueDate}
                  onChange={(e) => setCreateForm({ ...createForm, dueDate: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Assignment Description & Requirements</label>
                <div className="bg-white rounded-xl overflow-hidden border border-slate-200">
                  <ReactQuill
                    theme="snow"
                    value={createForm.instructions}
                    onChange={(val) => setCreateForm({ ...createForm, instructions: val })}
                    className="h-32 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-2">
                  <Paperclip className="w-4 h-4" />
                  Attachments (PDF, Doc, Images)
                </label>
                <input
                  type="file"
                  multiple
                  onChange={(e) => {
                    if (e.target.files) {
                      setAttachments(Array.from(e.target.files));
                    }
                  }}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
                {attachments.length > 0 && (
                  <ul className="mt-2 text-xs text-slate-600 space-y-1">
                    {attachments.map((f, i) => (
                      <li key={i}>• {f.name} ({(f.size / 1024).toFixed(1)} KB)</li>
                    ))}
                  </ul>
                )}
              </div>

                </div>

                <div className="flex justify-end gap-3 px-5 sm:px-6 py-4 bg-slate-50/60 border-t border-slate-100 shrink-0">
                  <button
                    type="button"
                    onClick={() => setCreateModalOpen(false)}
                    disabled={creating}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md transition"
                  >
                    {creating ? "Creating..." : "Publish Assignment"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}

      {/* Edit Assignment Modal */}
      {editModalOpen && (
        <Portal>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-hidden">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
              onClick={() => {
                if (!editing) setEditModalOpen(false);
              }}
            />

            {/* Modal Surface */}
            <div className="relative bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-100 flex flex-col max-h-[calc(100vh-2.5rem)] sm:max-h-[calc(100vh-4rem)] overflow-hidden z-10 animate-scale-in">
              <div className="p-5 sm:p-6 border-b border-slate-100 flex justify-between items-start shrink-0">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">Edit Assignment</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Update the details of this assignment.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  disabled={editing}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition shrink-0"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleEditAssignment} className="flex flex-col flex-1 overflow-hidden">
                <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Assignment Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Practical Web App Implementation"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Total Marks</label>
                  <input
                    type="number"
                    min={1}
                    value={editForm.totalMarks}
                    onChange={(e) => setEditForm({ ...editForm, totalMarks: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Passing Marks</label>
                  <input
                    type="number"
                    min={1}
                    value={editForm.passingMarks}
                    onChange={(e) => setEditForm({ ...editForm, passingMarks: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Submission Deadline</label>
                <input
                  type="date"
                  value={editForm.dueDate}
                  onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Assignment Description & Requirements</label>
                <div className="bg-white rounded-xl overflow-hidden border border-slate-200">
                  <ReactQuill
                    theme="snow"
                    value={editForm.instructions}
                    onChange={(val) => setEditForm({ ...editForm, instructions: val })}
                    className="h-32 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-2">
                  <Paperclip className="w-4 h-4" />
                  Existing Attachments
                </label>
                {selectedAssignment?.attachments && selectedAssignment.attachments.length > 0 ? (
                  <ul className="mb-4 space-y-2">
                    {selectedAssignment.attachments.map((att: any, i: number) => {
                      const isImage = att.fileType?.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp)$/i.test(att.fileName);
                      const isPdf = att.fileType === "application/pdf" || /\.pdf$/i.test(att.fileName);
                      const isDoc = att.fileType === "application/msword" || att.fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || /\.(doc|docx)$/i.test(att.fileName);
                      
                      return (
                      <li key={i} className="flex items-center gap-2 text-xs bg-slate-50 p-2 rounded-lg border border-slate-100">
                        {isImage ? <ImageIcon className="w-4 h-4 text-indigo-500 shrink-0" /> : <FileText className="w-4 h-4 text-indigo-500 shrink-0" />}
                        <span className="text-slate-700 flex-1 truncate" title={att.fileName}>
                          {att.fileName}
                        </span>
                        <span className="text-slate-400 mr-2 shrink-0">({(att.fileSize / 1024).toFixed(1)} KB)</span>
                        <div className="flex items-center gap-1 shrink-0">
                          {(isImage || isPdf || isDoc) && (
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                setPreviewFile({ fileUrl: att.fileUrl, fileName: att.fileName, fileType: att.fileType });
                                setPreviewModalOpen(true);
                              }}
                              className="p-1.5 text-indigo-600 hover:bg-indigo-100 rounded-md transition"
                              title="Preview"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          )}
                          <a
                            href={att.fileUrl}
                            download
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-100 rounded-md transition"
                            title="Download"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        </div>
                      </li>
                    )})}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-400 mb-4 italic">No existing attachments.</p>
                )}

                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-2">
                  <UploadCloud className="w-4 h-4" />
                  Add New Attachments (PDF, Doc, Images)
                </label>
                <input
                  type="file"
                  multiple
                  onChange={(e) => {
                    if (e.target.files) {
                      setEditAttachments(Array.from(e.target.files));
                    }
                  }}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
                {editAttachments.length > 0 && (
                  <ul className="mt-2 text-xs text-slate-600 space-y-1">
                    {editAttachments.map((f, i) => (
                      <li key={i}>• {f.name} ({(f.size / 1024).toFixed(1)} KB)</li>
                    ))}
                  </ul>
                )}
              </div>

                </div>

                <div className="flex justify-end gap-3 px-5 sm:px-6 py-4 bg-slate-50/60 border-t border-slate-100 shrink-0">
                  <button
                    type="button"
                    onClick={() => setEditModalOpen(false)}
                    disabled={editing}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editing}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md transition"
                  >
                    {editing ? "Updating..." : "Update Assignment"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}
      {/* Notification Toast */}
      {notification && (
        <div className={`fixed bottom-6 right-6 px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3 z-50 text-white transform transition-all duration-300 ease-out ${
          notification.type === "success" ? "bg-emerald-600 shadow-emerald-500/20" : "bg-red-600 shadow-red-500/20"
        }`}>
          {notification.type === "success" ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <p className="font-medium text-sm">{notification.message}</p>
          <button onClick={() => setNotification(null)} className="ml-2 text-white/80 hover:text-white transition">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Preview Modal */}
      {previewModalOpen && previewFile && (
        <Portal>
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-3 sm:p-6 overflow-hidden">
            {/* Backdrop click */}
            <div
              className="fixed inset-0"
              onClick={() => {
                setPreviewModalOpen(false);
                setPreviewFile(null);
              }}
            />

            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[calc(100vh-2.5rem)] sm:h-[88vh] flex flex-col overflow-hidden z-10 animate-scale-in">
              {/* Header */}
              <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
                    {previewFile.fileType?.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp)$/i.test(previewFile.fileName) ? (
                      <ImageIcon className="w-5 h-5" />
                    ) : (
                      <FileText className="w-5 h-5" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-slate-800 truncate">{previewFile.fileName}</h3>
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-0.5">Preview Mode</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={previewFile.fileUrl}
                    download
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 rounded-lg transition"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewModalOpen(false);
                      setPreviewFile(null);
                    }}
                    className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
                    aria-label="Close preview"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

            {/* Content Area */}
            <div className="flex-1 overflow-auto bg-slate-100 flex items-center justify-center p-6 relative">
              {previewFile.fileType?.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp)$/i.test(previewFile.fileName) ? (
                <img
                  src={previewFile.fileUrl}
                  alt={previewFile.fileName}
                  className="max-w-full max-h-full object-contain rounded-xl shadow-sm"
                />
              ) : previewFile.fileType === "application/pdf" || /\.pdf$/i.test(previewFile.fileName) ? (
                <iframe
                  src={`${previewFile.fileUrl}#toolbar=0`}
                  className="w-full h-full rounded-xl shadow-sm bg-white"
                  title={previewFile.fileName}
                />
              ) : previewFile.fileType === "application/msword" || previewFile.fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || /\.(doc|docx)$/i.test(previewFile.fileName) ? (
                <iframe
                  src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(
                    new URL(previewFile.fileUrl, window.location.origin).href
                  )}`}
                  className="w-full h-full rounded-xl shadow-sm bg-white"
                  title={previewFile.fileName}
                />
              ) : (
                <div className="text-center">
                  <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-sm font-bold text-slate-700 mb-1">Preview not available</p>
                  <p className="text-xs text-slate-500 mb-4">This file type cannot be previewed directly in the browser.</p>
                  <a
                    href={previewFile.fileUrl}
                    download
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition shadow-md shadow-indigo-200"
                  >
                    <Download className="w-4 h-4" />
                    Download File
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </Portal>
      )}
    </div>
  );
}
