"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  Upload,
  CheckCircle2,
  XCircle,
  Eye,
  AlertCircle,
  Clock,
  Loader2,
  FileCheck,
  X,
} from "lucide-react";

interface StudentDocumentItem {
  _id: string;
  student: string;
  documentType: string;
  title: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  verificationStatus: "pending" | "verified" | "rejected";
  verifiedBy?: { firstName?: string; lastName?: string };
  verifiedAt?: string;
  rejectionReason?: string;
  createdAt: string;
}

interface StudentDocumentsManagerProps {
  studentId: string;
  initialDocuments?: StudentDocumentItem[];
}

export function StudentDocumentsManager({
  studentId,
  initialDocuments = [],
}: StudentDocumentsManagerProps) {
  const [documents, setDocuments] = useState<StudentDocumentItem[]>(initialDocuments);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<string>("id_proof");
  const [docTitle, setDocTitle] = useState<string>("");

  // Reject Modal State
  const [rejectingDocId, setRejectingDocId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>("");

  // Preview Modal State
  const [previewDoc, setPreviewDoc] = useState<StudentDocumentItem | null>(null);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/students/${studentId}/documents`);
      if (res.ok) {
        const json = await res.json();
        setDocuments(json.data || []);
      }
    } catch {
      setErrorMessage("Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialDocuments.length === 0) {
      fetchDocuments();
    }
  }, [studentId]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMessage("Please select a file to upload");
      return;
    }

    setUploading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("documentType", documentType);
    formData.append("title", docTitle.trim() || selectedFile.name);

    try {
      const res = await fetch(`/api/students/${studentId}/documents`, {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || "Failed to upload document");
      }

      setSuccessMessage(`Document "${json.data?.title || "Document"}" uploaded successfully`);
      setSelectedFile(null);
      setDocTitle("");
      await fetchDocuments();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Upload error");
    } finally {
      setUploading(false);
    }
  };

  const handleVerify = async (docId: string) => {
    setProcessingId(docId);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch(`/api/students/${studentId}/documents/${docId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verificationStatus: "verified" }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || "Verification failed");
      }

      setSuccessMessage("Document verified successfully");
      await fetchDocuments();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Verification error");
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectingDocId) return;

    setProcessingId(rejectingDocId);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch(`/api/students/${studentId}/documents/${rejectingDocId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verificationStatus: "rejected",
          rejectionReason: rejectionReason.trim() || "Rejected by administrator",
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || "Rejection failed");
      }

      setSuccessMessage("Document rejected");
      setRejectingDocId(null);
      setRejectionReason("");
      await fetchDocuments();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Rejection error");
    } finally {
      setProcessingId(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getDocTypeLabel = (type: string) => {
    switch (type) {
      case "id_proof":
        return "ID Proof";
      case "transcript":
        return "Transcript / Grade Card";
      case "birth_certificate":
        return "Birth Certificate";
      case "address_proof":
        return "Address Proof";
      case "medical_record":
        return "Medical Record";
      default:
        return "Other Document";
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileCheck className="size-5 text-indigo-600" />
            Document Verification & Records
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Upload, verify, approve, or reject student official transcripts, identification, and certificates.
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 w-fit">
          {documents.length} {documents.length === 1 ? "Record" : "Records"}
        </span>
      </div>

      {/* Messages */}
      {errorMessage && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-red-500 hover:text-red-800">
            <X className="size-4" />
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-500 hover:text-emerald-800">
            <X className="size-4" />
          </button>
        </div>
      )}

      {/* Upload Box */}
      <form onSubmit={handleUpload} className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 flex flex-col gap-3">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
          <Upload className="size-3.5 text-indigo-600" />
          Upload New Document
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Document Type</label>
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="id_proof">Government ID / Passport</option>
              <option value="transcript">Transcript / Prior Marksheet</option>
              <option value="birth_certificate">Birth Certificate</option>
              <option value="address_proof">Address Proof</option>
              <option value="medical_record">Medical Record / Clearance</option>
              <option value="other">Other Official Document</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Document Title (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Grade 10 Final Transcript"
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Select File (PDF, PNG, JPG)</label>
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.webp"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="w-full text-xs text-slate-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
            />
          </div>
        </div>

        <div className="flex justify-end mt-1">
          <button
            type="submit"
            disabled={uploading || !selectedFile}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors shadow-sm"
          >
            {uploading ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                Uploading Document...
              </>
            ) : (
              <>
                <Upload className="size-3.5" />
                Upload & Register
              </>
            )}
          </button>
        </div>
      </form>

      {/* Documents List */}
      <div className="flex flex-col gap-3">
        {loading ? (
          <div className="py-8 flex justify-center text-slate-400 text-xs gap-2 items-center">
            <Loader2 className="size-4 animate-spin" />
            Loading documents...
          </div>
        ) : documents.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
            No documents uploaded for this student yet. Upload an ID or transcript above.
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Document</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Size & Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {documents.map((doc) => {
                  const isProcessing = processingId === doc._id;
                  return (
                    <tr key={doc._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 shrink-0">
                            <FileText className="size-4" />
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">{doc.title}</div>
                            <div className="text-[11px] text-slate-400 truncate max-w-xs">{doc.fileName}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-slate-600">
                        <span className="font-medium">{getDocTypeLabel(doc.documentType)}</span>
                      </td>

                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        <div>{formatFileSize(doc.fileSize)}</div>
                        <div className="text-slate-400 flex items-center gap-1 mt-0.5">
                          <Clock className="size-3" />
                          {new Date(doc.createdAt).toLocaleDateString()}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {doc.verificationStatus === "verified" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="size-3" />
                            Verified
                          </span>
                        ) : doc.verificationStatus === "rejected" ? (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                              <XCircle className="size-3" />
                              Rejected
                            </span>
                            {doc.rejectionReason && (
                              <div className="text-[10px] text-red-600 mt-1 italic max-w-xs">
                                Reason: {doc.rejectionReason}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="size-3" />
                            Pending Review
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {/* Preview Button */}
                          <button
                            type="button"
                            onClick={() => setPreviewDoc(doc)}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
                            title="Preview Document"
                          >
                            <Eye className="size-3.5" />
                          </button>

                          {/* Verify Button */}
                          {doc.verificationStatus !== "verified" && (
                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() => handleVerify(doc._id)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium text-[11px] inline-flex items-center gap-1 transition-colors"
                              title="Verify / Approve Document"
                            >
                              <CheckCircle2 className="size-3" />
                              Verify
                            </button>
                          )}

                          {/* Reject Button */}
                          {doc.verificationStatus !== "rejected" && (
                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() => {
                                setRejectingDocId(doc._id);
                                setRejectionReason("");
                              }}
                              className="px-2.5 py-1 rounded-lg bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 disabled:opacity-50 font-medium text-[11px] inline-flex items-center gap-1 transition-colors"
                              title="Reject Document"
                            >
                              <XCircle className="size-3" />
                              Reject
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {rejectingDocId && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <AlertCircle className="size-4 text-red-600" />
                Reject Student Document
              </h3>
              <button
                onClick={() => setRejectingDocId(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="size-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Please specify the rejection reason so the applicant or student can upload a corrected version.
            </p>

            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Document image is blurry and illegible, or ID has expired."
              className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500"
            />

            <div className="flex justify-end gap-2 mt-2">
              <button
                type="button"
                onClick={() => setRejectingDocId(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={processingId === rejectingDocId}
                onClick={handleRejectConfirm}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 rounded-lg transition shadow-sm"
              >
                {processingId === rejectingDocId ? "Rejecting..." : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-sm font-bold text-slate-900">{previewDoc.title}</h3>
                <p className="text-[11px] text-slate-500">{previewDoc.fileName} · {formatFileSize(previewDoc.fileSize)}</p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={previewDoc.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1 text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition"
                >
                  Open in New Tab
                </a>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="size-5" />
                </button>
              </div>
            </div>

            <div className="p-4 overflow-auto flex-1 flex items-center justify-center bg-slate-100/60 min-h-[350px]">
              {previewDoc.mimeType === "application/pdf" ? (
                <iframe
                  src={previewDoc.fileUrl}
                  className="w-full h-[500px] rounded-lg border border-slate-200"
                  title="PDF Preview"
                />
              ) : previewDoc.mimeType.startsWith("image/") ? (
                <img
                  src={previewDoc.fileUrl}
                  alt={previewDoc.title}
                  className="max-h-[500px] max-w-full rounded-lg object-contain border border-slate-200 bg-white"
                />
              ) : (
                <div className="text-center p-8 text-slate-500 text-xs">
                  <FileText className="size-12 mx-auto text-slate-300 mb-2" />
                  Preview not directly supported in-page.
                  <div className="mt-3">
                    <a
                      href={previewDoc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-500 transition"
                    >
                      Download Document
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
