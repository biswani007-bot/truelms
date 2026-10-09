"use client";

import * as React from "react";
import {
  Search,
  Download,
  ChevronsUpDown,
  ChevronUp,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SkeletonTable } from "./skeleton";
import { EmptyState } from "./EmptyState";

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
  align?: "left" | "center" | "right";
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  onExport?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  bulkActions?: {
    label: string;
    action: (items: T[]) => void;
    icon?: React.ReactNode;
    variant?: "default" | "danger";
  }[];
  toolbar?: React.ReactNode;
  caption?: string;
}

type SortState = { key: string; dir: "asc" | "desc" } | null;

export function DataTable<T extends { _id?: string; id?: string }>({
  data,
  columns,
  loading = false,
  searchPlaceholder = "Search records...",
  searchValue = "",
  onSearchChange,
  onExport,
  emptyTitle = "No records found",
  emptyDescription = "Try adjusting your search or filters to find what you're looking for.",
  bulkActions,
  toolbar,
  caption,
}: DataTableProps<T>) {
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [sort, setSort] = React.useState<SortState>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const getIdentifier = (item: T): string =>
    (item._id || item.id || "").toString();

  const handleSelectAll = () => {
    setSelectedIds(
      selectedIds.length === data.length ? [] : data.map(getIdentifier)
    );
  };

  const handleSelectItem = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSort = (key: string) => {
    setSort((prev) => {
      if (prev?.key === key) {
        return prev.dir === "asc" ? { key, dir: "desc" } : null;
      }
      return { key, dir: "asc" };
    });
  };

  // Local sort — purely visual, no backend impact
  const sortedData = React.useMemo(() => {
    if (!sort) return data;
    return [...data].sort((a, b) => {
      const av = (a as Record<string, unknown>)[sort.key];
      const bv = (b as Record<string, unknown>)[sort.key];
      const as = String(av ?? "").toLowerCase();
      const bs = String(bv ?? "").toLowerCase();
      if (as < bs) return sort.dir === "asc" ? -1 : 1;
      if (as > bs) return sort.dir === "asc" ? 1 : -1;
      return 0;
    });
  }, [data, sort]);

  const selectedItems = data.filter((item) =>
    selectedIds.includes(getIdentifier(item))
  );
  const allSelected = data.length > 0 && selectedIds.length === data.length;
  const someSelected = selectedIds.length > 0 && !allSelected;

  // "/" shortcut to focus search
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (
        e.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="dashboard-card overflow-hidden flex flex-col border-0">
      {/* ── Top Toolbar ── */}
      <div className="px-5 py-3.5 border-b border-slate-100 flex flex-wrap justify-between items-center gap-3 bg-slate-50/60">
        <div className="flex flex-wrap items-center gap-3">
          {onSearchChange && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400 pointer-events-none" />
              <input
                ref={inputRef}
                type="text"
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                className={cn(
                  "pl-9 pr-10 py-2 text-sm w-64",
                  "bg-white border border-slate-200 rounded-xl",
                  "text-slate-800 placeholder-slate-400 font-medium",
                  "focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10",
                  "transition-all duration-150"
                )}
              />
              {!searchValue && (
                <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-mono font-bold text-slate-400 bg-slate-100 border border-slate-200 rounded pointer-events-none">
                  /
                </kbd>
              )}
            </div>
          )}
          {toolbar}
        </div>

        <div className="flex items-center gap-2">
          {onExport && (
            <button
              type="button"
              onClick={onExport}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all duration-150"
            >
              <Download className="size-3.5" />
              Export CSV
            </button>
          )}
        </div>
      </div>

      {/* ── Bulk Action Bar ── */}
      {selectedIds.length > 0 && bulkActions && (
        <div className="bg-indigo-50 border-b border-indigo-200/80 px-5 py-2.5 flex justify-between items-center animate-slide-down">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-indigo-700">
              {selectedIds.length}{" "}
              {selectedIds.length === 1 ? "record" : "records"} selected
            </span>
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="text-xs text-indigo-500 hover:text-indigo-700 font-medium"
            >
              Clear
            </button>
          </div>
          <div className="flex gap-2">
            {bulkActions.map((action, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  action.action(selectedItems);
                  setSelectedIds([]);
                }}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors",
                  action.variant === "danger"
                    ? "bg-red-600 text-white hover:bg-red-700"
                    : "bg-indigo-600 text-white hover:bg-indigo-700"
                )}
              >
                {action.icon}
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Table ── */}
      <div className="overflow-x-auto flex-1">
        {loading ? (
          <SkeletonTable rows={6} cols={columns.length + (bulkActions ? 1 : 0)} />
        ) : data.length === 0 ? (
          <div className="p-8">
            <EmptyState
              variant="search"
              title={emptyTitle}
              description={emptyDescription}
              size="md"
            />
          </div>
        ) : (
          <table className="w-full text-left text-sm border-collapse">
            {caption && (
              <caption className="sr-only">{caption}</caption>
            )}
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50/80">
                {bulkActions && (
                  <th className="w-12 px-5 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = someSelected;
                      }}
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/20 accent-indigo-600"
                      aria-label="Select all rows"
                    />
                  </th>
                )}
                {columns.map((col) => (
                  <th
                    key={col.key}
                    style={col.width ? { width: col.width } : undefined}
                    className={cn(
                      "px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500",
                      col.sortable &&
                        "cursor-pointer hover:text-slate-800 select-none transition-colors"
                    )}
                    onClick={
                      col.sortable ? () => handleSort(col.key) : undefined
                    }
                    aria-sort={
                      sort?.key === col.key
                        ? sort.dir === "asc"
                          ? "ascending"
                          : "descending"
                        : undefined
                    }
                  >
                    <div className="flex items-center gap-1.5">
                      {col.header}
                      {col.sortable && (
                        <span className="text-slate-400 shrink-0">
                          {sort?.key === col.key ? (
                            sort.dir === "asc" ? (
                              <ChevronUp className="size-3" />
                            ) : (
                              <ChevronDown className="size-3" />
                            )
                          ) : (
                            <ChevronsUpDown className="size-3" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {sortedData.map((item, rowIdx) => {
                const id = getIdentifier(item);
                const isSelected = selectedIds.includes(id);

                return (
                  <tr
                    key={id || rowIdx}
                    className={cn(
                      "transition-colors duration-100",
                      isSelected
                        ? "bg-indigo-50/60"
                        : "hover:bg-slate-50/70"
                    )}
                  >
                    {bulkActions && (
                      <td className="px-5 py-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectItem(id)}
                          className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/20 accent-indigo-600"
                          aria-label={`Select row ${rowIdx + 1}`}
                        />
                      </td>
                    )}
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className="px-6 py-3.5 text-sm text-slate-700 font-medium"
                      >
                        {col.render
                          ? col.render(item)
                          : (item as Record<string, unknown>)[col.key] as React.ReactNode}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
