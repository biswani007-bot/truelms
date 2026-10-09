"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  Search,
  GraduationCap,
  UsersRound,
  BookOpen,
  ClipboardList,
  Handshake,
  Wallet,
  Loader2,
  Command,
  ArrowRight,
  CornerDownLeft,
} from "lucide-react";

interface SearchResult {
  id: string;
  url: string;
  title: string;
  subtitle: string;
  type: string;
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  student:    <GraduationCap className="size-3.5 text-indigo-500" />,
  teacher:    <UsersRound className="size-3.5 text-violet-500" />,
  course:     <BookOpen className="size-3.5 text-sky-500" />,
  enrollment: <ClipboardList className="size-3.5 text-emerald-500" />,
  lead:       <Handshake className="size-3.5 text-rose-500" />,
  invoice:    <Wallet className="size-3.5 text-green-500" />,
};

const TYPE_BG: Record<string, string> = {
  student:    "bg-indigo-50 text-indigo-700 border-indigo-200",
  teacher:    "bg-violet-50 text-violet-700 border-violet-200",
  course:     "bg-sky-50 text-sky-700 border-sky-200",
  enrollment: "bg-emerald-50 text-emerald-700 border-emerald-200",
  lead:       "bg-rose-50 text-rose-700 border-rose-200",
  invoice:    "bg-green-50 text-green-700 border-green-200",
};

export default function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ⌘K / Ctrl+K global shortcut
  useEffect(() => {
    function handleGlobalKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
      if (e.key === "Escape") {
        setIsOpen(false);
        setActiveIndex(-1);
        inputRef.current?.blur();
      }
    }
    document.addEventListener("keydown", handleGlobalKey);
    return () => document.removeEventListener("keydown", handleGlobalKey);
  }, []);

  // Debounced search
  useEffect(() => {
    const delay = setTimeout(async () => {
      if (query.length >= 2) {
        setLoading(true);
        try {
          const res = await fetch(
            `/api/admin/search?q=${encodeURIComponent(query)}`
          );
          const data = await res.json();
          if (data.success) {
            setResults(data.data);
            setIsOpen(true);
            setActiveIndex(-1);
          }
        } catch {
          // Search error — silent fail
        } finally {
          setLoading(false);
        }
      } else {
        setResults([]);
        setIsOpen(false);
      }
    }, 280);

    return () => clearTimeout(delay);
  }, [query]);

  // Keyboard navigation inside results
  const handleInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!isOpen || results.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((prev) => Math.min(prev + 1, results.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((prev) => Math.max(prev - 1, -1));
      } else if (e.key === "Enter" && activeIndex >= 0) {
        e.preventDefault();
        const target = results[activeIndex];
        if (target) {
          window.location.href = target.url;
          setIsOpen(false);
        }
      }
    },
    [isOpen, results, activeIndex]
  );

  // Group results by type
  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    const key = r.type || "other";
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {});

  return (
    <div ref={wrapperRef} className="relative" role="combobox" aria-expanded={isOpen} aria-haspopup="listbox">
      {/* Trigger Input */}
      <div
        className={`
          flex items-center gap-2 bg-slate-50 border rounded-xl px-3 py-2 w-64 transition-all duration-150
          ${isOpen
            ? "border-indigo-400 ring-2 ring-indigo-500/10 bg-white"
            : "border-slate-200 hover:border-slate-300"
          }
        `}
      >
        <Search className="size-3.5 text-slate-400 shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          onKeyDown={handleInputKeyDown}
          placeholder="Search everything..."
          aria-label="Global search"
          aria-autocomplete="list"
          className="bg-transparent text-xs text-slate-800 placeholder-slate-400 font-medium outline-none w-full"
        />
        {loading ? (
          <Loader2 className="size-3.5 text-slate-400 animate-spin shrink-0" />
        ) : (
          <kbd className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-bold text-slate-400 bg-white border border-slate-200 rounded shrink-0">
            <Command className="size-2.5" />K
          </kbd>
        )}
      </div>

      {/* Results Dropdown */}
      {isOpen && (results.length > 0 || (query.length >= 2 && !loading)) && (
        <div
          ref={listRef}
          role="listbox"
          aria-label="Search results"
          className="absolute top-full left-0 mt-2 w-[340px] bg-white border border-slate-200/80 shadow-[var(--lms-shadow-xl)] rounded-2xl overflow-hidden z-[100] animate-scale-in"
        >
          {results.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <Search className="size-7 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-600">
                No results for &ldquo;{query}&rdquo;
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Try searching by name, ID, or email.
              </p>
            </div>
          ) : (
            <div className="max-h-[380px] overflow-y-auto">
              {/* Result count header */}
              <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {results.length} result{results.length !== 1 ? "s" : ""}
                </span>
                <div className="flex items-center gap-1 text-[10px] text-slate-400">
                  <kbd className="px-1 py-0.5 border border-slate-200 rounded text-slate-400 font-mono">↑↓</kbd>
                  <span>navigate</span>
                  <kbd className="ml-1 px-1 py-0.5 border border-slate-200 rounded text-slate-400 font-mono flex items-center gap-0.5"><CornerDownLeft className="size-2.5" /></kbd>
                  <span>open</span>
                </div>
              </div>

              {/* Grouped results */}
              {Object.entries(grouped).map(([type, items]) => (
                <div key={type}>
                  <div className="px-4 py-2 bg-slate-50/60 border-b border-slate-100">
                    <span className="lms-label capitalize">{type}s</span>
                  </div>
                  {items.map((res) => {
                    const globalIdx = results.indexOf(res);
                    const isActive = activeIndex === globalIdx;
                    return (
                      <Link
                        key={`${res.id}-${type}`}
                        href={res.url}
                        role="option"
                        aria-selected={isActive}
                        onClick={() => {
                          setIsOpen(false);
                          setQuery("");
                          setActiveIndex(-1);
                        }}
                        className={`
                          flex items-center justify-between px-4 py-3 border-b border-slate-50 last:border-0 transition-colors
                          ${isActive ? "bg-indigo-50" : "hover:bg-slate-50"}
                        `}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                            {TYPE_ICONS[type] ?? <Search className="size-3.5 text-slate-400" />}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-slate-900 truncate">
                              {res.title}
                            </div>
                            <div className="text-xs text-slate-400 truncate">
                              {res.subtitle}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-3">
                          <span
                            className={`
                              text-[10px] font-bold uppercase border px-2 py-0.5 rounded-full
                              ${TYPE_BG[type] ?? "bg-slate-100 text-slate-600 border-slate-200"}
                            `}
                          >
                            {type}
                          </span>
                          {isActive && (
                            <ArrowRight className="size-3.5 text-indigo-500" />
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between">
            <span className="text-[10px] text-slate-400">
              Searching across students, faculty, courses & more
            </span>
            <kbd className="text-[10px] font-mono font-bold text-slate-400 bg-white border border-slate-200 px-1.5 py-0.5 rounded">
              Esc
            </kbd>
          </div>
        </div>
      )}
    </div>
  );
}
