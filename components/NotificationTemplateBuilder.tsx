"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";

export default function NotificationTemplateBuilder({ initialTemplates }: { initialTemplates: any[] }) {
  const [templates, setTemplates] = useState(initialTemplates);
  const [editingTemplate, setEditingTemplate] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleEdit = (tpl: any) => {
    setEditingTemplate({ ...tpl, variables: tpl.variables?.join(", ") || "" });
  };

  const handleCreate = () => {
    setEditingTemplate({
      name: "",
      slug: "",
      bodyTemplate: "",
      version: 1,
      channels: ["email"],
      variables: "",
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const payload = {
        ...editingTemplate,
        variables: editingTemplate.variables.split(",").map((v: string) => v.trim()).filter(Boolean),
      };

      const isNew = !editingTemplate._id;
      const url = isNew ? "/api/notifications/templates" : `/api/notifications/templates/${editingTemplate._id}`;
      const method = isNew ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message);

      setTemplates((prev) => {
        if (isNew) return [...prev, data.data];
        return prev.map((t) => (t._id === data.data._id ? data.data : t));
      });
      setEditingTemplate(null);
      setMessage({ type: "success", text: "Template saved successfully!" });
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  };

  if (editingTemplate) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col gap-6">
        <div className="flex justify-between items-center border-b border-gray-100 pb-4">
          <h2 className="text-lg font-bold text-gray-900">{editingTemplate._id ? "Edit Template" : "Create New Template"}</h2>
          <button onClick={() => setEditingTemplate(null)} className="text-gray-400 hover:text-gray-600 text-sm font-bold">Cancel</button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Template Name</label>
            <input
              type="text"
              value={editingTemplate.name}
              onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 text-gray-900 text-sm outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Identifier Slug (e.g. WELCOME_EMAIL)</label>
            <input
              type="text"
              value={editingTemplate.slug}
              onChange={(e) => setEditingTemplate({ ...editingTemplate, slug: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 text-gray-900 text-sm font-mono outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Body Template</label>
          <textarea
            rows={5}
            value={editingTemplate.bodyTemplate}
            onChange={(e) => setEditingTemplate({ ...editingTemplate, bodyTemplate: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 text-gray-900 text-sm font-mono outline-none"
            placeholder="Hello {{name}},\nWelcome to TrueLern!"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Expected Variables (comma separated)</label>
          <input
            type="text"
            value={editingTemplate.variables}
            onChange={(e) => setEditingTemplate({ ...editingTemplate, variables: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 text-gray-900 text-sm font-mono outline-none"
            placeholder="name, email, resetLink"
          />
        </div>

        <div className="flex justify-end pt-4 border-t border-gray-100">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-lg transition shadow-sm"
          >
            {saving ? "Saving..." : "Save Template"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {message && (
        <div className={`p-4 rounded-xl border text-sm font-semibold transition-all ${
          message.type === "success"
            ? "bg-emerald-50 border-emerald-200 text-emerald-700"
            : "bg-rose-50 border-rose-200 text-rose-700"
        }`}>
          {message.text}
        </div>
      )}

      <div className="flex justify-between items-center mb-2">
        <h2 className="text-sm font-bold text-gray-900">Configured Templates</h2>
        <button 
          onClick={handleCreate}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm transition"
        >
          + Create Template
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((tpl) => (
          <div key={tpl._id?.toString()} className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col gap-4 shadow-sm hover:shadow-md transition group">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-bold text-gray-900">{tpl.name}</h3>
                <div className="text-[10px] text-indigo-600 font-mono mt-0.5">{tpl.slug}</div>
              </div>
              <button 
                onClick={() => handleEdit(tpl)}
                className="opacity-0 group-hover:opacity-100 text-xs font-bold text-indigo-600 transition"
              >
                Edit
              </button>
            </div>

            <p className="text-xs text-gray-500 line-clamp-3 bg-gray-50 p-3 rounded-lg border border-gray-100 font-mono">
              {tpl.bodyTemplate}
            </p>

            {tpl.variables && tpl.variables.length > 0 && (
              <div className="border-t border-gray-100 pt-3">
                <span className="text-[10px] text-gray-400 uppercase tracking-wider">Vars: </span>
                <span className="text-[10px] text-gray-500 font-mono bg-gray-50 px-1 py-0.5 rounded">{tpl.variables.join(", ")}</span>
              </div>
            )}
          </div>
        ))}
        {templates.length === 0 && (
          <div className="col-span-3 text-center py-12 text-gray-400 text-sm border border-gray-200 border-dashed rounded-2xl">
            No templates currently configured. Click 'Create Template' to start.
          </div>
        )}
      </div>
    </div>
  );
}
