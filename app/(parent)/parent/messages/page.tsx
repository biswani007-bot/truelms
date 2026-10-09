"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParentChild } from "@/components/parent/parent-child-context";
import {
  MessageSquare,
  Send,
  UserCheck,
  ShieldCheck,
  Clock,
  CheckCheck,
  Check,
  AlertCircle,
  RefreshCw,
  GraduationCap,
  Sparkles,
} from "lucide-react";

interface TeacherInfo {
  _id: string;
  firstName: string;
  lastName: string;
  designation: string;
  department: string;
  batchId: string;
  batchName: string;
  role: string;
}

interface MessageItem {
  _id: string;
  senderRole: "parent" | "teacher";
  subject?: string;
  message: string;
  isRead: boolean;
  readAt?: string;
  status: string;
  createdAt: string;
}

export default function ParentMessagesPage() {
  const { children: childrenList, selectedChild, setSelectedChild, loading: childLoading } = useParentChild();
  const [teachers, setTeachers] = useState<TeacherInfo[]>([]);
  const [activeTeacher, setActiveTeacher] = useState<TeacherInfo | null>(null);
  const [courseFilter, setCourseFilter] = useState<string>("all");
  
  const uniqueCourses = Array.from(new Set(teachers.map(t => t.batchName).filter(Boolean)));
  const filteredTeachers = teachers.filter(t => courseFilter === "all" || t.batchName === courseFilter);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [sending, setSending] = useState<boolean>(false);
  const [inputMessage, setInputMessage] = useState<string>("");
  const [subject, setSubject] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const childId = selectedChild?.studentId || (selectedChild as any)?._id;

  useEffect(() => {
    if (!childId) return;
    loadConversation();
  }, [childId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversation = async (teacherId?: string) => {
    if (!childId) return;
    setLoading(true);
    setError(null);
    try {
      const url = teacherId
        ? `/api/parent/children/${childId}/messages?teacherId=${teacherId}`
        : `/api/parent/children/${childId}/messages`;
      const res = await fetch(url);
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message || "Failed to load messages");
      }

      setTeachers(json.data.teachers || []);
      setActiveTeacher(json.data.activeTeacher || null);
      setMessages(json.data.messages || []);
    } catch (err: any) {
      setError(err.message || "Failed to load teacher messages");
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !childId || !activeTeacher) return;

    setSending(true);
    setError(null);
    setSuccessNotice(null);

    try {
      const res = await fetch(`/api/parent/children/${childId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacherId: activeTeacher._id,
          subject: subject.trim() || undefined,
          message: inputMessage.trim(),
        }),
      });
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message || "Failed to send message");
      }

      setMessages((prev) => [...prev, json.data]);
      setInputMessage("");
      setSubject("");
      setSuccessNotice("Message sent to instructor");
      setTimeout(() => setSuccessNotice(null), 4000);
    } catch (err: any) {
      setError(err.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  if (childLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!selectedChild) {
    return (
      <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center max-w-xl mx-auto mt-8">
        <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-900">No Child Selected</h3>
        <p className="text-sm text-slate-500 mt-1">
          Please select a child from the sidebar to view academic communications.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1600px] w-full mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200/80 p-6 rounded-3xl shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" /> Child-Scoped Academic Communication
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Messages & Instructor Inquiries
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Direct communication for <strong className="text-slate-800">{selectedChild.firstName} {selectedChild.lastName}</strong> with assigned instructors.
          </p>
        </div>

        <button
          onClick={() => loadConversation(activeTeacher?._id)}
          disabled={loading}
          className="self-start md:self-auto flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-bold rounded-2xl text-xs transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {successNotice && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successNotice}</span>
        </div>
      )}

      {/* Main Communication Grid */}
      {loading && teachers.length === 0 ? (
        <div className="flex items-center justify-center min-h-[300px] bg-white border border-slate-200 rounded-3xl">
          <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Assigned Teachers */}
          <div className="lg:col-span-1 space-y-4">
            
            {/* Filtering Controls */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-4 shadow-sm flex flex-col gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Student Scope</label>
                <select
                  value={selectedChild.studentId}
                  onChange={(e) => {
                    const child = childrenList.find(c => c.studentId === e.target.value);
                    if (child) setSelectedChild(child);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500 font-medium"
                >
                  {childrenList.map((c) => (
                    <option key={c.studentId} value={c.studentId}>
                      {c.firstName} {c.lastName}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Course / Cohort Filter</label>
                <select
                  value={courseFilter}
                  onChange={(e) => setCourseFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500 font-medium"
                >
                  <option value="all">All Enrolled Courses</option>
                  {uniqueCourses.map((course) => (
                    <option key={course} value={course}>{course}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                Assigned Instructors ({filteredTeachers.length})
              </h2>
              {teachers.length === 0 ? (
                <div className="text-center py-8">
                  <GraduationCap className="w-8 h-8 text-amber-500 mx-auto mb-2 opacity-50" />
                  <p className="text-xs text-slate-500">No assigned instructor found for {selectedChild.firstName}.</p>
                </div>
              ) : filteredTeachers.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-xs text-slate-500">No instructors match the selected filters.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                  {filteredTeachers.map((t) => {
                    const isSelected = activeTeacher?._id === t._id;
                    return (
                      <button
                        key={t._id}
                        onClick={() => {
                          setActiveTeacher(t);
                          loadConversation(t._id);
                        }}
                        className={`w-full text-left p-3.5 rounded-2xl transition border flex items-start gap-3 ${
                          isSelected
                            ? "bg-emerald-50/60 border-emerald-300 shadow-sm"
                            : "bg-white hover:bg-slate-50 border-slate-200/60"
                        }`}
                      >
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-bold flex items-center justify-center shrink-0 text-sm shadow-sm">
                          {t.firstName[0]}
                          {t.lastName[0]}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-extrabold text-slate-900 truncate">
                              {t.firstName} {t.lastName}
                            </p>
                            <span className="text-[9px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800">
                              {t.role}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                            {t.designation} • {t.department}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate mt-1">
                            Cohort: {t.batchName}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Scope info card */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-3xl p-4 text-[11px] text-slate-500 leading-relaxed">
              <span className="font-bold text-slate-700 block mb-1">Academic Communication Policy:</span>
              Messages are securely bound to <span className="font-bold text-slate-700">{selectedChild.firstName}</span> and active cohort faculty. All inquiries are permanently logged in student records.
            </div>
          </div>

          {/* Right Column: Conversation Thread & Compose */}
          <div className="lg:col-span-2 flex flex-col bg-white border border-slate-200/80 rounded-3xl shadow-sm min-h-[550px] overflow-hidden">
            {/* Active Thread Header */}
            {activeTeacher && (
              <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                    {activeTeacher.firstName[0]}
                    {activeTeacher.lastName[0]}
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">
                      {activeTeacher.firstName} {activeTeacher.lastName}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {activeTeacher.role} • {activeTeacher.batchName}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full text-xs font-bold">
                  <UserCheck className="w-3.5 h-3.5" /> Verified Faculty
                </div>
              </div>
            )}

            {/* Message Feed */}
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 max-h-[420px] bg-slate-50/30">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-12">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">No messages yet</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs">
                    Start a conversation with {activeTeacher?.firstName} regarding {selectedChild.firstName}'s coursework or progress.
                  </p>
                </div>
              ) : (
                messages.map((m) => {
                  const isParent = m.senderRole === "parent";
                  return (
                    <div
                      key={m._id}
                      className={`flex flex-col ${isParent ? "items-end" : "items-start"}`}
                    >
                      <div
                        className={`max-w-[85%] sm:max-w-[75%] rounded-3xl p-4 shadow-sm text-xs leading-relaxed ${
                          isParent
                            ? "bg-emerald-600 text-white rounded-br-none"
                            : "bg-white border border-slate-200/80 text-slate-800 rounded-bl-none"
                        }`}
                      >
                        {m.subject && (
                          <p
                            className={`font-bold text-[11px] mb-1.5 pb-1 border-b ${
                              isParent
                                ? "text-emerald-100 border-emerald-500/50"
                                : "text-slate-900 border-slate-100"
                            }`}
                          >
                            {m.subject}
                          </p>
                        )}
                        <p className="whitespace-pre-wrap">{m.message}</p>
                      </div>

                      <div
                        className={`flex items-center gap-1.5 mt-1 px-1 text-[10px] text-slate-400 ${
                          isParent ? "flex-row-reverse" : "flex-row"
                        }`}
                      >
                        <span>
                          {new Date(m.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {isParent && (
                          <span title={m.isRead ? "Read by teacher" : "Sent"}>
                            {m.isRead ? (
                              <CheckCheck className="w-3 h-3 text-emerald-600 inline" />
                            ) : (
                              <Check className="w-3 h-3 text-slate-400 inline" />
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Compose Box */}
            <form
              onSubmit={handleSendMessage}
              className="p-4 border-t border-slate-200/80 bg-white space-y-2.5"
            >
              <input
                type="text"
                placeholder="Topic / Subject (optional)"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full text-xs px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
              />
              <div className="flex gap-2">
                <textarea
                  rows={2}
                  required
                  placeholder={`Write your message to ${activeTeacher?.firstName || "instructor"}...`}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  className="flex-1 text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white resize-none transition"
                />
                <button
                  type="submit"
                  disabled={sending || !inputMessage.trim()}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-2xl shadow-sm hover:shadow transition flex items-center justify-center gap-1.5 self-end"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{sending ? "Sending..." : "Send"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
