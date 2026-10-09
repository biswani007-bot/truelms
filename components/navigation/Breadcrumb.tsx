import * as React from "react";
import Link from "next/link";
import { FiChevronRight, FiHome } from "react-icons/fi";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className="flex items-center gap-2 text-xs font-semibold text-gray-400 mb-2">
      <Link href="/admin" className="hover:text-indigo-600 transition flex items-center gap-1">
        <FiHome className="w-3.5 h-3.5" />
        <span>Home</span>
      </Link>
      {items.map((item, idx) => (
        <React.Fragment key={idx}>
          <FiChevronRight className="w-3 h-3 text-gray-300" />
          {item.href ? (
            <Link href={item.href} className="hover:text-indigo-600 transition">
              {item.label}
            </Link>
          ) : (
            <span className="text-gray-700 font-bold">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
