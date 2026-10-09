"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { executeGlobalSearch } from "../../lib/api/search";

export function SearchModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any>({ courses: [], programs: [], teachers: [], events: [], faqs: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ courses: [], programs: [], teachers: [], events: [], faqs: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await executeGlobalSearch(query);
        setResults(data);
      } catch {
        setResults({ courses: [], programs: [], teachers: [], events: [], faqs: [] });
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-start justify-center pt-20 px-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[80vh]">
        {/* Input header */}
        <div className="p-4 border-b border-slate-100 flex items-center gap-3">
          <span className="text-slate-400 text-lg">🔍</span>
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search courses, programs, faculty, events..."
            className="w-full text-slate-800 text-base placeholder-slate-400 focus:outline-none bg-transparent"
          />
          <button
            onClick={onClose}
            className="px-2 py-1 text-xs font-semibold bg-slate-100 text-slate-500 rounded-md hover:bg-slate-200"
          >
            ESC
          </button>
        </div>

        {/* Results List */}
        <div className="p-6 overflow-y-auto space-y-6">
          {loading && <p className="text-sm text-slate-400 text-center py-4">Searching catalog...</p>}

          {!loading && !query && (
            <div className="text-center py-8">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Popular Searches</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {["Public Speaking", "Emotional Intelligence", "Financial Literacy", "Logic & Problem Solving"].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setQuery(tag)}
                    aria-label={`Search for ${tag}`}
                    className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs hover:bg-indigo-50 hover:text-indigo-600 font-medium transition"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!loading && query && (
            <>
              {/* Courses */}
              {results.courses?.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">Courses</h3>
                  <div className="space-y-1">
                    {results.courses.map((item: any) => (
                      <Link
                        key={item._id}
                        href={`/courses/${item.slug}`}
                        onClick={onClose}
                        className="block p-3 rounded-xl hover:bg-indigo-50 transition"
                      >
                        <p className="text-sm font-bold text-slate-800">{item.title}</p>
                        <p className="text-xs text-slate-500">{item.category} • {item.level}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Events */}
              {results.events?.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">Events</h3>
                  <div className="space-y-1">
                    {results.events.map((item: any) => (
                      <Link
                        key={item._id}
                        href={`/events/${item.slug}`}
                        onClick={onClose}
                        className="block p-3 rounded-xl hover:bg-indigo-50 transition"
                      >
                        <p className="text-sm font-bold text-slate-800">{item.title}</p>
                        <p className="text-xs text-slate-500">{item.mode}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
