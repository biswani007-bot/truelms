"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";

export default function RolesMatrix({ initialRoles }: { initialRoles: any[] }) {
  const [roles, setRoles] = useState(initialRoles);
  const [editingRole, setEditingRole] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const modules = ["Users", "Roles", "Settings", "Courses", "Batches", "Billing"];
  const actions = ["create", "read", "update", "delete"];

  const handleEdit = (role: any) => {
    setEditingRole({ ...role });
  };

  const handlePermissionToggle = (moduleName: string, action: string) => {
    if (!editingRole) return;
    const permString = `${moduleName.toLowerCase()}:${action}`;
    const perms = new Set(editingRole.permissions || []);
    
    if (perms.has(permString)) {
      perms.delete(permString);
    } else {
      perms.add(permString);
    }
    
    setEditingRole({ ...editingRole, permissions: Array.from(perms) });
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const isNew = !editingRole._id;
      const url = isNew ? "/api/admin/roles" : `/api/admin/roles/${editingRole._id}`;
      const method = isNew ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingRole),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message);

      setRoles((prev) => {
        if (isNew) return [...prev, data.data];
        return prev.map((r) => (r._id === data.data._id ? data.data : r));
      });
      setEditingRole(null);
      setMessage({ type: "success", text: "Role saved successfully!" });
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Messages */}
      {message && (
        <div className={`p-4 rounded-xl border text-sm font-semibold transition-all ${
          message.type === "success"
            ? "bg-emerald-50 border-emerald-200 text-emerald-700"
            : "bg-rose-50 border-rose-200 text-rose-700"
        }`}>
          {message.text}
        </div>
      )}

      {editingRole ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col gap-6">
          <div className="flex justify-between items-center border-b border-gray-100 pb-4">
            <h2 className="text-lg font-bold text-gray-900">{editingRole._id ? "Edit Role Matrix" : "Create New Role"}</h2>
            <button onClick={() => setEditingRole(null)} className="text-gray-400 hover:text-gray-600 text-sm font-bold">Cancel</button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Role Name</label>
              <input
                type="text"
                value={editingRole.name || ""}
                onChange={(e) => setEditingRole({ ...editingRole, name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 text-gray-900 text-sm outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Role Type</label>
              <select
                value={editingRole.type || "custom"}
                onChange={(e) => setEditingRole({ ...editingRole, type: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 text-gray-900 text-sm outline-none bg-white"
              >
                <option value="custom">Custom</option>
                <option value="system">System</option>
              </select>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-gray-900 mb-3">Permission Matrix</h3>
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Module</th>
                    {actions.map(act => (
                      <th key={act} className="px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider text-center">{act}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {modules.map(mod => (
                    <tr key={mod} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3 font-bold text-gray-900">{mod}</td>
                      {actions.map(act => {
                        const permString = `${mod.toLowerCase()}:${act}`;
                        const hasPerm = (editingRole.permissions || []).includes(permString);
                        return (
                          <td key={act} className="px-4 py-3 text-center">
                            <input
                              type="checkbox"
                              checked={hasPerm}
                              onChange={() => handlePermissionToggle(mod, act)}
                              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-100">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-lg transition shadow-sm"
            >
              {saving ? "Saving..." : "Save Role Policy"}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
            <h2 className="text-sm font-bold text-gray-900">Active Roles</h2>
            <button 
              onClick={() => setEditingRole({ name: "", type: "custom", permissions: [], status: "active" })}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm transition"
            >
              + Create Role
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wider bg-white">
                  <th className="px-6 py-4 font-semibold">Role Identifier</th>
                  <th className="px-6 py-4 font-semibold">Access Level</th>
                  <th className="px-6 py-4 font-semibold">Permissions Count</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {roles.map((role: any) => (
                  <tr key={role._id?.toString()} className="hover:bg-gray-50 transition group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold">
                          {role.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-gray-900 font-bold">{role.name}</div>
                          <div className="text-xs text-gray-400 mt-0.5">{role.description || "System assigned role."}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide bg-slate-100 text-slate-600 border border-slate-200">
                        {role.type || "Custom"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      <span className="font-mono text-xs font-medium bg-gray-100 px-1.5 py-0.5 rounded mr-1">{role.permissions?.length || 0}</span> policies bound
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide border ${
                        role.status === "active" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-100 text-gray-600 border-gray-200"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${role.status === "active" ? "bg-emerald-500" : "bg-gray-400"}`}></span>
                        {role.status || "active"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleEdit(role)}
                        className="text-indigo-600 hover:text-indigo-800 font-semibold text-xs opacity-0 group-hover:opacity-100 transition mr-4"
                      >
                        Edit Matrix
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
