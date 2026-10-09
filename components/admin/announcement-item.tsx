"use client";

import React, { useState } from "react";
import { X, MessageSquare, Megaphone } from "lucide-react";

interface Announcement {
  _id: string;
  title: string;
  content: string;
  isPinned: boolean;
  sentBy?: { firstName: string; lastName: string } | null;
  createdAt: string;
}

export function AnnouncementItem({ announcement }: { announcement: Announcement }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div 
        onClick={() => setIsOpen(true)}
        className="p-4 bg-white border border-slate-200 rounded-xl cursor-pointer hover:border-indigo-300 hover:shadow-sm transition group"
      >
        <div className="flex justify-between items-start gap-2">
          <div className="flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-indigo-500 group-hover:text-indigo-600 transition" />
            <h4 className="text-sm font-bold text-gray-900 group-hover:text-indigo-700 transition">{announcement.title}</h4>
          </div>
          {announcement.isPinned && (
            <span className="px-1.5 py-0.5 rounded text-[8px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200 uppercase">
              Pinned
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-2 line-clamp-2">{announcement.content}</p>
        <div className="mt-3 text-[10px] text-slate-400 font-medium">Click to read full announcement</div>
      </div>

      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col transform transition-all">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-slate-900 leading-tight">Class Announcement</h3>
                  <div className="text-xs text-slate-500 mt-0.5 font-medium">
                    {new Date(announcement.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)} 
                className="text-slate-400 hover:bg-slate-200 hover:text-slate-700 p-2 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="flex items-center gap-3 mb-4">
                <h4 className="text-xl font-bold text-gray-900">{announcement.title}</h4>
                {announcement.isPinned && (
                  <span className="px-2 py-1 rounded text-[10px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200 uppercase tracking-wider shadow-sm">
                    Pinned
                  </span>
                )}
              </div>
              
              <div className="prose prose-sm prose-slate max-w-none text-slate-700">
                {announcement.content.split('\n').map((paragraph, idx) => (
                  <p key={idx} className="mb-4 last:mb-0 leading-relaxed">{paragraph}</p>
                ))}
              </div>
              
              {announcement.sentBy && (
                <div className="mt-8 pt-6 border-t border-slate-100 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs uppercase">
                    {announcement.sentBy.firstName[0]}{announcement.sentBy.lastName[0]}
                  </div>
                  <div className="text-xs">
                    <span className="block text-slate-500 font-medium">Posted by</span>
                    <span className="font-bold text-slate-800">{announcement.sentBy.firstName} {announcement.sentBy.lastName}</span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <button 
                onClick={() => setIsOpen(false)}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
