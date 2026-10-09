"use client";

import React, { useState } from "react";
import { SearchModal } from "./search-modal";

export function SearchTrigger() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-400 text-xs hover:bg-gray-100 hover:text-gray-600 transition"
      >
        <span>🔍</span>
        <span className="hidden lg:inline font-medium">Search...</span>
        <kbd className="hidden lg:inline px-1.5 py-0.5 text-[10px] bg-white border border-gray-200 rounded text-gray-400 font-mono">⌘K</kbd>
      </button>

      <SearchModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
