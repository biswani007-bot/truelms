"use client";

import React, { useState } from "react";
import { FiBell, FiCheck } from "react-icons/fi";

export function NotificationCenter() {
  const [unreadCount, setUnreadCount] = useState(3);
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-2 border bg-white rounded-lg text-gray-600 hover:text-indigo-600 relative transition"
        title="Notifications"
      >
        <FiBell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 bg-white border shadow-xl rounded-xl w-80 p-4 z-40 space-y-3">
          <div className="flex justify-between items-center border-b pb-2">
            <span className="font-bold text-xs text-gray-900">Notifications</span>
            <button
              onClick={() => setUnreadCount(0)}
              className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold"
            >
              Mark all as read
            </button>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto text-xs">
            <div className="p-2 bg-indigo-50/50 rounded-lg">
              <div className="font-bold text-indigo-900">New Enrollment Request</div>
              <div className="text-[10px] text-gray-500">John Doe registered for CS-101.</div>
            </div>
            <div className="p-2 bg-slate-50 rounded-lg">
              <div className="font-bold text-gray-800">Invoice Issued</div>
              <div className="text-[10px] text-gray-500">Slip #INV-1024 delivered.</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
