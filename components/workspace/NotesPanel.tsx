"use client";

import React, { useState } from "react";
import { FiPlus, FiMessageSquare } from "react-icons/fi";

export interface NoteItem {
  id: string;
  author: string;
  text: string;
  date: string;
}

export function NotesPanel({ initialNotes = [] }: { initialNotes?: NoteItem[] }) {
  const [notes, setNotes] = useState<NoteItem[]>(initialNotes);
  const [input, setInput] = useState("");

  const handleAddNote = () => {
    if (input.trim()) {
      setNotes(prev => [
        ...prev,
        { id: `note-${Date.now()}`, author: "Current User", text: input, date: "Just now" }
      ]);
      setInput("");
    }
  };

  return (
    <div className="bg-white border rounded-xl shadow-sm p-4 space-y-4">
      <div className="font-bold text-sm text-gray-900 flex items-center gap-2">
        <FiMessageSquare className="text-indigo-600" />
        Internal Faculty Notes
      </div>

      <div className="space-y-2 max-h-60 overflow-y-auto">
        {notes.map((n) => (
          <div key={n.id} className="p-3 bg-slate-50 border rounded-lg text-xs space-y-1">
            <div className="flex justify-between font-bold text-gray-800">
              <span>{n.author}</span>
              <span className="text-[10px] text-gray-400 font-normal">{n.date}</span>
            </div>
            <p className="text-gray-600 leading-relaxed">{n.text}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Add an internal note..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
          className="flex-1 border rounded-lg px-3 py-1.5 text-xs bg-white focus:outline-none"
        />
        <button
          onClick={handleAddNote}
          className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition"
        >
          Add Note
        </button>
      </div>
    </div>
  );
}
