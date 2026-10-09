"use client";

import React, { useState, useEffect } from "react";

interface Portal {
  portalId: string;
  name: string;
  type: string;
  status: "active" | "maintenance" | "disabled" | "beta";
  version: string;
  minVersionRequired: string;
  forceUpdate: boolean;
  maintenanceMessage: string;
  authSettings: any;
  featureFlags: Record<string, boolean>;
  notificationSettings: any;
  branding: any;
  consentSettings: any;
  mobileConfig: any;
  security: any;
}

interface AuditLog {
  _id: string;
  portalId: string;
  adminEmail: string;
  module: string;
  fieldName: string;
  oldValue: any;
  newValue: any;
  createdAt: string;
}

export default function EnterprisePortalGovernanceCenter() {
  const [portals, setPortals] = useState<Portal[]>([]);
  const [selectedPortalId, setSelectedPortalId] = useState<string>("student-portal");
  const [activeTab, setActiveTab] = useState<string>("directory");
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  const currentPortal = portals.find((p) => p.portalId === selectedPortalId);

  const fetchPortals = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/governance/portals");
      const data = await res.json();
      if (data.success) {
        setPortals(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch portal configurations", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await fetch(`/api/admin/governance/audit-logs?portalId=${selectedPortalId}`);
      const data = await res.json();
      if (data.success) {
        setAuditLogs(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch audit logs", err);
    }
  };

  useEffect(() => {
    fetchPortals();
  }, []);

  useEffect(() => {
    if (activeTab === "audit") {
      fetchAuditLogs();
    }
  }, [selectedPortalId, activeTab]);

  const handleUpdatePortal = async (updates: Partial<Portal>, moduleName: string) => {
    if (!currentPortal) return;
    setSaving(true);
    setStatusMsg("");
    try {
      const res = await fetch("/api/admin/governance/portals", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          portalId: currentPortal.portalId,
          updates,
          module: moduleName,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMsg(`✅ ${moduleName.toUpperCase()} configuration saved successfully.`);
        fetchPortals();
      } else {
        setStatusMsg(`❌ Update failed: ${data.error}`);
      }
    } catch (err) {
      setStatusMsg("❌ Network error saving configuration.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-sm font-bold text-gray-400 bg-white rounded-2xl border border-gray-200 shadow-sm">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
        Loading Enterprise Portal Governance Center...
      </div>
    );
  }

  const tabs = [
    { id: "directory", label: "Directory & Status" },
    { id: "auth", label: "Authentication" },
    { id: "features", label: "Feature Flags" },
    { id: "notifications", label: "Notifications" },
    { id: "branding", label: "Branding & Theme" },
    { id: "consent", label: "Consent & Policies" },
    { id: "mobile", label: "Mobile Apps" },
    { id: "security", label: "Security & Limits" },
    { id: "audit", label: "Governance Audit Logs" },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white p-6 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 bg-indigo-500/30 border border-indigo-400/30 rounded-full text-xs font-black uppercase tracking-widest text-indigo-200">
              Master Governance Control Center
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">Enterprise Portal Governance Engine</h1>
          <p className="text-xs text-indigo-200 font-medium mt-1">
            Configure, restrict, version, and brand Student, Teacher, Parent, Mobile, and future portals from one central hub.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-indigo-950/60 p-2 rounded-2xl border border-indigo-700/50">
          <label className="text-xs font-bold text-indigo-300 pl-2">Target Portal:</label>
          <select
            value={selectedPortalId}
            onChange={(e) => setSelectedPortalId(e.target.value)}
            className="bg-slate-900 text-white font-extrabold text-xs px-3 py-2 rounded-xl border border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            {portals.map((p) => (
              <option key={p.portalId} value={p.portalId}>
                {p.name} ({p.status.toUpperCase()})
              </option>
            ))}
          </select>
        </div>
      </div>

      {statusMsg && (
        <div className="p-4 rounded-2xl bg-slate-900 text-white text-xs font-bold border border-indigo-500 shadow-md flex items-center justify-between">
          <span>{statusMsg}</span>
          <button onClick={() => setStatusMsg("")} className="text-gray-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex overflow-x-auto gap-2 border-b border-gray-200 pb-2 scrollbar-none">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-slate-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* MODULE 1: PORTAL DIRECTORY */}
      {activeTab === "directory" && currentPortal && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
          <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">Module 1: Directory, Status & Lifecycle Governance</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Portal Status</label>
              <select
                value={currentPortal.status}
                onChange={(e) => handleUpdatePortal({ status: e.target.value as any }, "directory")}
                className="w-full px-3 py-2 border rounded-xl text-xs font-bold"
              >
                <option value="active">Active (Live Operational)</option>
                <option value="maintenance">Scheduled Maintenance</option>
                <option value="beta">Beta Testing Mode</option>
                <option value="disabled">Disabled (Access Revoked)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Portal Version</label>
              <input
                type="text"
                value={currentPortal.version}
                onChange={(e) => setPortals(portals.map(p => p.portalId === currentPortal.portalId ? { ...p, version: e.target.value } : p))}
                onBlur={(e) => handleUpdatePortal({ version: e.target.value }, "directory")}
                className="w-full px-3 py-2 border rounded-xl text-xs font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Minimum Version Required</label>
              <input
                type="text"
                value={currentPortal.minVersionRequired}
                onChange={(e) => setPortals(portals.map(p => p.portalId === currentPortal.portalId ? { ...p, minVersionRequired: e.target.value } : p))}
                onBlur={(e) => handleUpdatePortal({ minVersionRequired: e.target.value }, "directory")}
                className="w-full px-3 py-2 border rounded-xl text-xs font-mono font-bold"
              />
            </div>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-gray-200 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-gray-900">Enforce Client Update (Force Update)</div>
              <div className="text-[11px] text-gray-500 font-medium">Prevent outdated mobile or web clients from accessing APIs until upgraded</div>
            </div>
            <button
              onClick={() => handleUpdatePortal({ forceUpdate: !currentPortal.forceUpdate }, "directory")}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${currentPortal.forceUpdate ? "bg-indigo-600 justify-end" : "bg-gray-300 justify-start"}`}
            >
              <span className="w-4 h-4 rounded-full bg-white shadow-md" />
            </button>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">Maintenance Banner Message</label>
            <input
              type="text"
              value={currentPortal.maintenanceMessage}
              onChange={(e) => setPortals(portals.map(p => p.portalId === currentPortal.portalId ? { ...p, maintenanceMessage: e.target.value } : p))}
              onBlur={(e) => handleUpdatePortal({ maintenanceMessage: e.target.value }, "directory")}
              className="w-full px-3 py-2 border rounded-xl text-xs font-medium"
            />
          </div>
        </div>
      )}

      {/* MODULE 2: AUTHENTICATION */}
      {activeTab === "auth" && currentPortal && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
          <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">Module 2: Authentication & Identity Policies</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { key: "emailLogin", label: "Email / Password Login", desc: "Allow credential-based authentication" },
              { key: "googleLogin", label: "Google Workspace Single Sign-On", desc: "Allow Google OAuth2 authentication" },
              { key: "microsoftLogin", label: "Microsoft Entra ID / SSO", desc: "Future-ready Microsoft Azure AD OAuth" },
              { key: "appleLogin", label: "Sign in with Apple", desc: "Future-ready Apple OAuth for iOS & Web" },
              { key: "mfaRequired", label: "Multi-Factor Authentication (MFA)", desc: "Enforce OTP / Authenticator check on login" },
              { key: "rememberMeEnabled", label: "Remember Me & Persistent Auth", desc: "Allow extended persistent refresh sessions" },
            ].map((item) => {
              const val = currentPortal.authSettings?.[item.key];
              return (
                <div key={item.key} className="p-3.5 rounded-xl bg-slate-50 border border-gray-100 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-gray-900">{item.label}</div>
                    <div className="text-[11px] font-medium text-gray-500">{item.desc}</div>
                  </div>
                  <button
                    onClick={() => handleUpdatePortal({ authSettings: { ...currentPortal.authSettings, [item.key]: !val } }, "auth")}
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${val ? "bg-indigo-600 justify-end" : "bg-gray-300 justify-start"}`}
                  >
                    <span className="w-4 h-4 rounded-full bg-white shadow-md" />
                  </button>
                </div>
              );
            })}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Session Timeout (Seconds)</label>
              <input
                type="number"
                value={currentPortal.authSettings?.sessionTimeoutSeconds || 3600}
                onChange={(e) => handleUpdatePortal({ authSettings: { ...currentPortal.authSettings, sessionTimeoutSeconds: parseInt(e.target.value, 10) } }, "auth")}
                className="w-full px-3 py-2 border rounded-xl text-xs font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Max Concurrent Sessions</label>
              <input
                type="number"
                value={currentPortal.authSettings?.maxConcurrentSessions || 3}
                onChange={(e) => handleUpdatePortal({ authSettings: { ...currentPortal.authSettings, maxConcurrentSessions: parseInt(e.target.value, 10) } }, "auth")}
                className="w-full px-3 py-2 border rounded-xl text-xs font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Invitation Policy</label>
              <select
                value={currentPortal.authSettings?.invitationPolicy || "invite-only"}
                onChange={(e) => handleUpdatePortal({ authSettings: { ...currentPortal.authSettings, invitationPolicy: e.target.value } }, "auth")}
                className="w-full px-3 py-2 border rounded-xl text-xs font-bold"
              >
                <option value="open">Open Registration</option>
                <option value="invite-only">Invitation Only</option>
                <option value="admin-approval">Requires Admin Approval</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* MODULE 3: PORTAL FEATURE FLAGS */}
      {activeTab === "features" && currentPortal && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
          <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">Module 3: Granular Feature Flags for {currentPortal.name}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.keys(currentPortal.featureFlags || {}).map((flag) => {
              const enabled = currentPortal.featureFlags[flag];
              return (
                <div key={flag} className="p-3.5 rounded-xl bg-slate-50 border border-gray-100 flex items-center justify-between">
                  <span className="text-xs font-bold capitalize text-gray-800">{flag.replace(/([A-Z])/g, " $1")}</span>
                  <button
                    onClick={() =>
                      handleUpdatePortal(
                        { featureFlags: { ...currentPortal.featureFlags, [flag]: !enabled } },
                        "feature-flags"
                      )
                    }
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${enabled ? "bg-indigo-600 justify-end" : "bg-gray-300 justify-start"}`}
                  >
                    <span className="w-4 h-4 rounded-full bg-white shadow-md" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODULE 4: NOTIFICATION GOVERNANCE */}
      {activeTab === "notifications" && currentPortal && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
          <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">Module 4: Multi-Channel Notification Governance</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { key: "emailEnabled", label: "Email Notifications" },
              { key: "smsEnabled", label: "SMS Alerts" },
              { key: "pushEnabled", label: "Push Notifications (FCM / APNS)" },
              { key: "inAppEnabled", label: "In-App Bell Alerts" },
              { key: "whatsappEnabled", label: "WhatsApp Messaging (Future)" },
            ].map((item) => {
              const val = currentPortal.notificationSettings?.[item.key];
              return (
                <div key={item.key} className="p-3.5 rounded-xl bg-slate-50 border border-gray-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-800">{item.label}</span>
                  <button
                    onClick={() =>
                      handleUpdatePortal(
                        { notificationSettings: { ...currentPortal.notificationSettings, [item.key]: !val } },
                        "notifications"
                      )
                    }
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${val ? "bg-indigo-600 justify-end" : "bg-gray-300 justify-start"}`}
                  >
                    <span className="w-4 h-4 rounded-full bg-white shadow-md" />
                  </button>
                </div>
              );
            })}
          </div>
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Quiet Hours Start</label>
              <input
                type="text"
                value={currentPortal.notificationSettings?.quietHoursStart || "22:00"}
                onChange={(e) =>
                  handleUpdatePortal(
                    { notificationSettings: { ...currentPortal.notificationSettings, quietHoursStart: e.target.value } },
                    "notifications"
                  )
                }
                className="w-full px-3 py-2 border rounded-xl text-xs font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Quiet Hours End</label>
              <input
                type="text"
                value={currentPortal.notificationSettings?.quietHoursEnd || "07:00"}
                onChange={(e) =>
                  handleUpdatePortal(
                    { notificationSettings: { ...currentPortal.notificationSettings, quietHoursEnd: e.target.value } },
                    "notifications"
                  )
                }
                className="w-full px-3 py-2 border rounded-xl text-xs font-bold"
              />
            </div>
          </div>
        </div>
      )}

      {/* MODULE 5: BRANDING */}
      {activeTab === "branding" && currentPortal && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
          <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">Module 5: Branding & Visual Customization</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Portal Display Name</label>
              <input
                type="text"
                value={currentPortal.branding?.portalName || ""}
                onChange={(e) =>
                  handleUpdatePortal({ branding: { ...currentPortal.branding, portalName: e.target.value } }, "branding")
                }
                className="w-full px-3 py-2 border rounded-xl text-xs font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Primary Color (HEX)</label>
              <input
                type="color"
                value={currentPortal.branding?.primaryColor || "#4f46e5"}
                onChange={(e) =>
                  handleUpdatePortal({ branding: { ...currentPortal.branding, primaryColor: e.target.value } }, "branding")
                }
                className="w-full h-9 p-1 border rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Support Email</label>
              <input
                type="email"
                value={currentPortal.branding?.supportEmail || ""}
                onChange={(e) =>
                  handleUpdatePortal({ branding: { ...currentPortal.branding, supportEmail: e.target.value } }, "branding")
                }
                className="w-full px-3 py-2 border rounded-xl text-xs font-bold"
              />
            </div>
          </div>
        </div>
      )}

      {/* MODULE 6: CONSENT */}
      {activeTab === "consent" && currentPortal && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
          <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">Module 6: Legal Policies & Consent Versioning</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Consent Policy Version</label>
              <input
                type="text"
                value={currentPortal.consentSettings?.consentVersion || "2026.1"}
                onChange={(e) =>
                  handleUpdatePortal({ consentSettings: { ...currentPortal.consentSettings, consentVersion: e.target.value } }, "consent")
                }
                className="w-full px-3 py-2 border rounded-xl text-xs font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Privacy Policy URL</label>
              <input
                type="text"
                value={currentPortal.consentSettings?.privacyPolicyUrl || "/privacy"}
                onChange={(e) =>
                  handleUpdatePortal({ consentSettings: { ...currentPortal.consentSettings, privacyPolicyUrl: e.target.value } }, "consent")
                }
                className="w-full px-3 py-2 border rounded-xl text-xs font-medium"
              />
            </div>
          </div>
        </div>
      )}

      {/* MODULE 7: MOBILE APPS */}
      {activeTab === "mobile" && currentPortal && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
          <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">Module 7: Flutter Mobile App Governance</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">App Bundle ID</label>
              <input
                type="text"
                value={currentPortal.mobileConfig?.bundleId || "com.lmsca.app"}
                onChange={(e) =>
                  handleUpdatePortal({ mobileConfig: { ...currentPortal.mobileConfig, bundleId: e.target.value } }, "mobile")
                }
                className="w-full px-3 py-2 border rounded-xl text-xs font-mono font-bold"
              />
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-gray-100 flex items-center justify-between">
              <span className="text-xs font-bold text-gray-800">Deep Linking Enabled</span>
              <button
                onClick={() =>
                  handleUpdatePortal(
                    { mobileConfig: { ...currentPortal.mobileConfig, deepLinkingEnabled: !currentPortal.mobileConfig?.deepLinkingEnabled } },
                    "mobile"
                  )
                }
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${currentPortal.mobileConfig?.deepLinkingEnabled ? "bg-indigo-600 justify-end" : "bg-gray-300 justify-start"}`}
              >
                <span className="w-4 h-4 rounded-full bg-white shadow-md" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODULE 8: SECURITY */}
      {activeTab === "security" && currentPortal && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
          <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">Module 8: Security, Rate Limits & Token Lifetimes</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Rate Limit (Req / Min)</label>
              <input
                type="number"
                value={currentPortal.security?.rateLimitRequestsPerMin || 120}
                onChange={(e) =>
                  handleUpdatePortal({ security: { ...currentPortal.security, rateLimitRequestsPerMin: parseInt(e.target.value, 10) } }, "security")
                }
                className="w-full px-3 py-2 border rounded-xl text-xs font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">JWT Access Lifetime (Minutes)</label>
              <input
                type="number"
                value={currentPortal.security?.jwtLifetimeMinutes || 15}
                onChange={(e) =>
                  handleUpdatePortal({ security: { ...currentPortal.security, jwtLifetimeMinutes: parseInt(e.target.value, 10) } }, "security")
                }
                className="w-full px-3 py-2 border rounded-xl text-xs font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Refresh Lifetime (Days)</label>
              <input
                type="number"
                value={currentPortal.security?.refreshLifetimeDays || 7}
                onChange={(e) =>
                  handleUpdatePortal({ security: { ...currentPortal.security, refreshLifetimeDays: parseInt(e.target.value, 10) } }, "security")
                }
                className="w-full px-3 py-2 border rounded-xl text-xs font-bold"
              />
            </div>
          </div>
        </div>
      )}

      {/* MODULE 9: AUDIT LOGS */}
      {activeTab === "audit" && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">Module 9: Governance Change Audit Log Trail</h2>
            <button onClick={fetchAuditLogs} className="text-xs font-bold text-indigo-600 hover:text-indigo-900">
              🔄 Refresh Logs
            </button>
          </div>
          {auditLogs.length === 0 ? (
            <div className="p-8 text-center text-xs font-semibold text-gray-400">No governance modifications logged for this portal yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-gray-100 bg-slate-50 text-gray-400 font-extrabold uppercase">
                    <th className="p-3">Timestamp</th>
                    <th className="p-3">Administrator</th>
                    <th className="p-3">Module</th>
                    <th className="p-3">Field Name</th>
                    <th className="p-3">Old Value</th>
                    <th className="p-3">New Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {auditLogs.map((log) => (
                    <tr key={log._id} className="hover:bg-slate-50/75">
                      <td className="p-3 font-mono text-gray-500">{new Date(log.createdAt).toLocaleString()}</td>
                      <td className="p-3 font-bold text-gray-900">{log.adminEmail}</td>
                      <td className="p-3 font-bold text-indigo-600 uppercase">{log.module}</td>
                      <td className="p-3 font-mono text-gray-700">{log.fieldName}</td>
                      <td className="p-3 text-red-600 font-mono line-through">{JSON.stringify(log.oldValue)}</td>
                      <td className="p-3 text-emerald-600 font-mono font-bold">{JSON.stringify(log.newValue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
