"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FiSearch, FiCommand } from "react-icons/fi";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();

  const commands = [
    { label: "Go to Dashboard", href: "/admin" },
    { label: "Go to Students Directory", href: "/admin/students" },
    { label: "Go to Courses Ledger", href: "/admin/courses" },
    { label: "Go to Invoices Catalog", href: "/admin/finance/invoices" },
    { label: "Go to Reports Library", href: "/admin/reports" },
    { label: "Go to Notification Console", href: "/admin/notifications" },
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const filtered = commands.filter((c) =>
    c.label.toLowerCase().includes(query.toLowerCase())
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-start justify-center pt-24">
      <div className="bg-white border rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden p-4 space-y-4">
        <div className="flex items-center gap-2 border-b pb-3">
          <FiSearch className="text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Type a command or search (e.g. Go to Dashboard)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full text-sm focus:outline-none"
            autoFocus
          />
          <button
            onClick={() => setOpen(false)}
            className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-500 font-mono"
          >
            ESC
          </button>
        </div>

        <div className="space-y-1 max-h-64 overflow-y-auto text-xs">
          {filtered.map((cmd, idx) => (
            <button
              key={idx}
              onClick={() => {
                router.push(cmd.href);
                setOpen(false);
              }}
              className="w-full text-left p-2.5 rounded-lg hover:bg-indigo-50 hover:text-indigo-700 font-semibold text-gray-700 flex justify-between items-center transition"
            >
              <span>{cmd.label}</span>
              <span className="text-[10px] text-gray-400 font-mono">Jump</span>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="p-4 text-center text-gray-400">No matching commands found.</div>
          )}
        </div>
      </div>
    </div>
  );
}
