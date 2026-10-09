"use client";

import React, { useState, useEffect } from "react";

export default function ActivityTimeline() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterEntity, setFilterEntity] = useState("");

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const filter = filterEntity ? encodeURIComponent(JSON.stringify({ entity: filterEntity })) : "";
      const res = await fetch(`/api/admin/security?limit=100&filter=${filter}`);
      const data = await res.json();
      if (data.success) {
        setLogs(data.data.items || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filterEntity]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Administrative Activity Timeline</h1>
          <p className="text-sm text-gray-500 mt-1">Unified audit trail for all platform events.</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm font-bold text-gray-900">Platform Events</h2>
          <select 
            value={filterEntity} 
            onChange={(e) => setFilterEntity(e.target.value)}
            className="text-sm border-gray-200 rounded-lg py-1.5 px-3 bg-white"
          >
            <option value="">All Entities</option>
            <option value="User">Users</option>
            <option value="Role">Roles</option>
            <option value="Settings">Settings</option>
            <option value="Course">Courses</option>
          </select>
        </div>
        
        {loading ? (
          <div className="p-8 text-center text-gray-400">
            <div className="w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-2"></div>
            Loading timeline...
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-gray-500 text-sm">
            No activity found.
          </div>
        ) : (
          <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
            {logs.map((log) => (
              <div key={log._id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-100 group-[.is-active]:bg-indigo-50 text-indigo-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between space-x-2 mb-1">
                    <div className="font-bold text-gray-900 text-sm">{log.action}</div>
                    <time className="font-mono text-xs text-gray-400">{new Date(log.createdAt).toLocaleString()}</time>
                  </div>
                  <div className="text-sm text-gray-500">
                    <span className="font-semibold text-gray-700">{log.user ? `${log.user.firstName} ${log.user.lastName}` : "System"}</span> performed an action on <span className="font-mono text-xs bg-slate-100 px-1 rounded">{log.entity}</span>
                  </div>
                  {log.metadata && Object.keys(log.metadata).length > 0 && (
                    <pre className="mt-3 bg-slate-50 text-[10px] text-gray-500 p-2 rounded-lg border border-gray-100 overflow-x-auto">
                      {JSON.stringify(log.metadata, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
