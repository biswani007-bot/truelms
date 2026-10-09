"use client";

import React, { useState } from "react";
import Link from "next/link";
import { FiUser, FiLogOut, FiSettings } from "react-icons/fi";

export function UserMenu({ username = "Administrator", role = "Super Admin" }: { username?: string; role?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 p-1.5 border bg-white rounded-lg hover:bg-slate-50 transition"
      >
        <div className="w-7 h-7 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-xs">
          {username.charAt(0)}
        </div>
        <div className="text-left hidden md:block">
          <div className="text-xs font-bold text-gray-900 leading-tight">{username}</div>
          <div className="text-[10px] text-gray-400 font-semibold">{role}</div>
        </div>
      </button>

      {open && (
        <div className="absolute right-0 top-11 bg-white border shadow-xl rounded-xl w-48 p-2 z-40 space-y-1 text-xs font-semibold text-gray-700">
          <Link href="/admin/profile" className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 rounded-lg">
            <FiUser /> Profile
          </Link>
          <Link href="/admin/settings" className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 rounded-lg">
            <FiSettings /> Settings
          </Link>
          <div className="border-t my-1" />
          <button
            type="button"
            onClick={async () => {
              try {
                await fetch("/api/auth/logout", { method: "POST" });
              } catch {
                // ignore
              }
              window.location.href = "/login";
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg text-left"
          >
            <FiLogOut /> Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
