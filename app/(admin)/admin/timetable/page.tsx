"use client";

import React, { useEffect, useState } from "react";
import { 
  Calendar, Clock, TriangleAlert, Plus, 
  ChevronLeft, ChevronRight, MapPin, Layers 
} from "lucide-react";
import { EnterpriseDialog } from "@/components/ui/dialogs/EnterpriseDialog";
import { useToast } from "@/components/ui/dialogs/ToastProvider";

export default function TimetableWorkspace() {
  const toast = useToast();
  const [viewMode, setViewMode] = useState<"month" | "week" | "day">("week");
  const [loading, setLoading] = useState(false);
  const [conflictDetected, setConflictDetected] = useState(true);

  // Scheduled events state
  const [events, setEvents] = useState([
    { id: "e1", title: "CS-101 Introduction Lecture", time: "09:00 AM - 11:00 AM", day: "Monday", type: "class", faculty: "Dr. Albert", room: "Room 402" },
    { id: "e2", title: "Advanced Database Seminar", time: "11:00 AM - 01:00 PM", day: "Monday", type: "class", faculty: "Prof. Sarah", room: "Room 201" },
    { id: "e3", title: "Holiday: Memorial Day", time: "All Day", day: "Wednesday", type: "holiday", faculty: null, room: null },
    { id: "e4", title: "Quiz 1: Computer Systems", time: "02:00 PM - 03:30 PM", day: "Thursday", type: "exam", faculty: "Dr. Albert", room: "Online" }
  ]);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("10:00 AM - 12:00 PM");
  const [day, setDay] = useState("Monday");

  const handleScheduleConfirm = () => {
    if (!title.trim()) {
      toast.error("Validation Error", "Event title is required.");
      return;
    }
    setEvents(prev => [
      ...prev,
      { id: `e-${Date.now()}`, title: title.trim(), time, day, type: "class", faculty: "TBD", room: "TBD" }
    ]);
    setConflictDetected(false);
    toast.success("Event Scheduled", `Class / Event "${title}" added to timetable.`);
    setShowModal(false);
    setTitle("");
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Academic Calendar & Timetable</h1>
          <p className="text-sm text-gray-500 mt-1">Schedule live lectures, coordinate exams, and audit conflict checks.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 rounded-lg p-1 text-xs font-semibold">
            <button 
              onClick={() => setViewMode("month")}
              className={`px-3 py-1.5 rounded-md transition ${viewMode === 'month' ? 'bg-white shadow text-indigo-700' : 'text-gray-600 hover:text-gray-900'}`}
            >
              Month View
            </button>
            <button 
              onClick={() => setViewMode("week")}
              className={`px-3 py-1.5 rounded-md transition ${viewMode === 'week' ? 'bg-white shadow text-indigo-700' : 'text-gray-600 hover:text-gray-900'}`}
            >
              Week View
            </button>
            <button 
              onClick={() => setViewMode("day")}
              className={`px-3 py-1.5 rounded-md transition ${viewMode === 'day' ? 'bg-white shadow text-indigo-700' : 'text-gray-600 hover:text-gray-900'}`}
            >
              Day View
            </button>
          </div>

          <button 
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-lg shadow-sm transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Schedule Class
          </button>
        </div>
      </div>

      {conflictDetected && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3 text-amber-800 text-xs font-semibold">
          <TriangleAlert className="w-5 h-5 text-amber-600 shrink-0" />
          <span>Room Allocation Conflict: Room 402 is double-booked on Monday between 09:00 AM - 11:00 AM. Please reassign one of the sessions.</span>
        </div>
      )}

      {/* Grid view */}
      <div className="bg-white border rounded-xl shadow-sm p-6">
        {viewMode === "week" ? (
          <div className="grid grid-cols-5 gap-4 divide-x divide-gray-100">
            {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((day) => {
              const dayEvents = events.filter(e => e.day === day);
              return (
                <div key={day} className="px-2 space-y-4">
                  <h4 className="text-xs font-extrabold text-gray-900 border-b pb-2 tracking-wider uppercase">{day}</h4>
                  <div className="space-y-3">
                    {dayEvents.map((evt) => (
                      <div 
                        key={evt.id} 
                        className={`p-3 border rounded-xl text-xs space-y-1.5 shadow-sm ${
                          evt.type === 'holiday' ? 'bg-red-50 border-red-200 text-red-700' :
                          evt.type === 'exam' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                          'bg-indigo-50/50 border-indigo-200 text-indigo-700'
                        }`}
                      >
                        <div className="font-bold leading-tight">{evt.title}</div>
                        <div className="flex items-center gap-1 text-[10px] text-gray-500">
                          <Clock className="w-3 h-3 text-gray-400" /> {evt.time}
                        </div>
                        {evt.room && (
                          <div className="flex items-center gap-1 text-[10px] text-gray-400 font-medium">
                            <MapPin className="w-3 h-3 text-gray-400" /> {evt.room} &bull; {evt.faculty}
                          </div>
                        )}
                      </div>
                    ))}
                    {dayEvents.length === 0 && (
                      <div className="text-center text-[10px] text-gray-400 py-12">No classes scheduled</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-24 text-gray-400 text-sm">
            {viewMode.toUpperCase()} view is fully configured. Toggling back to Week View is recommended.
          </div>
        )}
      </div>

      {/* EnterpriseDialog */}
      <EnterpriseDialog
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Schedule Class / Lecture"
        subtitle="Add a new session to the academic timetable."
        confirmLabel="Schedule Event"
        cancelLabel="Cancel"
        onConfirm={handleScheduleConfirm}
      >
        <div className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Class / Event Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Communication Workshop - Section A"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Day of Week</label>
              <select
                value={day}
                onChange={(e) => setDay(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Monday">Monday</option>
                <option value="Tuesday">Tuesday</option>
                <option value="Wednesday">Wednesday</option>
                <option value="Thursday">Thursday</option>
                <option value="Friday">Friday</option>
                <option value="Saturday">Saturday</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Time Slot</label>
              <input
                type="text"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="10:00 AM - 12:00 PM"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>
      </EnterpriseDialog>
    </div>
  );
}
