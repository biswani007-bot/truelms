"use client";

import React, { useState, useEffect } from "react";
import { EnterpriseDialog } from "@/components/ui/dialogs/EnterpriseDialog";
import { useToast } from "@/components/ui/dialogs/ToastProvider";

export default function MaintenanceCenter() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [maintenance, setMaintenance] = useState({
    enabled: false,
    message: "System is under maintenance. We will be back shortly.",
    estimatedEndTime: "",
    whitelistedIps: [] as string[]
  });
  const [newIp, setNewIp] = useState("");

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/settings");
      const data = await res.json();
      if (data.success && data.data.maintenance) {
        setMaintenance(data.data.maintenance);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveConfirm = async () => {
    setShowConfirmDialog(false);
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings");
      const data = await res.json();
      const currentSettings = data.data;
      
      const payload = {
        ...currentSettings,
        maintenance
      };

      const updateRes = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const updateData = await updateRes.json();
      if (updateData.success) {
        toast.success("Settings Saved", "Maintenance configuration updated successfully.");
      } else {
        toast.error("Save Failed", updateData.error || "Failed to save settings");
      }
    } catch {
      toast.error("Network Error", "Error saving maintenance settings");
    } finally {
      setSaving(false);
    }
  };

  const addIp = () => {
    if (newIp && !maintenance.whitelistedIps.includes(newIp)) {
      setMaintenance({ ...maintenance, whitelistedIps: [...maintenance.whitelistedIps, newIp] });
      setNewIp("");
    }
  };

  const removeIp = (ip: string) => {
    setMaintenance({ ...maintenance, whitelistedIps: maintenance.whitelistedIps.filter(i => i !== ip) });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="lms-page-title">Maintenance Center</h1>
          <p className="lms-caption mt-1">Control platform access during scheduled upgrades or critical incidents.</p>
        </div>
        <button 
          onClick={() => setShowConfirmDialog(true)}
          disabled={saving || loading}
          className="lms-btn lms-btn-primary"
        >
          {saving ? "Saving..." : "Save Configuration"}
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-gray-400 bg-white border border-gray-200 rounded-2xl shadow-sm">
          <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
          Loading maintenance settings...
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 space-y-8">
            
            {/* Status Toggle */}
            <div className={`p-6 rounded-xl border ${maintenance.enabled ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className={`text-lg font-bold ${maintenance.enabled ? 'text-red-700' : 'text-gray-900'}`}>
                    Maintenance Mode is {maintenance.enabled ? 'ON' : 'OFF'}
                  </h2>
                  <p className={`text-sm mt-1 ${maintenance.enabled ? 'text-red-600/80' : 'text-gray-500'}`}>
                    When enabled, all traffic except whitelisted IP addresses will see the maintenance screen.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={maintenance.enabled}
                    onChange={(e) => setMaintenance({ ...maintenance, enabled: e.target.checked })}
                  />
                  <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>
            </div>

            {/* Config Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Display Message</label>
                <textarea 
                  value={maintenance.message}
                  onChange={(e) => setMaintenance({ ...maintenance, message: e.target.value })}
                  className="w-full text-sm border-gray-200 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 min-h-[100px]"
                  placeholder="We are currently upgrading our systems..."
                ></textarea>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Estimated End Time</label>
                <input 
                  type="datetime-local" 
                  value={maintenance.estimatedEndTime}
                  onChange={(e) => setMaintenance({ ...maintenance, estimatedEndTime: e.target.value })}
                  className="w-full text-sm border-gray-200 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
                <p className="text-xs text-gray-400 mt-1">Optional. Displayed to users to set expectations.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">IP Whitelist</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={newIp}
                    onChange={(e) => setNewIp(e.target.value)}
                    placeholder="e.g. 192.168.1.1"
                    className="w-full text-sm border-gray-200 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <button 
                    onClick={addIp}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-gray-700 font-bold rounded-lg text-sm transition-colors"
                  >
                    Add
                  </button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {maintenance.whitelistedIps.map((ip) => (
                    <span key={ip} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                      {ip}
                      <button onClick={() => removeIp(ip)} className="text-gray-400 hover:text-red-500">&times;</button>
                    </span>
                  ))}
                  {maintenance.whitelistedIps.length === 0 && (
                    <span className="text-xs text-gray-400">No IP addresses whitelisted.</span>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Maintenance Confirmation Enterprise Dialog */}
      <EnterpriseDialog
        isOpen={showConfirmDialog}
        onClose={() => { if (!saving) setShowConfirmDialog(false); }}
        title="Update Maintenance Mode"
        subtitle="Platform Access Override"
        description="Are you sure you want to update the maintenance configuration? Enabling maintenance mode will restrict platform access for non-administrative users."
        variant={maintenance.enabled ? "warning" : "info"}
        confirmLabel="Confirm & Apply"
        cancelLabel="Cancel"
        onConfirm={handleSaveConfirm}
        loading={saving}
      />
    </div>
  );
}
