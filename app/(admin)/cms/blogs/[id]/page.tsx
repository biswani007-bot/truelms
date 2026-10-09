"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, Save, Globe, Image as ImageIcon, Tag, Clock, 
  Eye, TriangleAlert, CircleCheck, Share2, User, 
  MessageSquare, List 
} from "lucide-react";
import { useToast } from "@/components/ui/dialogs/ToastProvider";
import Link from "next/link";

export default function CMSBlogEditor() {
  const params = useParams() || {};
  const router = useRouter();
  const toast = useToast();
  const id = (params.id || "") as string;
  const isNew = id === "new";
  
  const [loading, setLoading] = useState(!isNew && !!id);
  const [saving, setSaving] = useState(false);
  const [activePanel, setActivePanel] = useState<"editor" | "seo" | "workflow">("editor");

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    content: "",
    status: "DRAFT",
    category: "",
    author: "",
    featured: false,
    featuredImage: "",
    seoTitle: "",
    seoDescription: "",
    readingTime: 5,
    editorialNotes: "",
    assignedReviewer: ""
  });

  const categories = [
    { id: "65b2a1a8c3d4e5f6g7h8i9j0", name: "Engineering" },
    { id: "65b2a1a8c3d4e5f6g7h8i9j1", name: "Product Updates" },
    { id: "65b2a1a8c3d4e5f6g7h8i9j2", name: "Company News" },
  ];

  const reviewers = [
    { id: "60c72b2f9b1d8e001c8e4b2a", name: "Editorial Lead" },
    { id: "60c72b2f9b1d8e001c8e4b2b", name: "Chief Marketing Officer" }
  ];

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    if (!isNew) {
      fetch(`/api/admin/cms/blogs/${id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data) {
            setFormData({
              ...data.data,
              category: data.data.category?._id || data.data.category || "",
              author: data.data.author?._id || data.data.author || "",
              editorialNotes: data.data.editorialNotes || "",
              assignedReviewer: data.data.assignedReviewer || ""
            });
          }
          setLoading(false);
        });
    }
  }, [id, isNew]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  // Compute Reading Time Dynamically
  const getReadingTime = () => {
    const words = formData.content.trim().split(/\s+/).length;
    return Math.max(1, Math.ceil(words / 200));
  };

  // Compute dynamic TOC / Outline
  const getContentOutline = () => {
    const regex = /<h[1-3]>(.*?)<\/h[1-3]>/g;
    const outline = [];
    let match;
    while ((match = regex.exec(formData.content)) !== null) {
      outline.push(match[1]);
    }
    return outline.length > 0 ? outline : ["No headings found in content."];
  };

  // Generate SEO Score (mock calculation for live feedback)
  const getSEOScore = () => {
    let score = 20;
    if (formData.title.length > 10) score += 20;
    if (formData.seoTitle.length > 10) score += 20;
    if (formData.seoDescription.length > 40) score += 20;
    if (formData.content.length > 200) score += 20;
    return score;
  };

  // Suggest Slug
  const suggestSlug = () => {
    const suggested = formData.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    setFormData(prev => ({ ...prev, slug: suggested }));
  };

  const handleSave = async (statusOverride?: string) => {
    setSaving(true);
    const payload = { 
      ...formData,
      readingTime: getReadingTime()
    };
    if (statusOverride) {
      payload.status = statusOverride;
    }
    
    if (!payload.category) payload.category = categories[0].id;
    if (!payload.author) payload.author = "60c72b2f9b1d8e001c8e4b2d";

    const url = isNew ? `/api/admin/cms/blogs` : `/api/admin/cms/blogs/${params.id}`;
    const method = isNew ? "POST" : "PUT";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        if (isNew) {
          toast.success("Article Created", "New blog post created successfully.");
          router.push(`/cms/blogs/${data.data._id}`);
        } else {
          setFormData(prev => ({ ...prev, status: data.data.status }));
          toast.success("Article Saved", "Blog post updated successfully.");
        }
      } else {
        toast.error("Save Failed", data.error || "Failed to save article.");
      }
    } catch (e) {
      console.error(e);
      toast.error("Network Error", "An error occurred while saving article.");
    }
    setSaving(false);
  };

  if (loading) return <div className="p-8 text-gray-500">Loading article editor...</div>;

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
      {/* Sticky Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm z-10 shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/cms/blogs" className="p-2 -ml-2 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{isNew ? "Write Article" : "Edit Article"}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                formData.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-700' :
                formData.status === 'DRAFT' ? 'bg-gray-100 text-gray-700' :
                formData.status === 'IN_REVIEW' ? 'bg-amber-100 text-amber-700' :
                'bg-indigo-100 text-indigo-700'
              }`}>
                {formData.status}
              </span>
              <span className="text-xs text-gray-500 font-semibold flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> {getReadingTime()} min read
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => handleSave("DRAFT")}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-semibold text-sm rounded-lg shadow-sm transition"
          >
            Save Draft
          </button>
          
          <button 
            onClick={() => handleSave("IN_REVIEW")}
            disabled={saving || formData.status === "IN_REVIEW"}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm rounded-lg shadow-sm transition"
          >
            Submit for Review
          </button>

          <button 
            onClick={() => handleSave("PUBLISHED")}
            disabled={saving || formData.status === "PUBLISHED"}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-lg shadow-sm transition"
          >
            Publish Now
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Tabs */}
        <div className="w-16 border-r border-gray-200 bg-white flex flex-col items-center py-4 gap-4 shrink-0">
          <button 
            onClick={() => setActivePanel("editor")}
            className={`p-3 rounded-xl transition ${activePanel === 'editor' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400 hover:text-gray-900'}`}
            title="Edit Article"
          >
            <List className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setActivePanel("seo")}
            className={`p-3 rounded-xl transition ${activePanel === 'seo' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400 hover:text-gray-900'}`}
            title="SEO & Previews"
          >
            <Tag className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setActivePanel("workflow")}
            className={`p-3 rounded-xl transition ${activePanel === 'workflow' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400 hover:text-gray-900'}`}
            title="Workflow & Comments"
          >
            <MessageSquare className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {activePanel === "editor" && (
            <div className="max-w-6xl mx-auto grid grid-cols-1 xl:grid-cols-3 gap-8">
              
              {/* Writer */}
              <div className="xl:col-span-2 space-y-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Headline</label>
                    <input 
                      type="text" 
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      placeholder="Enter article headline..."
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 text-lg font-bold focus:outline-none focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Content</label>
                    <textarea 
                      name="content"
                      value={formData.content}
                      onChange={handleChange}
                      rows={20}
                      placeholder="Write your story here..."
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 font-mono text-sm focus:outline-none focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
                  <h3 className="font-bold text-gray-900 border-b pb-2">Publishing Metadata</h3>
                  
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase">Slug</label>
                    <div className="flex gap-2 mt-1">
                      <input 
                        type="text" 
                        name="slug"
                        value={formData.slug}
                        onChange={handleChange}
                        className="flex-1 px-3 py-1.5 border rounded-lg text-sm"
                      />
                      <button 
                        onClick={suggestSlug}
                        className="px-3 py-1 bg-gray-100 hover:bg-gray-250 text-gray-700 text-xs rounded-lg font-semibold border"
                      >
                        Suggest
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase">Category</label>
                    <select 
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="w-full mt-1 px-3 py-1.5 border rounded-lg text-sm bg-white"
                    >
                      <option value="">Select Category</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <input 
                      type="checkbox" 
                      name="featured"
                      id="featured"
                      checked={formData.featured}
                      onChange={handleChange}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 w-4 h-4"
                    />
                    <label htmlFor="featured" className="text-sm font-semibold text-gray-700">Featured Article</label>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="font-bold text-gray-900 border-b pb-2 mb-3">Content Outline</h3>
                  <div className="text-xs text-gray-500 space-y-1 max-h-48 overflow-y-auto font-medium">
                    {getContentOutline().map((heading, i) => (
                      <div key={i} className="truncate"># {heading}</div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          )}

          {activePanel === "seo" && (
            <div className="max-w-4xl mx-auto bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-8">
              <div className="flex justify-between items-center border-b pb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">SEO & Social Previews</h2>
                  <p className="text-sm text-gray-500 mt-1">Optimize meta tags and analyze share cards.</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-500">SEO Score:</span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${getSEOScore() > 70 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {getSEOScore()}/100
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700">Meta Title</label>
                    <input 
                      type="text" 
                      name="seoTitle"
                      value={formData.seoTitle}
                      onChange={handleChange}
                      className="w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700">Meta Description</label>
                    <textarea 
                      name="seoDescription"
                      value={formData.seoDescription}
                      onChange={handleChange}
                      rows={4}
                      className="w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:ring-1 focus:ring-indigo-500 resize-none"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-700">Search Result Preview</h3>
                  <div className="p-4 bg-slate-50 border rounded-lg space-y-1 shadow-inner">
                    <span className="text-xs text-gray-500 font-mono">https://lmsca.edu/blog/{formData.slug || "slug"}</span>
                    <h4 className="text-blue-700 font-medium text-sm hover:underline cursor-pointer">{formData.seoTitle || formData.title || "Specify Meta Title"}</h4>
                    <p className="text-xs text-gray-600 truncate">{formData.seoDescription || "Please specify a description to see preview."}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activePanel === "workflow" && (
            <div className="max-w-3xl mx-auto bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Editorial Workflow & Assignment</h2>
                <p className="text-sm text-gray-500 mt-1">Assign roles and add peer feedback notes.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700">Assign Reviewer</label>
                  <select 
                    name="assignedReviewer"
                    value={formData.assignedReviewer}
                    onChange={handleChange}
                    className="w-full mt-1 px-3 py-2 border rounded-lg text-sm bg-white"
                  >
                    <option value="">Select Reviewer</option>
                    {reviewers.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700">Editorial Comments</label>
                  <textarea 
                    name="editorialNotes"
                    value={formData.editorialNotes}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Feedback or tasks required prior to approval..."
                    className="w-full mt-1 px-3 py-2 border rounded-lg text-sm resize-none"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
