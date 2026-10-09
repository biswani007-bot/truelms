"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Download, Settings, Grid3X3, List, Plus, Paperclip, Eye, FileText, Image as ImageIcon, UploadCloud } from "lucide-react";
import { EnterpriseDialog } from "@/components/ui/dialogs/EnterpriseDialog";
import { useToast } from "@/components/ui/dialogs/ToastProvider";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });


export default function AssignmentsDashboard() {
  const router = useRouter();
  const toast = useToast();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"grid" | "table">("grid");
  const [selectedAsm, setSelectedAsm] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [density, setDensity] = useState<"compact" | "normal" | "relaxed">("normal");

  // Dialog state
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createTitle, setCreateTitle] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [createMaxMarks, setCreateMaxMarks] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [createLoading, setCreateLoading] = useState(false);
  const [batches, setBatches] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [createCourseId, setCreateCourseId] = useState('');
  const [createBatchId, setCreateBatchId] = useState('');
  const [bulkAction, setBulkAction] = useState<string | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);

  // Edit state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedAsmEdit, setSelectedAsmEdit] = useState<any>(null);
  const [editForm, setEditForm] = useState({ title: "", description: "", maxMarks: "", dueDate: "" });
  const [editAttachments, setEditAttachments] = useState<File[]>([]);
  const [editLoading, setEditLoading] = useState(false);
  
  // Preview State for Admin
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<{ fileUrl: string, fileName: string, fileType?: string } | null>(null);

  // Column Visibility
  const [columns, setColumns] = useState({
    code: true,
    title: true,
    batch: true,
    marks: true,
    dueDate: true,
    status: true
  });
  const [showColMenu, setShowColMenu] = useState(false);

  const fetchAssignments = () => {
    setLoading(true);
    fetch(`/api/assignments?search=${search}&limit=100`)
      .then((res) => res.json())
      .then((data) => {
        const parsed = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data?.data?.data)
          ? data.data.data
          : [];
        setAssignments(parsed);
        setLoading(false);
      });
  };

  // Delete Confirmation State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [asmToDelete, setAsmToDelete] = useState<any>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const openDeleteModal = (asm: any) => {
    setAsmToDelete(asm);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!asmToDelete?._id) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/assignments/${asmToDelete._id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success("Assignment Deleted", `"${asmToDelete.title}" has been deleted.`);
        setDeleteModalOpen(false);
        setAsmToDelete(null);
        fetchAssignments();
      } else {
        toast.error("Delete Failed", data.message || "Failed to delete assignment");
      }
    } catch {
      toast.error("Network Error", "Network error while deleting assignment");
    } finally {
      setDeleteLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
    fetch('/api/batches?limit=100')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.data)) {
          setBatches(data.data);
          const uniqueCourses = new Map();
          data.data.forEach((b: any) => {
            const courseId = b.course?.id || b.course?._id;
            if (courseId) {
              uniqueCourses.set(courseId, { _id: courseId, name: b.course.courseName || b.course.name || b.course.title || 'Unknown Course' });
            }
          });
          setCourses(Array.from(uniqueCourses.values()));
        }
      });
  }, [search]);

  const openEditModal = async (asm: any) => {
    try {
      setEditLoading(true);
      const detailRes = await fetch(`/api/assignments/${asm._id}`);
      const detailData = await detailRes.json();
      if (detailData.success) {
        setSelectedAsmEdit(detailData.data);
      } else {
        setSelectedAsmEdit(asm);
      }
    } catch {
      setSelectedAsmEdit(asm);
    } finally {
      setEditLoading(false);
    }
    
    setEditForm({
      title: asm.title || "",
      description: asm.description || "",
      maxMarks: asm.totalMarks?.toString() || "",
      dueDate: asm.dueDate ? new Date(asm.dueDate).toISOString().split('T')[0] : "",
    });
    setEditAttachments([]);
    setEditModalOpen(true);
  };

  const handleEditConfirm = async () => {
    if (!editForm.title.trim() || !editForm.maxMarks.trim()) {
      toast.error("Validation Error", "Title and maximum marks are required.");
      return;
    }
    setEditLoading(true);
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

      const res = await fetch(`/api/assignments/${selectedAsmEdit._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editForm.title.trim(),
          description: editForm.description,
          totalMarks: Number(editForm.maxMarks),
          dueDate: editForm.dueDate ? new Date(editForm.dueDate) : undefined,
          attachments: uploadedAttachments,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEditModalOpen(false);
        fetchAssignments();
        toast.success("Assignment Updated", `"${editForm.title}" has been updated successfully.`);
      } else {
        toast.error("Update Failed", data.error || data.message || "Unable to update assignment.");
      }
    } catch {
      toast.error("Network Error", "Failed to connect to the server.");
    } finally {
      setEditLoading(false);
    }
  };

  const handleBulkConfirm = async () => {
    if (!bulkAction) return;
    setBulkLoading(true);
    await new Promise((r) => setTimeout(r, 500));
    setSelectedAsm([]);
    fetchAssignments();
    setBulkLoading(false);
    setBulkAction(null);
    toast.success("Bulk Action Applied", `${bulkAction} applied to selected assignments.`);
  };

  const handleCreateConfirm = async () => {
    if (!createTitle.trim() || !createMaxMarks.trim() || !createBatchId) {
      toast.error("Validation Error", "Title, maximum marks, and batch are required.");
      return;
    }
    setCreateLoading(true);
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
          title: createTitle.trim(),
          description: createDescription,
          totalMarks: Number(createMaxMarks),
          batchId: createBatchId,
          dueDate: new Date(Date.now() + 7 * 24 * 3600000),
          attachments: uploadedAttachments,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowCreateDialog(false);
        setCreateTitle("");
        setCreateDescription("");
        setCreateMaxMarks("");
        setCreateCourseId("");
        setCreateBatchId("");
        setAttachments([]);
        fetchAssignments();
        toast.success("Assignment Created", `"${createTitle}" has been created as a draft.`);
      } else {
        toast.error("Creation Failed", data.error || data.message || "Unable to create assignment.");
      }
    } catch {
      toast.error("Network Error", "Failed to connect to the server.");
    } finally {
      setCreateLoading(false);
    }
  };

  const exportCSV = () => {
    const headers = ["Code", "Title", "Batch", "Max Marks", "Due Date", "Status"];
    const rows = filteredAssignments.map(a => [
      a.assignmentCode,
      a.title,
      a.batch?.batchName || "N/A",
      a.totalMarks,
      new Date(a.dueDate).toLocaleDateString(),
      a.status
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "lmsca_assignments.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredAssignments = assignments.filter(a => {
    if (statusFilter === "ALL") return true;
    return a.status === statusFilter;
  });

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="sticky top-0 bg-slate-50 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 z-20 border-b border-slate-200/80">
        <div>
          <h1 className="lms-page-title">Assignment Ledger</h1>
          <p className="lms-caption mt-1">Design academic assignments, view student submission queues, and manage rubrics.</p>
        </div>
        <button
          onClick={() => { setCreateTitle(""); setCreateMaxMarks(""); setShowCreateDialog(true); }}
          className="lms-btn lms-btn-primary"
        >
          <Plus className="size-4" />
          Create Assignment
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
        {/* Toolbar & Filters */}
        <div className="p-4 border-b border-gray-100 flex flex-wrap justify-between items-center gap-4 bg-gray-50/50">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search assignments..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 border rounded-lg text-sm bg-white focus:outline-none"
              />
            </div>
            
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 border rounded-lg text-sm bg-white"
            >
              <option value="ALL">All Statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          <div className="flex items-center gap-3 relative">
            <button onClick={exportCSV} className="p-2 border bg-white hover:bg-gray-50 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition-colors">
              <Download className="size-4" /> Export
            </button>

            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setView("grid")}
                className={`p-1.5 rounded-md ${view === "grid" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}
              >
                <Grid3X3 className="size-4" />
              </button>
              <button
                onClick={() => setView("table")}
                className={`p-1.5 rounded-md ${view === "table" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}
              >
                <List className="size-4" />
              </button>
            </div>

            <button
              onClick={() => setShowColMenu(!showColMenu)}
              className="p-2 border bg-white rounded-lg text-sm hover:bg-gray-50 transition-colors"
              aria-label="Column visibility"
            >
              <Settings className="size-4" />
            </button>
            {showColMenu && (
              <div className="absolute right-0 top-11 bg-white border shadow-lg rounded-lg p-3 z-35 space-y-2 text-xs font-semibold text-gray-700 w-44">
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={columns.code} onChange={() => setColumns(p=>({...p, code: !p.code}))} id="col-code" />
                  <label htmlFor="col-code">Code</label>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={columns.title} onChange={() => setColumns(p=>({...p, title: !p.title}))} id="col-title" />
                  <label htmlFor="col-title">Title</label>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={columns.batch} onChange={() => setColumns(p=>({...p, batch: !p.batch}))} id="col-batch" />
                  <label htmlFor="col-batch">Batch</label>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={columns.marks} onChange={() => setColumns(p=>({...p, marks: !p.marks}))} id="col-marks" />
                  <label htmlFor="col-marks">Max Marks</label>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Selected Items toolbar */}
        {selectedAsm.length > 0 && (
          <div className="bg-indigo-50 border-b border-indigo-100 px-4 py-2.5 flex justify-between items-center sticky top-14 z-[15]">
            <span className="text-xs font-bold text-indigo-700">{selectedAsm.length} items selected</span>
            <div className="flex gap-2">
              <button onClick={() => setBulkAction("publish")} className="px-3 py-1 bg-indigo-600 text-white rounded text-xs font-bold hover:bg-indigo-700 transition-colors">Bulk Publish</button>
              <button onClick={() => setBulkAction("close")} className="px-3 py-1 bg-white border border-indigo-300 text-indigo-700 rounded text-xs font-bold hover:bg-indigo-50 transition-colors">Bulk Close</button>
            </div>
          </div>
        )}

        {/* Data list */}
        {loading ? (
          <div className="py-12 text-center text-gray-400">Loading assignments...</div>
        ) : view === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {filteredAssignments.map((asm) => (
              <div key={asm._id} className="bg-slate-50 border border-gray-250 p-5 rounded-xl flex flex-col justify-between hover:border-indigo-400 hover:shadow transition">
                <div>
                  <div className="flex justify-between items-start">
                    <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-600 border border-indigo-200 text-[10px] font-bold uppercase">{asm.assignmentCode}</span>
                    <span className="text-xs font-bold text-gray-500 uppercase">{asm.status}</span>
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 mt-3">{asm.title}</h3>
                  <div className="text-xs text-gray-500 mt-2 space-y-1">
                    <div>Batch: {asm.batch?.batchName || "N/A"}</div>
                    <div>Max Marks: {asm.totalMarks} Marks</div>
                    <div>Due: {new Date(asm.dueDate).toLocaleDateString()}</div>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Link 
                    href={`/admin/assignments/${asm._id}`}
                    className="flex-1 block text-center py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg border border-indigo-200 transition"
                  >
                    Details
                  </Link>
                  <button 
                    onClick={() => openEditModal(asm)}
                    className="flex-1 block text-center py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => openDeleteModal(asm)}
                    className="flex-1 block text-center py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-lg border border-rose-200 transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-gray-500 text-xs font-semibold uppercase tracking-wider">
                  <th className="p-4 w-12">
                    <input 
                      type="checkbox" 
                      checked={selectedAsm.length === filteredAssignments.length}
                      onChange={() => {
                        if (selectedAsm.length === filteredAssignments.length) setSelectedAsm([]);
                        else setSelectedAsm(filteredAssignments.map(a => a._id));
                      }}
                      className="rounded" 
                    />
                  </th>
                  {columns.code && <th className="p-4">Code</th>}
                  {columns.title && <th className="p-4">Title</th>}
                  {columns.batch && <th className="p-4">Batch</th>}
                  {columns.marks && <th className="p-4">Max Marks</th>}
                  {columns.dueDate && <th className="p-4">Due Date</th>}
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredAssignments.map((asm) => (
                  <tr key={asm._id} className="hover:bg-gray-50/50 transition">
                    <td className="p-4">
                      <input 
                        type="checkbox" 
                        checked={selectedAsm.includes(asm._id)}
                        onChange={() => setSelectedAsm(prev => prev.includes(asm._id) ? prev.filter(i => i !== asm._id) : [...prev, asm._id])}
                        className="rounded" 
                      />
                    </td>
                    {columns.code && <td className="p-4 font-mono text-xs font-bold text-indigo-650">{asm.assignmentCode}</td>}
                    {columns.title && <td className="p-4 font-semibold text-gray-900">{asm.title}</td>}
                    {columns.batch && <td className="p-4 text-gray-500">{asm.batch?.batchName || "N/A"}</td>}
                    {columns.marks && <td className="p-4 font-bold text-gray-900">{asm.totalMarks} Marks</td>}
                    {columns.dueDate && <td className="p-4 text-gray-400 text-xs">{new Date(asm.dueDate).toLocaleDateString()}</td>}
                    <td className="p-4 text-right">
                      <button onClick={() => openEditModal(asm)} className="text-xs font-bold text-indigo-600 hover:text-indigo-800 mr-3">
                        Edit
                      </button>
                      <button onClick={() => openDeleteModal(asm)} className="text-xs font-bold text-rose-600 hover:text-rose-800 mr-3">
                        Delete
                      </button>
                      <Link href={`/admin/assignments/${asm._id}`} className="text-xs font-bold text-slate-600 hover:text-slate-800">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Assignment Dialog */}
      <EnterpriseDialog
        isOpen={showCreateDialog}
        onClose={() => { if (!createLoading) setShowCreateDialog(false); }}
        title="Create New Assignment"
        subtitle="Add an assignment to the ledger"
        variant="info"
        confirmLabel="Create Assignment"
        cancelLabel="Cancel"
        onConfirm={handleCreateConfirm}
        loading={createLoading}
      >
        <div className="space-y-4">
          <div>
            <label className="lms-label block mb-1.5" htmlFor="asm-title">Assignment Title *</label>
            <input
              id="asm-title"
              type="text"
              placeholder="e.g. Mid-Term Project Report"
              value={createTitle}
              onChange={(e) => setCreateTitle(e.target.value)}
              className="lms-input"
              disabled={createLoading}
              autoFocus
            />
          </div>
          <div>
            <label className="lms-label block mb-1.5">Course *</label>
            <select
              value={createCourseId}
              onChange={(e) => { setCreateCourseId(e.target.value); setCreateBatchId(""); }}
              className="lms-input"
              disabled={createLoading}
            >
              <option value="" disabled>Select a course</option>
              {courses.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="lms-label block mb-1.5">Batch *</label>
            <select
              value={createBatchId}
              onChange={(e) => setCreateBatchId(e.target.value)}
              className="lms-input"
              disabled={!createCourseId || createLoading}
            >
              <option value="" disabled>Select a batch</option>
              {batches.filter((b: any) => b.course && b.course._id === createCourseId).map((b: any) => (
                <option key={b._id} value={b._id}>{b.batchName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="lms-label block mb-1.5" htmlFor="asm-marks">Maximum Marks *</label>
            <input
              id="asm-marks"
              type="number"
              placeholder="e.g. 100"
              value={createMaxMarks}
              onChange={(e) => setCreateMaxMarks(e.target.value)}
              className="lms-input"
              disabled={createLoading}
            />
          </div>
          <div>
            <label className="lms-label block mb-1.5">Description / Instructions</label>
            <div className="bg-white rounded-xl overflow-hidden border border-slate-200">
              <ReactQuill
                theme="snow"
                value={createDescription}
                onChange={(val) => setCreateDescription(val)}
                className="h-32 text-xs"
              />
            </div>
          </div>
          <div className="pt-6">
            <label className="lms-label block mb-1.5 flex items-center gap-2">
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
      </EnterpriseDialog>

      <EnterpriseDialog
        isOpen={editModalOpen}
        onClose={() => { if (!editLoading) setEditModalOpen(false); }}
        title="Edit Assignment"
        subtitle="Update assignment details"
        variant="info"
        confirmLabel="Update Assignment"
        cancelLabel="Cancel"
        onConfirm={handleEditConfirm}
        loading={editLoading}
      >
        <div className="space-y-4">
          <div>
            <label className="lms-label block mb-1.5" htmlFor="edit-title">Assignment Title *</label>
            <input
              id="edit-title"
              type="text"
              placeholder="e.g. Mid-Term Project Report"
              value={editForm.title}
              onChange={(e) => setEditForm(p=>({...p, title: e.target.value}))}
              className="lms-input"
              disabled={editLoading}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="lms-label block mb-1.5" htmlFor="edit-marks">Maximum Marks *</label>
              <input
                id="edit-marks"
                type="number"
                value={editForm.maxMarks}
                onChange={(e) => setEditForm(p=>({...p, maxMarks: e.target.value}))}
                className="lms-input"
                disabled={editLoading}
              />
            </div>
            <div>
              <label className="lms-label block mb-1.5" htmlFor="edit-date">Due Date</label>
              <input
                id="edit-date"
                type="date"
                value={editForm.dueDate}
                onChange={(e) => setEditForm(p=>({...p, dueDate: e.target.value}))}
                className="lms-input"
                disabled={editLoading}
              />
            </div>
          </div>
          <div>
            <label className="lms-label block mb-1.5">Description / Instructions</label>
            <div className="bg-white rounded-xl overflow-hidden border border-slate-200">
              <ReactQuill
                theme="snow"
                value={editForm.description}
                onChange={(val) => setEditForm(p=>({...p, description: val}))}
                className="h-32 text-xs"
              />
            </div>
          </div>
          <div className="pt-6">
            <label className="lms-label block mb-2 flex items-center gap-2">
              <Paperclip className="w-4 h-4" />
              Existing Attachments
            </label>
            {selectedAsmEdit?.attachments && selectedAsmEdit.attachments.length > 0 ? (
              <ul className="mb-4 space-y-2">
                {selectedAsmEdit.attachments.map((att: any, i: number) => {
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

            <label className="lms-label block mb-1.5 flex items-center gap-2">
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
      </EnterpriseDialog>

      {/* Preview Modal */}
      {previewModalOpen && previewFile && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[95vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{previewFile.fileName}</h3>
                  <p className="text-xs text-slate-500">Document Preview</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={previewFile.fileUrl}
                  download
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition flex items-center gap-2 text-xs font-bold"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Download</span>
                </a>
                <button
                  onClick={() => setPreviewModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto bg-slate-100/50 p-4 min-h-[500px] flex justify-center">
              {(previewFile.fileType?.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp)$/i.test(previewFile.fileName)) ? (
                <img src={previewFile.fileUrl} alt={previewFile.fileName} className="max-w-full object-contain rounded-lg shadow-sm border border-slate-200 bg-white" />
              ) : (previewFile.fileType === "application/pdf" || /\.pdf$/i.test(previewFile.fileName)) ? (
                <iframe src={previewFile.fileUrl} className="w-full h-full min-h-[500px] rounded-lg shadow-sm border border-slate-200 bg-white" title="PDF Preview" />
              ) : (
                <iframe 
                  src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(previewFile.fileUrl)}`} 
                  className="w-full h-full min-h-[500px] rounded-lg shadow-sm border border-slate-200 bg-white" 
                  title="Document Preview" 
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bulk Action Dialog */}
      <EnterpriseDialog
        isOpen={!!bulkAction}
        onClose={() => { if (!bulkLoading) setBulkAction(null); }}
        title={`Bulk ${bulkAction === "publish" ? "Publish" : "Close"} Assignments`}
        subtitle={`This will affect ${selectedAsm.length} selected assignment(s)`}
        description={bulkAction === "publish" ? "Selected assignments will be published and visible to students." : "Selected assignments will be closed. Students will no longer be able to submit."}
        variant={bulkAction === "close" ? "warning" : "info"}
        confirmLabel={bulkAction === "publish" ? "Publish Assignments" : "Close Assignments"}
        cancelLabel="Cancel"
        onConfirm={handleBulkConfirm}
        loading={bulkLoading}
      />

      {/* Delete Assignment Confirmation Dialog */}
      <EnterpriseDialog
        isOpen={deleteModalOpen}
        onClose={() => { if (!deleteLoading) { setDeleteModalOpen(false); setAsmToDelete(null); } }}
        title="Delete Assignment"
        subtitle="Archive Assignment"
        description={
          asmToDelete
            ? `Are you sure you want to delete "${asmToDelete.title}" (${asmToDelete.assignmentCode})? This action will archive the assignment record.`
            : "Are you sure you want to delete this assignment?"
        }
        variant="delete"
        confirmLabel="Delete Assignment"
        cancelLabel="Cancel"
        onConfirm={handleConfirmDelete}
        loading={deleteLoading}
      />
    </div>
  );
}
