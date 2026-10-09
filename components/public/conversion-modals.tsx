"use client";

import React, { useState } from "react";
import { submitPublicLead } from "../../lib/api/crm";

export function ConversionModals({
  isOpen,
  type,
  onClose,
}: {
  isOpen: boolean;
  type: "callback" | "brochure" | "campus";
  onClose: () => void;
}) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", notes: "" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const titleMap = {
    callback: "Request a Callback",
    brochure: "Download Program Brochure",
    campus: "Book a Campus Visit",
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await submitPublicLead({
        firstName: form.name,
        email: form.email,
        phone: form.phone,
        message: form.notes,
        source: type === "callback" ? "contact-form" : "landing-page",
      });
      setSuccess(true);
    } catch {
      alert("Submission failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
        <button onClick={onClose} aria-label="Close modal" className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">✕</button>

        {success ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">🎉</div>
            <h3 className="text-xl font-extrabold text-slate-900">Thank You!</h3>
            <p className="text-sm text-slate-500 mt-2">Your request has been received. Our team will contact you shortly.</p>
            <button onClick={onClose} className="mt-6 px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl text-sm">Close</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="text-xl font-bold text-slate-900">{titleMap[type]}</h3>
            <div>
              <label htmlFor="conv-fullName" className="block text-xs font-semibold text-slate-500 mb-1">Full Name *</label>
              <input id="conv-fullName" required type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm" />
            </div>
            <div>
              <label htmlFor="conv-email" className="block text-xs font-semibold text-slate-500 mb-1">Email Address *</label>
              <input id="conv-email" required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm" />
            </div>
            <div>
              <label htmlFor="conv-phone" className="block text-xs font-semibold text-slate-500 mb-1">Phone Number *</label>
              <input id="conv-phone" required type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm" />
            </div>
            <button type="submit" disabled={loading} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl transition">
              {loading ? "Submitting..." : "Submit Request"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
