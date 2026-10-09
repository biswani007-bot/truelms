"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export interface SidebarItem {
  href: string;
  label: string;
  icon?: React.ReactNode;
}

export function Sidebar({ items }: { items: SidebarItem[] }) {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-gray-200 bg-white flex flex-col shrink-0 shadow-sm">
      <div className="h-16 flex items-center px-6 border-b border-gray-100 shrink-0 gap-2">
        <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black text-xs">
          TL
        </div>
        <span className="text-base font-extrabold text-gray-900 tracking-tight">TrueLern Enterprise</span>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {items.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold transition ${
                isActive
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-200/50"
                  : "text-gray-600 hover:bg-slate-50 hover:text-gray-900"
              }`}
            >
              {item.icon && <span className="shrink-0">{item.icon}</span>}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
