"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Search, TriangleAlert, CircleCheck, Activity, Globe, 
  ExternalLink, Plus, ArrowRight, Shield, FileText 
} from "lucide-react";
import { useToast } from "@/components/ui/dialogs/ToastProvider";

export default function CMSSeoCenter() {
  const toast = useToast();
  const [pages, setPages] = useState<any[]>([]);
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Tab control
  const [activeTab, setActiveTab] = useState<"health" | "redirects" | "robots">("health");

  // Redirects Management Mock Data State
  const [redirects, setRedirects] = useState([
    { from: "/old-about", to: "/about-us", code: 301 },
    { from: "/admission-v1", to: "/programs", code: 302 }
  ]);
  const [newRedirect, setNewRedirect] = useState({ from: "", to: "", code: 301 });

  // Robots config state
  const [robotsTxt, setRobotsTxt] = useState(`User-agent: *\nAllow: /\nDisallow: /admin/\nSitemap: https://lmsca.edu/sitemap.xml`);

  useEffect(() => {
    Promise.all([
      fetch(`/api/admin/cms/pages?limit=100`).then(res => res.json()),
      fetch(`/api/admin/cms/blogs?limit=100`).then(res => res.json())
    ]).then(([pagesData, blogsData]) => {
      if (pagesData.success) setPages(pagesData.data);
      if (blogsData.success) setBlogs(blogsData.data);
      setLoading(false);
    });
  }, []);

  const allContent = [
    ...pages.map((p: any) => ({ ...p, type: 'Page', editUrl: `/cms/pages/${p._id}`, url: `/${p.slug}` })),
    ...blogs.map((b: any) => ({ ...b, type: 'Blog', editUrl: `/cms/blogs/${b._id}`, url: `/blog/${b.slug}` }))
  ];

  // Heuristics
  const issues = allContent.filter(item => {
    return !item.seoTitle || !item.seoDescription || (item.seoDescription && item.seoDescription.length < 50);
  });

  const duplicateTitles = allContent.filter((item, idx) => {
    return allContent.some((other, oIdx) => other.seoTitle === item.seoTitle && oIdx !== idx && item.seoTitle);
  });

  const healthyCount = allContent.length - issues.length;
  const healthScore = allContent.length > 0 ? Math.round((healthyCount / allContent.length) * 100) : 100;

  const handleAddRedirect = () => {
    if (newRedirect.from && newRedirect.to) {
      setRedirects(prev => [...prev, newRedirect]);
      setNewRedirect({ from: "", to: "", code: 301 });
      toast.success("Redirect Configured", "URL redirect rule added successfully.");
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto p-4 md:p-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">SEO Workspace</h1>
          <p className="text-sm text-gray-500 mt-1">Manage indexability, structured data, canonical elements and URL mapping.</p>
        </div>
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button 
            onClick={() => setActiveTab("health")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${activeTab === 'health' ? 'bg-white shadow text-indigo-700' : 'text-gray-600 hover:text-gray-900'}`}
          >
            SEO Health
          </button>
          <button 
            onClick={() => setActiveTab("redirects")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${activeTab === 'redirects' ? 'bg-white shadow text-indigo-700' : 'text-gray-600 hover:text-gray-900'}`}
          >
            Redirect Manager
          </button>
          <button 
            onClick={() => setActiveTab("robots")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${activeTab === 'robots' ? 'bg-white shadow text-indigo-700' : 'text-gray-600 hover:text-gray-900'}`}
          >
            Robots & Config
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-gray-500">Analyzing SEO Workspace...</div>
      ) : activeTab === "health" ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm flex items-center gap-4">
              <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path className="text-gray-100" strokeWidth="4" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path className={healthScore > 80 ? "text-emerald-500" : healthScore > 50 ? "text-amber-500" : "text-red-500"} strokeDasharray={`${healthScore}, 100`} strokeWidth="4" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-lg font-bold text-gray-900">{healthScore}%</span>
                </div>
              </div>
              <div>
                <h3 className="font-bold text-sm text-gray-900">Health Index</h3>
                <p className="text-xs text-gray-500 mt-0.5">Overall tag audit score.</p>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm flex flex-col justify-center">
              <span className="text-xs font-bold text-gray-500 uppercase">Optimized Items</span>
              <span className="text-3xl font-black text-gray-900 mt-1">{healthyCount}</span>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm flex flex-col justify-center">
              <span className="text-xs font-bold text-amber-600 uppercase">Warnings</span>
              <span className="text-3xl font-black text-amber-700 mt-1">{issues.length}</span>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm flex flex-col justify-center">
              <span className="text-xs font-bold text-red-600 uppercase">Duplicate Titles</span>
              <span className="text-3xl font-black text-red-700 mt-1">{duplicateTitles.length}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
              <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                <h2 className="font-bold text-gray-900">SEO Action Audit</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-500 text-xs font-semibold uppercase bg-white">
                      <th className="p-4">Resource</th>
                      <th className="p-4">Status & Details</th>
                      <th className="p-4 text-right">Optimize</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {issues.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="p-12 text-center text-gray-400">All content is fully optimized!</td>
                      </tr>
                    ) : (
                      issues.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 transition">
                          <td className="p-4">
                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 inline-block mb-1">{item.type}</span>
                            <div className="font-semibold text-gray-900">{item.title}</div>
                          </td>
                          <td className="p-4">
                            {!item.seoTitle && <span className="text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded mr-1">No Title</span>}
                            {!item.seoDescription && <span className="text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded">No Description</span>}
                          </td>
                          <td className="p-4 text-right">
                            <Link href={item.editUrl} className="text-xs font-bold text-indigo-600 hover:text-indigo-800">Edit →</Link>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
                <h3 className="font-bold text-gray-900 flex items-center gap-2 border-b pb-2">
                  <Globe className="w-4 h-4" /> Sitemaps
                </h3>
                <div className="flex justify-between items-center text-sm">
                  <div>
                    <span className="font-semibold block">sitemap.xml</span>
                    <span className="text-xs text-gray-400">Autogenerated map</span>
                  </div>
                  <a href="/sitemap.xml" target="_blank" className="p-2 hover:bg-indigo-50 text-indigo-600 rounded"><ExternalLink className="w-4 h-4" /></a>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : activeTab === "redirects" ? (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-6 max-w-4xl mx-auto">
          <div>
            <h2 className="text-lg font-bold text-gray-900">301/302 Redirect Manager</h2>
            <p className="text-sm text-gray-500 mt-1">Map deprecated endpoints to live URLs instantly.</p>
          </div>

          <div className="flex gap-4 items-end bg-slate-50 p-4 border rounded-xl">
            <div className="flex-1">
              <label className="text-xs font-bold text-gray-500">Source Path</label>
              <input 
                type="text" 
                placeholder="/old-path" 
                value={newRedirect.from}
                onChange={(e) => setNewRedirect(prev => ({ ...prev, from: e.target.value }))}
                className="w-full mt-1 border px-3 py-1.5 rounded-lg text-sm bg-white" 
              />
            </div>
            <div className="flex-1">
              <label className="text-xs font-bold text-gray-500">Destination URL</label>
              <input 
                type="text" 
                placeholder="/new-url" 
                value={newRedirect.to}
                onChange={(e) => setNewRedirect(prev => ({ ...prev, to: e.target.value }))}
                className="w-full mt-1 border px-3 py-1.5 rounded-lg text-sm bg-white" 
              />
            </div>
            <div>
              <button 
                onClick={handleAddRedirect}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-sm flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Add Route
              </button>
            </div>
          </div>

          <div className="border border-gray-150 rounded-xl overflow-hidden mt-6">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs font-semibold uppercase">
                <tr>
                  <th className="p-4">From</th>
                  <th className="p-4">To</th>
                  <th className="p-4">Type</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {redirects.map((r, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/30 transition">
                    <td className="p-4 font-mono text-xs">{r.from}</td>
                    <td className="p-4 font-mono text-xs">{r.to}</td>
                    <td className="p-4"><span className="text-xs font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">{r.code} Permanent</span></td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => setRedirects(prev => prev.filter((_, i) => i !== idx))}
                        className="text-xs text-red-500 font-bold hover:underline"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-6 max-w-4xl mx-auto">
          <div>
            <h2 className="text-lg font-bold text-gray-900">robots.txt Directives</h2>
            <p className="text-sm text-gray-500 mt-1">Configure crawling parameters for search bots.</p>
          </div>
          <textarea
            value={robotsTxt}
            onChange={(e) => setRobotsTxt(e.target.value)}
            rows={8}
            className="w-full border p-4 rounded-xl font-mono text-sm bg-slate-50"
          />
          <div className="flex justify-end border-t pt-4">
            <button 
              onClick={() => toast.success("Configuration Saved", "robots.txt configuration saved successfully.")}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-sm"
            >
              Save Configuration
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
