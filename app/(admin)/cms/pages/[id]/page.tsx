"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, Save, Globe, Clock, Maximize2, Copy, 
  Trash2, RefreshCw, BookOpen, Monitor, Tablet, Phone, 
  CircleCheck, TriangleAlert, Settings, ChevronsLeft 
} from "lucide-react";
import Link from "next/link";
import { ArchiveDialog } from "@/components/ui/dialogs/EnterpriseDialog";
import { useToast } from "@/components/ui/dialogs/ToastProvider";

export default function CMSPageEditor() {
  const params = useParams() || {};
  const router = useRouter();
  const toast = useToast();
  const id = (params.id || "") as string;
  const isNew = id === "new";
  
  const [loading, setLoading] = useState(!isNew && !!id);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState("Idle");
  const [previewMode, setPreviewMode] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [showPreview, setShowPreview] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"editor" | "revisions" | "checklist">("editor");

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    content: "",
    status: "DRAFT",
    template: "default",
    seoTitle: "",
    seoDescription: "",
    canonicalUrl: ""
  });

  const [revisions, setRevisions] = useState<any[]>([]);
  const [selectedRevision, setSelectedRevision] = useState<any>(null);

  // Auto-save Interval Ref
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    if (!isNew) {
      fetch(`/api/admin/cms/pages/${id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data) {
            setFormData(data.data);
            // Mock version history if empty, or load
            setRevisions(data.data.versionHistory || [
              { version: 1, content: data.data.content, updatedAt: data.data.updatedAt, updatedBy: "System" }
            ]);
          }
          setLoading(false);
        });
    }
  }, [id, isNew]);

  // Unsaved changes warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "You have unsaved changes. Are you sure you want to leave?";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  // Keyboard Shortcuts (Cmd+S / Ctrl+S to save)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [formData, isDirty]);

  // Auto-save setup
  useEffect(() => {
    if (isDirty && !isNew) {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
      autoSaveTimer.current = setTimeout(() => {
        handleAutoSave();
      }, 15000); // Auto-save after 15s of idle
    }
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, [formData, isDirty]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setIsDirty(true);
  };

  const handleAutoSave = async () => {
    setAutoSaveStatus("Saving...");
    try {
      const res = await fetch(`/api/admin/cms/pages/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, status: "DRAFT" })
      });
      const data = await res.json();
      if (data.success) {
        setAutoSaveStatus("Auto-saved");
        setIsDirty(false);
      } else {
        setAutoSaveStatus("Failed");
      }
    } catch (e) {
      setAutoSaveStatus("Failed");
    }
  };

  const handleSave = async (statusOverride?: string) => {
    setSaving(true);
    const payload = { ...formData };
    if (statusOverride) {
      payload.status = statusOverride;
    }

    const url = isNew ? `/api/admin/cms/pages` : `/api/admin/cms/pages/${params.id}`;
    const method = isNew ? "POST" : "PUT";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setIsDirty(false);
        toast.success("Page Saved", `Page "${payload.title}" saved successfully.`);
        if (isNew) {
          router.push(`/cms/pages/${data.data._id}`);
        } else {
          setFormData(data.data);
          setRevisions(data.data.versionHistory || [
            { version: revisions.length + 1, content: payload.content, updatedAt: new Date(), updatedBy: "You" },
            ...revisions
          ]);
        }
      } else {
        toast.error("Save Failed", data.error || "Failed to save page.");
      }
    } catch (e) {
      console.error(e);
      toast.error("Network Error", "An error occurred while saving page.");
    }
    setSaving(false);
  };

  const handleDuplicate = async () => {
    if (isNew) return;
    const duplicatedData = {
      ...formData,
      title: `${formData.title} (Copy)`,
      slug: `${formData.slug}-copy`,
      status: "DRAFT"
    };
    try {
      const res = await fetch(`/api/admin/cms/pages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(duplicatedData)
      });
      const data = await res.json();
      if (data.success) {
        router.push(`/cms/pages/${data.data._id}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleArchiveConfirm = async () => {
    if (isNew) return;
    await handleSave("ARCHIVED");
    setShowArchiveModal(false);
  };

  const getChecklistItems = () => {
    return [
      { label: "Page title is set", pass: formData.title.length > 3 },
      { label: "URL slug is configured", pass: formData.slug.length > 2 },
      { label: "Body content is not empty", pass: formData.content.length > 50 },
      { label: "SEO Meta title is defined", pass: !!formData.seoTitle },
      { label: "SEO Meta description is descriptive", pass: (formData.seoDescription?.length || 0) > 30 }
    ];
  };

  if (loading) return <div className="p-8 text-gray-500">Loading editor...</div>;

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
      {/* Sticky Action Toolbar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm z-10 shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/cms/pages" className="p-2 -ml-2 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{isNew ? "Create Page" : "Edit Page"}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                formData.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-700' :
                formData.status === 'DRAFT' ? 'bg-gray-100 text-gray-700' :
                'bg-indigo-100 text-indigo-700'
              }`}>
                {formData.status}
              </span>
              <span className="text-xs text-gray-400 font-medium">
                {isDirty ? "● Unsaved Changes" : `✓ Saved (${autoSaveStatus})`}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-1.5 px-3.5 py-2 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-semibold text-sm rounded-lg shadow-sm transition"
          >
            <Maximize2 className="w-4 h-4" />
            {showPreview ? "Edit Mode" : "Open Preview"}
          </button>

          {!isNew && (
            <>
              <button 
                onClick={handleDuplicate}
                title="Duplicate Page"
                className="p-2 border border-gray-300 bg-white hover:bg-gray-50 text-gray-600 rounded-lg shadow-sm transition"
              >
                <Copy className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setShowArchiveModal(true)}
                title="Archive Page"
                className="p-2 border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg shadow-sm transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}

          <button 
            onClick={() => handleSave("DRAFT")}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-semibold text-sm rounded-lg shadow-sm transition"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save Draft"}
          </button>
          
          <button 
            onClick={() => handleSave("PUBLISHED")}
            disabled={saving || getChecklistItems().some(i => !i.pass)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-lg shadow-sm transition disabled:opacity-50"
          >
            <Globe className="w-4 h-4" />
            Publish
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Tabs sidebar */}
        <div className="w-16 border-r border-gray-200 bg-white flex flex-col items-center py-4 gap-4 shrink-0">
          <button 
            onClick={() => { setActiveTab("editor"); setShowPreview(false); }}
            className={`p-3 rounded-xl transition ${activeTab === 'editor' && !showPreview ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400 hover:text-gray-900'}`}
            title="Edit Content"
          >
            <Settings className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setActiveTab("revisions")}
            className={`p-3 rounded-xl transition ${activeTab === 'revisions' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400 hover:text-gray-900'}`}
            title="Version History"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setActiveTab("checklist")}
            className={`p-3 rounded-xl transition ${activeTab === 'checklist' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400 hover:text-gray-900'}`}
            title="Publishing Checklist"
          >
            <BookOpen className="w-5 h-5" />
          </button>
        </div>

        {/* Content Pane */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Main workspace */}
          <div className={`flex-1 p-6 overflow-y-auto ${showPreview ? 'hidden' : 'block'}`}>
            {activeTab === "editor" && (
              <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
                    <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">Page Content</h2>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Page Title</label>
                      <input 
                        type="text" 
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Content (HTML / Markdown)</label>
                      <textarea 
                        name="content"
                        value={formData.content}
                        onChange={handleChange}
                        rows={16}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all resize-y"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
                    <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">URL Configuration</h2>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Slug</label>
                      <input 
                        type="text" 
                        name="slug"
                        value={formData.slug}
                        onChange={handleChange}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
                    <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">SEO Optimization</h2>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Meta Title</label>
                      <input 
                        type="text" 
                        name="seoTitle"
                        value={formData.seoTitle}
                        onChange={handleChange}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900 text-sm focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Meta Description</label>
                      <textarea 
                        name="seoDescription"
                        value={formData.seoDescription}
                        onChange={handleChange}
                        rows={4}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900 text-sm focus:outline-none resize-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "revisions" && (
              <div className="max-w-4xl mx-auto bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Revision Comparisons</h2>
                  <p className="text-sm text-gray-500 mt-1">Review previously saved snapshots of your content.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-96 overflow-y-auto">
                    {revisions.map((rev, index) => (
                      <button 
                        key={index} 
                        onClick={() => setSelectedRevision(rev)}
                        className={`w-full text-left p-3 text-sm hover:bg-slate-50 transition-colors flex flex-col ${selectedRevision?.version === rev.version ? 'bg-indigo-50/50 border-l-2 border-indigo-600' : ''}`}
                      >
                        <span className="font-semibold text-gray-900">Version {rev.version}</span>
                        <span className="text-xs text-gray-400 mt-1">{new Date(rev.updatedAt).toLocaleString()}</span>
                      </button>
                    ))}
                  </div>
                  <div className="md:col-span-2 border border-gray-200 rounded-lg p-4 bg-slate-50 max-h-96 overflow-y-auto font-mono text-xs whitespace-pre-wrap">
                    {selectedRevision ? (
                      <div>
                        <div className="flex justify-between items-center mb-4 border-b border-gray-200 pb-2 bg-white -m-4 p-3 rounded-t-lg">
                          <span className="font-semibold text-gray-700">Snapshot Content (v{selectedRevision.version})</span>
                          <button 
                            onClick={() => {
                              setFormData(prev => ({ ...prev, content: selectedRevision.content }));
                              setIsDirty(true);
                              toast.info("Version Restored", "Content restored to editor. Save to persist.");
                            }}
                            className="px-3 py-1 bg-indigo-600 text-white rounded text-xs font-semibold hover:bg-indigo-700"
                          >
                            Restore to Editor
                          </button>
                        </div>
                        {selectedRevision.content}
                      </div>
                    ) : (
                      <div className="text-center text-gray-400 py-12">Select a version from the left list.</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "checklist" && (
              <div className="max-w-2xl mx-auto bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Publishing Checklist</h2>
                  <p className="text-sm text-gray-500 mt-1">Ensure quality control metrics are met prior to publication.</p>
                </div>
                <div className="space-y-4">
                  {getChecklistItems().map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-gray-150">
                      {item.pass ? (
                        <CircleCheck className="text-emerald-500 w-5 h-5 shrink-0" />
                      ) : (
                        <TriangleAlert className="text-amber-500 w-5 h-5 shrink-0" />
                      )}
                      <span className={`text-sm font-semibold ${item.pass ? 'text-gray-700' : 'text-gray-500'}`}>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Live Preview Pane */}
          {showPreview && (
            <div className="flex-1 flex flex-col bg-slate-100 overflow-hidden">
              <div className="p-3 bg-white border-b border-gray-200 flex justify-between items-center">
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button 
                    onClick={() => setPreviewMode("desktop")}
                    className={`p-1.5 rounded-md transition-colors ${previewMode === 'desktop' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                  >
                    <Monitor className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setPreviewMode("tablet")}
                    className={`p-1.5 rounded-md transition-colors ${previewMode === 'tablet' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                  >
                    <Tablet className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setPreviewMode("mobile")}
                    className={`p-1.5 rounded-md transition-colors ${previewMode === 'mobile' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                  >
                    <Phone className="w-4 h-4" />
                  </button>
                </div>
                <span className="text-xs text-gray-500 font-medium">Responsive Viewport</span>
              </div>
              <div className="flex-1 flex items-center justify-center p-6">
                <div 
                  className={`bg-white shadow-lg border border-gray-200 rounded-xl overflow-hidden transition-all duration-300 h-full ${
                    previewMode === 'desktop' ? 'w-full' :
                    previewMode === 'tablet' ? 'w-[768px]' : 'w-[375px]'
                  }`}
                >
                  <div className="p-6 overflow-y-auto h-full">
                    <h1 className="text-3xl font-extrabold text-gray-900 mb-4">{formData.title || "Untitled Page"}</h1>
                    <div className="prose max-w-none text-gray-700" dangerouslySetInnerHTML={{ __html: formData.content || "<p>No content written yet.</p>" }} />
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Archive Modal */}
      <ArchiveDialog
        isOpen={showArchiveModal}
        onClose={() => setShowArchiveModal(false)}
        title="Archive CMS Page"
        description={`Are you sure you want to archive "${formData.title}"? It will no longer be publicly accessible.`}
        confirmLabel="Archive Page"
        onConfirm={handleArchiveConfirm}
      />
    </div>
  );
}
