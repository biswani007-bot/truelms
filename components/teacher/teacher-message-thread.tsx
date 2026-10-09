"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  MessageSquare,
  Send,
  User,
  GraduationCap,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
} from "lucide-react";
import { Portal } from "@/components/ui/portal";

interface TeacherMessageThreadProps {
  initialMessages: any[];
  teacherId: string;
  rosters?: any[];
}

export function TeacherMessageThread({ initialMessages, teacherId, rosters = [] }: TeacherMessageThreadProps) {
  const [messages, setMessages] = useState<any[]>(initialMessages);
  const [selectedThread, setSelectedThread] = useState<any | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, selectedThread]);

  // New Conversation State
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [newBatchId, setNewBatchId] = useState("");
  const [newStudentId, setNewStudentId] = useState("");
  const [newMessage, setNewMessage] = useState("");

  // Lock body scroll and handle Escape key for modal
  useEffect(() => {
    if (isNewOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape" && !sending) {
          setIsNewOpen(false);
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = originalOverflow;
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [isNewOpen, sending]);

  const uniqueBatches = Array.from(new Map(rosters.filter(r => r.batch).map(r => [r.batch._id, r.batch])).values());
  const studentsInBatch = rosters.filter(r => r.batch?._id === newBatchId);
  const selectedRosterEntry = rosters.find(r => r.student?._id === newStudentId);

  // Group messages by student + parent
  const threadsMap = new Map<string, { student: any; parent: any; batch: any; messages: any[] }>();

  for (const m of messages) {
    const sId = m.student?._id || m.student;
    const pId = m.parent?._id || m.parent;
    const key = `${sId}_${pId}`;

    if (!threadsMap.has(key)) {
      threadsMap.set(key, {
        student: m.student,
        parent: m.parent,
        batch: m.batch,
        messages: [],
      });
    }
    threadsMap.get(key)!.messages.push(m);
  }

  const threadList = Array.from(threadsMap.entries()).map(([key, data]) => ({
    key,
    ...data,
  }));

  const activeThread =
    selectedThread || (threadList.length > 0 ? threadList[0] : null);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !activeThread) return;

    setSending(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/teacher/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: activeThread.student?._id || activeThread.student,
          parentId: activeThread.parent?._id || activeThread.parent,
          batchId: activeThread.batch?._id || activeThread.batch,
          message: replyText.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || "Failed to send reply");
      }

      const newMsg = {
        ...json.data,
        student: activeThread.student,
        parent: activeThread.parent,
        batch: activeThread.batch,
      };

      setMessages((prev) => [...prev, newMsg]);
      setReplyText("");
      setSuccess("Reply sent to parent");
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      setError(err.message || "Failed to send reply");
    } finally {
      setSending(false);
    }
  };

  const handleStartNewConversation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !newStudentId || !newBatchId || !selectedRosterEntry?.parent) return;

    setSending(true);
    try {
      const res = await fetch("/api/teacher/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: newStudentId,
          parentId: selectedRosterEntry.parent._id,
          batchId: newBatchId,
          message: newMessage.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to send message");

      const newMsg = {
        ...json.data,
        student: selectedRosterEntry.student,
        parent: selectedRosterEntry.parent,
        batch: selectedRosterEntry.batch,
      };

      setMessages((prev) => [...prev, newMsg]);
      setIsNewOpen(false);
      setNewMessage("");
      setNewBatchId("");
      setNewStudentId("");
      
      const newKey = `${selectedRosterEntry.student._id}_${selectedRosterEntry.parent._id}`;
      setSelectedThread({
        key: newKey,
        student: selectedRosterEntry.student,
        parent: selectedRosterEntry.parent,
        batch: selectedRosterEntry.batch,
        messages: [newMsg],
      });
    } catch (err: any) {
      setError(err.message || "Failed to start conversation");
    } finally {
      setSending(false);
    }
  };

  if (threadList.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center max-w-xl mx-auto">
        <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-900">No Parent Inquiries Yet</h3>
        <p className="text-sm text-slate-500 mt-1">
          When parents send inquiries regarding their enrolled children, they will appear here for you to review and reply.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative">
      {/* Thread list */}
      <div className="lg:col-span-1 space-y-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Conversations ({threadList.length})
          </h3>
          <button 
            onClick={() => setIsNewOpen(true)}
            className="text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition"
          >
            + New
          </button>
        </div>
        {threadList.map((t) => {
          const isSelected = activeThread?.key === t.key;
          const lastMsg = t.messages[t.messages.length - 1];
          const studentName = t.student
            ? `${t.student.firstName} ${t.student.lastName}`
            : "Student";
          const parentName = t.parent
            ? `${t.parent.firstName} ${t.parent.lastName}`
            : "Parent";

          return (
            <button
              key={t.key}
              onClick={() => setSelectedThread(t)}
              className={`w-full text-left p-3.5 rounded-2xl transition border flex items-start gap-3 ${
                isSelected
                  ? "bg-indigo-50/70 border-indigo-300 shadow-sm"
                  : "bg-white hover:bg-slate-50 border-slate-200/70"
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0 text-sm">
                {parentName[0]}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-extrabold text-slate-900 truncate">
                    {parentName}
                  </p>
                  <span className="text-[9px] text-slate-400 font-mono">
                    {lastMsg?.createdAt
                      ? new Date(lastMsg.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : ""}
                  </span>
                </div>
                <p className="text-[11px] text-indigo-700 font-medium truncate mt-0.5">
                  Child: {studentName}
                </p>
                <p className="text-[10px] text-slate-500 truncate mt-1">
                  {lastMsg?.message}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Message Feed & Reply */}
      <div className="lg:col-span-2 flex flex-col bg-white border border-slate-200 rounded-3xl shadow-sm min-h-[500px] overflow-hidden">
        {activeThread && (
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">
                Parent: {activeThread.parent?.firstName} {activeThread.parent?.lastName}
              </h3>
              <p className="text-xs text-slate-500">
                Regarding student: <span className="font-semibold text-slate-700">{activeThread.student?.firstName} {activeThread.student?.lastName}</span>
                {activeThread.batch?.batchName ? ` • ${activeThread.batch.batchName}` : ""}
              </p>
            </div>
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
              Child Inquiries
            </span>
          </div>
        )}

        {error && (
          <div className="m-3 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="m-3 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Message feed */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4 max-h-[360px] bg-slate-50/30">
          {activeThread?.messages.map((m: any) => {
            const isTeacher = m.senderRole === "teacher";
            return (
              <div
                key={m._id}
                className={`flex flex-col ${isTeacher ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl p-4 text-xs leading-relaxed shadow-sm ${
                    isTeacher
                      ? "bg-indigo-600 text-white rounded-br-none"
                      : "bg-white border border-slate-200 text-slate-800 rounded-bl-none"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.message}</p>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 px-1">
                  {isTeacher ? "You" : activeThread.parent?.firstName || "Parent"} •{" "}
                  {new Date(m.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Reply form */}
        <form
          onSubmit={handleSendReply}
          className="p-4 border-t border-slate-200 bg-white flex gap-2"
        >
          <textarea
            rows={2}
            required
            placeholder={`Reply to ${activeThread?.parent?.firstName || "parent"} regarding ${activeThread?.student?.firstName || "student"}...`}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            className="flex-1 text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white resize-none transition"
          />
          <button
            type="submit"
            disabled={sending || !replyText.trim()}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-2xl shadow-sm transition flex items-center justify-center gap-1.5 self-end"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{sending ? "Sending..." : "Reply"}</span>
          </button>
        </form>
      </div>

      {/* New Conversation Modal */}
      {isNewOpen && (
        <Portal>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-hidden">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
              onClick={() => {
                if (!sending) setIsNewOpen(false);
              }}
            />

            {/* Modal Surface */}
            <div className="relative bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 flex flex-col max-h-[calc(100vh-2.5rem)] sm:max-h-[calc(100vh-4rem)] overflow-hidden z-10 animate-scale-in">
              <div className="p-5 sm:p-6 border-b border-slate-100 flex justify-between items-start shrink-0">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">Start Parent Conversation</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Select a student from your roster to contact their linked parent/guardian.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsNewOpen(false)}
                  disabled={sending}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition shrink-0"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleStartNewConversation} className="flex flex-col flex-1 overflow-hidden">
                <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Select Batch</label>
                    <select
                      required
                      value={newBatchId}
                      onChange={(e) => {
                        setNewBatchId(e.target.value);
                        setNewStudentId("");
                      }}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">-- Choose Batch --</option>
                      {uniqueBatches.map(b => (
                        <option key={b._id} value={b._id}>{b.batchName}</option>
                      ))}
                    </select>
                  </div>

                  {newBatchId && (
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Select Student</label>
                      <select
                        required
                        value={newStudentId}
                        onChange={(e) => setNewStudentId(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">-- Choose Student --</option>
                        {studentsInBatch.map(r => (
                          <option key={r.student._id} value={r.student._id}>
                            {r.student.firstName} {r.student.lastName} ({r.student.studentId})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {newStudentId && (
                    <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100 mb-4">
                      <span className="block text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-1">Message Recipient Resolved</span>
                      {selectedRosterEntry?.parent ? (
                        <div className="text-sm font-bold text-indigo-900">
                          {selectedRosterEntry.parent.firstName} {selectedRosterEntry.parent.lastName}
                          <span className="text-xs font-normal text-indigo-600 ml-2">({selectedRosterEntry.parent.email})</span>
                        </div>
                      ) : (
                        <div className="text-xs text-rose-600 font-bold">No parent linked to this student. Cannot initiate conversation.</div>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Message</label>
                    <textarea
                      rows={4}
                      required
                      placeholder="Type your message to the parent here..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      disabled={!selectedRosterEntry?.parent}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 px-5 sm:px-6 py-4 bg-slate-50/60 border-t border-slate-100 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsNewOpen(false)}
                    disabled={sending}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={sending || !newMessage.trim() || !selectedRosterEntry?.parent}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md transition"
                  >
                    {sending ? "Sending..." : "Send Message"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}
