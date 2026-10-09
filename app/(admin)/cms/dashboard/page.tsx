"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, Layout, Image, Navigation, Search, TrendingUp } from "lucide-react";

export default function CMSDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/cms/analytics")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStats(data.data);
        }
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const cards = [
    { 
      label: "Pages (Published)", 
      value: `${stats?.content.publishedPages || 0} / ${stats?.content.totalPages || 0}`, 
      color: "border-indigo-100 bg-indigo-50/50 text-indigo-700",
      icon: <Layout className="w-5 h-5 mb-3 opacity-70" />
    },
    { 
      label: "Articles (Published)", 
      value: `${stats?.content.publishedBlogs || 0} / ${stats?.content.totalBlogs || 0}`, 
      color: "border-cyan-100 bg-cyan-50/50 text-cyan-700",
      icon: <FileText className="w-5 h-5 mb-3 opacity-70" />
    },
    { 
      label: "Media Storage", 
      value: formatBytes(stats?.media.totalSizeBytes || 0), 
      color: "border-emerald-100 bg-emerald-50/50 text-emerald-700",
      icon: <Image className="w-5 h-5 mb-3 opacity-70" />
    },
    { 
      label: "Drafts & Scheduled", 
      value: (stats?.content.draftPages || 0) + (stats?.content.scheduledPages || 0) + (stats?.content.draftBlogs || 0) + (stats?.content.scheduledBlogs || 0), 
      color: "border-amber-100 bg-amber-50/50 text-amber-700",
      icon: <TrendingUp className="w-5 h-5 mb-3 opacity-70" />
    },
  ];

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto p-4 md:p-8">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Enterprise CMS</h1>
        <p className="text-sm text-gray-500 mt-2">Manage your digital presence, marketing content, and platform assets.</p>
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, idx) => (
          <div key={idx} className={`p-6 rounded-2xl border ${card.color} flex flex-col justify-between shadow-sm transition-transform hover:-translate-y-1`}>
            {card.icon}
            <div>
              <span className="text-3xl font-black block">{card.value}</span>
              <span className="text-xs font-semibold uppercase tracking-wider mt-1 block opacity-80">{card.label}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="p-8 rounded-2xl bg-white border border-gray-200 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Navigation className="text-indigo-600" />
              Content Management Hub
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link href="/cms/pages" className="group p-5 border border-gray-100 rounded-xl hover:border-indigo-100 hover:bg-indigo-50/30 transition-colors flex items-start gap-4">
                <div className="bg-indigo-100 p-3 rounded-lg text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <Layout className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Page Builder</h3>
                  <p className="text-sm text-gray-500 mt-1">Design landing pages and legal policies.</p>
                </div>
              </Link>
              <Link href="/cms/blogs" className="group p-5 border border-gray-100 rounded-xl hover:border-cyan-100 hover:bg-cyan-50/30 transition-colors flex items-start gap-4">
                <div className="bg-cyan-100 p-3 rounded-lg text-cyan-600 group-hover:bg-cyan-600 group-hover:text-white transition-colors">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Blog & Articles</h3>
                  <p className="text-sm text-gray-500 mt-1">Publish news, updates, and educational posts.</p>
                </div>
              </Link>
              <Link href="/cms/media" className="group p-5 border border-gray-100 rounded-xl hover:border-emerald-100 hover:bg-emerald-50/30 transition-colors flex items-start gap-4">
                <div className="bg-emerald-100 p-3 rounded-lg text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <Image className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Media Library</h3>
                  <p className="text-sm text-gray-500 mt-1">Manage images, documents, and videos.</p>
                </div>
              </Link>
              <Link href="/cms/seo" className="group p-5 border border-gray-100 rounded-xl hover:border-violet-100 hover:bg-violet-50/30 transition-colors flex items-start gap-4">
                <div className="bg-violet-100 p-3 rounded-lg text-violet-600 group-hover:bg-violet-600 group-hover:text-white transition-colors">
                  <Search className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">SEO Center</h3>
                  <p className="text-sm text-gray-500 mt-1">Optimize meta tags and sitemaps.</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm">
            <h2 className="text-md font-bold text-gray-900 mb-4">Content Workflow</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Drafts Pending Review</span>
                <span className="font-semibold bg-gray-100 px-2 py-0.5 rounded-full text-gray-700">
                  {stats?.content.draftPages + stats?.content.draftBlogs || 0}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Scheduled for Publishing</span>
                <span className="font-semibold bg-indigo-50 px-2 py-0.5 rounded-full text-indigo-700">
                  {stats?.content.scheduledPages + stats?.content.scheduledBlogs || 0}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Unused Media Assets</span>
                <span className="font-semibold bg-red-50 px-2 py-0.5 rounded-full text-red-700">
                  {stats?.media.unusedFiles || 0}
                </span>
              </div>
            </div>
            <button className="w-full mt-6 py-2 px-4 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-sm font-medium transition-colors">
              Review Content
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
