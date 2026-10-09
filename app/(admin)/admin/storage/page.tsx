"use client";

import React, { useState, useEffect } from "react";

const formatBytes = (bytes: number, decimals = 2) => {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

export default function StorageManagement() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/storage/stats`);
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Storage Management</h1>
          <p className="text-sm text-gray-500 mt-1">Monitor file sizes, utilization, and identify large assets.</p>
        </div>
        <button 
          onClick={fetchStats}
          className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-bold rounded-xl transition-colors shadow-sm"
        >
          Refresh Data
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-gray-400">
          <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
          Calculating storage usage...
        </div>
      ) : !stats ? (
        <div className="p-12 text-center text-red-500">Failed to load storage data.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Storage Overview */}
          <div className="col-span-1 md:col-span-3 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Total Storage Used</h2>
              <div className="text-4xl font-black text-gray-900 tracking-tight">
                {formatBytes(stats.total.totalSize)}
              </div>
              <p className="text-sm text-gray-400 mt-1">Across {stats.total.count} tracked media files</p>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
              </svg>
            </div>
          </div>

          {/* Type Breakdown */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm md:col-span-1">
            <h2 className="text-sm font-bold text-gray-900 mb-4">File Type Breakdown</h2>
            <div className="space-y-4">
              {stats.breakdown.map((type: any, index: number) => {
                const percentage = (type.totalSize / stats.total.totalSize) * 100;
                return (
                  <div key={type._id}>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-gray-700 truncate w-32" title={type._id}>{type._id}</span>
                      <span className="text-gray-500">{formatBytes(type.totalSize)}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${Math.max(percentage, 1)}%` }}></div>
                    </div>
                  </div>
                );
              })}
              {stats.breakdown.length === 0 && (
                <div className="text-sm text-gray-400">No media types found.</div>
              )}
            </div>
          </div>

          {/* Largest Files */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm md:col-span-2">
            <h2 className="text-sm font-bold text-gray-900 mb-4">Largest Files</h2>
            {stats.largestFiles.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="pb-2 text-[10px] uppercase tracking-widest font-extrabold text-gray-400">File Name</th>
                      <th className="pb-2 text-[10px] uppercase tracking-widest font-extrabold text-gray-400">Type</th>
                      <th className="pb-2 text-[10px] uppercase tracking-widest font-extrabold text-gray-400 text-right">Size</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {stats.largestFiles.map((file: any) => (
                      <tr key={file._id} className="hover:bg-slate-50">
                        <td className="py-3 text-sm font-semibold text-gray-800">
                          <a href={file.url} target="_blank" rel="noreferrer" className="hover:text-indigo-600 transition-colors">
                            {file.name}
                          </a>
                        </td>
                        <td className="py-3 text-xs text-gray-500">{file.mimeType}</td>
                        <td className="py-3 text-xs font-mono text-gray-600 text-right">{formatBytes(file.size)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-sm text-gray-400">No files tracked yet.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
