import * as React from "react";
import { cn } from "@/lib/utils";
import { Search, Download } from "lucide-react";

export interface ActionToolbarProps extends React.HTMLAttributes<HTMLDivElement> {
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  onExport?: () => void;
  searchShortcutHint?: string;
}

export function ActionToolbar({
  searchPlaceholder = "Search...",
  searchValue,
  onSearchChange,
  onExport,
  children,
  className,
  searchShortcutHint = "/",
  ...props
}: ActionToolbarProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (
        e.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div
      className={cn(
        "lms-toolbar",
        className
      )}
      {...props}
    >
      {/* Left: Search */}
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
                "lms-input pl-9 pr-12 py-2 text-sm w-64",
                "rounded-xl border-slate-200 focus:border-indigo-500"
              )}
            />
            {!searchValue && searchShortcutHint && (
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-mono font-bold text-slate-400 bg-slate-100 border border-slate-200 rounded pointer-events-none">
                {searchShortcutHint}
              </kbd>
            )}
          </div>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2.5">
        {children}
        {onExport && (
          <button
            type="button"
            onClick={onExport}
            className="lms-btn lms-btn-secondary lms-btn-sm inline-flex items-center gap-1.5"
          >
            <Download className="size-3.5" />
            Export
          </button>
        )}
      </div>
    </div>
  );
}
