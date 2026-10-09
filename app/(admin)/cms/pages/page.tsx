"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Search, Filter, MoreVertical, Pencil, Trash2, 
  ExternalLink, Plus, Globe, Download, Settings, SlidersHorizontal, Layout 
} from "lucide-react";
import { useToast } from "@/components/ui/dialogs/ToastProvider";

export default function CMSPages() {
  const router = useRouter();
  const toast = useToast();
  const [pages, setPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [density, setDensity] = useState<"compact" | "normal" | "relaxed">("normal");
  
  // Column Visibility
  const [columns, setColumns] = useState({
    title: true,
    status: true,
    template: true,
    updatedAt: true
  });
  const [showColMenu, setShowColMenu] = useState(false);

  // Keyboard navigation focus index
  const [focusIndex, setFocusIndex] = useState<number>(-1);

  const fetchPages = () => {
    setLoading(true);
    fetch(`/api/admin/cms/pages?search=${search}&sort=updatedAt&order=desc`)
      .then((res) => res.json())
      .then((data) => {
        const parsed = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data?.data?.data)
          ? data.data.data
          : [];
        setPages(parsed);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchPages();
  }, [search]);

  // Handle Keyboard Navigation (Up/Down arrow keys, Enter to edit)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (pages.length === 0) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setFocusIndex(prev => (prev + 1) % pages.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setFocusIndex(prev => (prev - 1 + pages.length) % pages.length);
      } else if (e.key === "Enter" && focusIndex >= 0) {
        e.preventDefault();
        router.push(`/cms/pages/${pages[focusIndex]._id}`);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pages, focusIndex]);

  const toggleSelect = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selected.length === filteredPages.length) {
      setSelected([]);
    } else {
      setSelected(filteredPages.map(p => p._id));
    }
  };

  // Bulk Operations
  const handleBulkAction = async (action: "PUBLISHED" | "ARCHIVED" | "DELETE") => {
    try {
      await fetch(`/api/admin/cms/pages/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selected, status: action })
      });
      setSelected([]);
      fetchPages();
      toast.success("Bulk Action Applied", `Updated status for ${selected.length} items.`);
    } catch (e) {
      console.error(e);
      toast.error("Operation Failed", "Failed to apply bulk action.");
    }
  };

  // CSV Export
  const exportToCSV = () => {
    const headers = ["Title", "Slug", "Status", "Template", "Last Updated"];
    const rows = filteredPages.map(p => [
      p.title,
      p.slug,
      p.status,
      p.template || "default",
      new Date(p.updatedAt).toLocaleDateString()
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "lmsca_pages_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PUBLISHED": return <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-xs font-semibold">Published</span>;
      case "DRAFT": return <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 text-xs font-semibold">Draft</span>;
      case "SCHEDULED": return <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-xs font-semibold">Scheduled</span>;
      case "ARCHIVED": return <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-xs font-semibold">Archived</span>;
      default: return <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 text-xs font-semibold">{status}</span>;
    }
  };

  const filteredPages = pages.filter(p => {
    if (statusFilter === "ALL") return true;
    return p.status === statusFilter;
  });

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto p-4 md:p-8">
      {/* Sticky Header Section */}
      <div className="sticky top-0 bg-slate-50 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 z-20 border-b border-gray-100">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Page Management</h1>
          <p className="text-sm text-gray-500 mt-1">Design, publish and schedule standard web pages.</p>
        </div>
        <Link 
          href="/cms/pages/new" 
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-lg transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Create Page
        </Link>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
        {/* Toolbar & Filters */}
        <div className="p-4 border-b border-gray-100 flex flex-wrap justify-between items-center gap-4 bg-gray-50/50">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Search pages by title or slug..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 border rounded-lg text-sm bg-white"
            >
              <option value="ALL">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2 relative">
            <button 
              onClick={exportToCSV}
              className="p-2 border bg-white hover:bg-gray-50 text-gray-600 rounded-lg text-sm transition-colors flex items-center gap-1.5 font-semibold"
              title="Export to CSV"
            >
              <Download className="w-4 h-4" /> Export
            </button>

            {/* Density Selector */}
            <select 
              value={density} 
              onChange={(e) => setDensity(e.target.value as any)}
              className="px-3 py-1.5 border rounded-lg text-sm bg-white font-semibold text-gray-600"
            >
              <option value="compact">Compact</option>
              <option value="normal">Normal</option>
              <option value="relaxed">Relaxed</option>
            </select>

            {/* Column Selector */}
            <button 
              onClick={() => setShowColMenu(!showColMenu)}
              className="p-2 border bg-white rounded-lg text-sm"
              title="Column Visibility"
            >
              <Settings className="w-4 h-4" />
            </button>
            {showColMenu && (
              <div className="absolute right-0 top-11 bg-white border shadow-lg rounded-lg p-3 z-35 space-y-2 text-xs font-semibold text-gray-700 w-44">
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={columns.title} onChange={() => setColumns(p=>({...p, title: !p.title}))} id="col-title" />
                  <label htmlFor="col-title">Title</label>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={columns.status} onChange={() => setColumns(p=>({...p, status: !p.status}))} id="col-status" />
                  <label htmlFor="col-status">Status</label>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={columns.template} onChange={() => setColumns(p=>({...p, template: !p.template}))} id="col-template" />
                  <label htmlFor="col-template">Template</label>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={columns.updatedAt} onChange={() => setColumns(p=>({...p, updatedAt: !p.updatedAt}))} id="col-updated" />
                  <label htmlFor="col-updated">Last Updated</label>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sticky Bulk Actions Toolbar */}
        {selected.length > 0 && (
          <div className="bg-indigo-50 border-b border-indigo-150 px-4 py-2.5 flex justify-between items-center z-15 sticky top-14">
            <span className="text-xs font-bold text-indigo-700">{selected.length} pages selected for bulk modification</span>
            <div className="flex gap-2">
              <button 
                onClick={() => handleBulkAction("PUBLISHED")} 
                className="px-3 py-1 bg-indigo-600 text-white rounded text-xs font-bold hover:bg-indigo-700"
              >
                Bulk Publish
              </button>
              <button 
                onClick={() => handleBulkAction("ARCHIVED")} 
                className="px-3 py-1 bg-white border border-indigo-300 text-indigo-700 rounded text-xs font-bold hover:bg-indigo-50"
              >
                Bulk Archive
              </button>
              <button 
                onClick={() => handleBulkAction("DELETE")} 
                className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-700 rounded text-xs font-bold"
              >
                Bulk Delete
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-gray-500 text-xs font-semibold uppercase tracking-wider">
                <th className="p-4 w-12">
                  <input 
                    type="checkbox" 
                    checked={selected.length === filteredPages.length && filteredPages.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300 text-indigo-600" 
                  />
                </th>
                {columns.title && <th className="p-4">Title</th>}
                {columns.status && <th className="p-4">Status</th>}
                {columns.template && <th className="p-4">Template</th>}
                {columns.updatedAt && <th className="p-4">Last Updated</th>}
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="p-4 bg-slate-50/50 h-10"></td>
                  </tr>
                ))
              ) : filteredPages.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-gray-400">
                    <Layout className="w-12 h-12 mb-4 mx-auto text-gray-200" />
                    No pages matched the query.
                  </td>
                </tr>
              ) : (
                filteredPages.map((p, idx) => (
                  <tr 
                    key={p._id} 
                    className={`hover:bg-gray-50/50 transition group ${focusIndex === idx ? 'bg-indigo-50/30 ring-1 ring-indigo-500/20' : ''}`}
                  >
                    <td className="p-4">
                      <input 
                        type="checkbox" 
                        checked={selected.includes(p._id)}
                        onChange={() => toggleSelect(p._id)}
                        className="rounded border-gray-300 text-indigo-600" 
                      />
                    </td>
                    {columns.title && (
                      <td className={`p-4 ${density === 'compact' ? 'py-2' : density === 'relaxed' ? 'py-6' : 'py-4'}`}>
                        <div className="font-semibold text-gray-900">{p.title}</div>
                        <div className="text-gray-400 font-mono text-xs mt-1">/{p.slug}</div>
                      </td>
                    )}
                    {columns.status && (
                      <td className="p-4">
                        {getStatusBadge(p.status)}
                      </td>
                    )}
                    {columns.template && (
                      <td className="p-4 text-gray-500 capitalize">
                        {p.template || "Default"}
                      </td>
                    )}
                    {columns.updatedAt && (
                      <td className="p-4 text-gray-500 text-xs">
                        {new Date(p.updatedAt).toLocaleDateString()}
                      </td>
                    )}
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link href={`/cms/pages/${p._id}`} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md">
                          <Pencil className="w-4 h-4" />
                        </Link>
                        <button 
                          onClick={() => {
                            setPages(prev => prev.filter(pg => pg._id !== p._id));
                            toast.success("Page Deleted", `Deleted page "${p.title}".`);
                          }}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
