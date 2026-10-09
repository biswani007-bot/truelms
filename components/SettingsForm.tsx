"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";

interface SettingsFormProps {
  initialSettings: any;
}

export default function SettingsForm({ initialSettings }: SettingsFormProps) {
  const [settings, setSettings] = useState(initialSettings);
  const [activeTab, setActiveTab] = useState("platform");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const tabs = [
    { id: "platform", label: "Platform Settings" },
    { id: "branding", label: "Branding" },
    { id: "security", label: "Security Center" },
    { id: "integrations", label: "Integrations" },
    { id: "config", label: "System Config" },
    { id: "finance", label: "Payment & Finance" },
  ];

  const handleNestedChange = (category: string, field: string, val: any) => {
    setSettings((prev: any) => ({
      ...prev,
      [category]: { ...prev[category], [field]: val },
    }));
  };

  const handleDeepNestedChange = (category: string, subcategory: string, field: string, val: any) => {
    setSettings((prev: any) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [subcategory]: { ...prev[category][subcategory], [field]: val },
      },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.message || "Failed to save settings");
      }

      setSettings(data.data);
      setMessage({ type: "success", text: "Settings saved successfully!" });
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "An error occurred" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      {/* Toast Notification */}
      {message && (
        <div
          className={`p-4 rounded-xl border text-sm font-semibold transition-all ${
            message.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
              : "bg-rose-50 border-rose-200 text-rose-700"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-200 gap-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-3 text-sm font-semibold transition-all border-b-2 ${
              activeTab === tab.id
                ? "border-indigo-600 text-indigo-700"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Form Content */}
      <div className="bg-white border border-gray-200 p-8 rounded-2xl shadow-sm">
        
        {/* PLATFORM SETTINGS */}
        {activeTab === "platform" && (
          <div className="space-y-8">
            <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">General Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Institution Name</label>
                <input
                  type="text"
                  value={settings.org.orgName || ""}
                  onChange={(e) => handleNestedChange("org", "orgName", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-gray-900 text-sm outline-none transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Legal Name</label>
                <input
                  type="text"
                  value={settings.org.legalName || ""}
                  onChange={(e) => handleNestedChange("org", "legalName", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-gray-900 text-sm outline-none transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Support Email</label>
                <input
                  type="email"
                  value={settings.org.supportEmail || ""}
                  onChange={(e) => handleNestedChange("org", "supportEmail", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-gray-900 text-sm outline-none transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Support Phone</label>
                <input
                  type="text"
                  value={settings.org.supportPhone || ""}
                  onChange={(e) => handleNestedChange("org", "supportPhone", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-gray-900 text-sm outline-none transition"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Primary Address</label>
                <input
                  type="text"
                  value={settings.org.address || ""}
                  onChange={(e) => handleNestedChange("org", "address", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-gray-900 text-sm outline-none transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">City</label>
                <input
                  type="text"
                  value={settings.org.city || ""}
                  onChange={(e) => handleNestedChange("org", "city", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 text-gray-900 text-sm outline-none transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Country</label>
                <input
                  type="text"
                  value={settings.org.country || ""}
                  onChange={(e) => handleNestedChange("org", "country", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 text-gray-900 text-sm outline-none transition"
                />
              </div>
            </div>

            <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2 mt-8">Localization</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Timezone</label>
                <input
                  type="text"
                  value={settings.localization.timezone || "UTC"}
                  onChange={(e) => handleNestedChange("localization", "timezone", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 text-gray-900 text-sm outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Default Currency</label>
                <input
                  type="text"
                  value={settings.localization.currency || "USD"}
                  onChange={(e) => handleNestedChange("localization", "currency", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 text-gray-900 text-sm outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* BRANDING */}
        {activeTab === "branding" && (
          <div className="space-y-8">
            <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">Visual Identity</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Logo URL</label>
                <input
                  type="text"
                  value={settings.org.logo || ""}
                  onChange={(e) => handleNestedChange("org", "logo", e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 text-gray-900 text-sm outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Favicon URL</label>
                <input
                  type="text"
                  value={settings.org.favicon || ""}
                  onChange={(e) => handleNestedChange("org", "favicon", e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 text-gray-900 text-sm outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Primary Color (Hex)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={settings.branding.primaryColor || "#4f46e5"}
                    onChange={(e) => handleNestedChange("branding", "primaryColor", e.target.value)}
                    className="w-10 h-10 rounded border-0 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={settings.branding.primaryColor || "#4f46e5"}
                    onChange={(e) => handleNestedChange("branding", "primaryColor", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-gray-900 text-sm outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Typography Font</label>
                <input
                  type="text"
                  value={settings.branding.typography || "Inter"}
                  onChange={(e) => handleNestedChange("branding", "typography", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 text-gray-900 text-sm outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email Branding Header Text</label>
                <input
                  type="text"
                  value={settings.branding.emailBranding || ""}
                  onChange={(e) => handleNestedChange("branding", "emailBranding", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 text-gray-900 text-sm outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* SECURITY */}
        {activeTab === "security" && (
          <div className="space-y-8">
            <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">Access & Sessions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Session Timeout (Seconds)</label>
                <input
                  type="number"
                  value={settings.security.sessionTimeout || 3600}
                  onChange={(e) => handleNestedChange("security", "sessionTimeout", Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 text-gray-900 text-sm outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Max Login Attempts</label>
                <input
                  type="number"
                  value={settings.security.loginAttempts || 5}
                  onChange={(e) => handleNestedChange("security", "loginAttempts", Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 text-gray-900 text-sm outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Account Lock Duration (Minutes)</label>
                <input
                  type="number"
                  value={settings.security.accountLockDuration || 15}
                  onChange={(e) => handleNestedChange("security", "accountLockDuration", Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 text-gray-900 text-sm outline-none"
                />
              </div>
            </div>
            
            <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2 mt-8">Password Policy</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Minimum Length</label>
                <input
                  type="number"
                  value={settings.security.passwordPolicy.minLength || 8}
                  onChange={(e) => handleDeepNestedChange("security", "passwordPolicy", "minLength", Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 text-gray-900 text-sm outline-none"
                />
              </div>
              <div className="flex items-center gap-3 mt-5">
                <input
                  type="checkbox"
                  checked={settings.security.passwordPolicy.requireUppercase || false}
                  onChange={(e) => handleDeepNestedChange("security", "passwordPolicy", "requireUppercase", e.target.checked)}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <label className="text-sm font-semibold text-gray-700">Require Uppercase</label>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={settings.security.passwordPolicy.requireSpecialChar || false}
                  onChange={(e) => handleDeepNestedChange("security", "passwordPolicy", "requireSpecialChar", e.target.checked)}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <label className="text-sm font-semibold text-gray-700">Require Special Character</label>
              </div>
            </div>
          </div>
        )}

        {/* INTEGRATIONS */}
        {activeTab === "integrations" && (
          <div className="space-y-8">
            <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">SMTP Mail Provider</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">SMTP Host</label>
                <input
                  type="text"
                  value={settings.email.smtpHost || ""}
                  onChange={(e) => handleNestedChange("email", "smtpHost", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 text-gray-900 text-sm outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">SMTP Port</label>
                <input
                  type="number"
                  value={settings.email.smtpPort || 587}
                  onChange={(e) => handleNestedChange("email", "smtpPort", Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 text-gray-900 text-sm outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">SMTP Username</label>
                <input
                  type="text"
                  value={settings.email.smtpUser || ""}
                  onChange={(e) => handleNestedChange("email", "smtpUser", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 text-gray-900 text-sm outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">SMTP Password</label>
                <input
                  type="password"
                  value={settings.email.smtpPass || ""}
                  onChange={(e) => handleNestedChange("email", "smtpPass", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 text-gray-900 text-sm outline-none"
                />
              </div>
            </div>
            
            <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2 mt-8">Cloud Storage (S3 / R2)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Bucket Name</label>
                <input
                  type="text"
                  value={settings.storage.r2Bucket || ""}
                  onChange={(e) => handleNestedChange("storage", "r2Bucket", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 text-gray-900 text-sm outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Account ID</label>
                <input
                  type="text"
                  value={settings.storage.r2AccountId || ""}
                  onChange={(e) => handleNestedChange("storage", "r2AccountId", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 text-gray-900 text-sm outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Access Key ID</label>
                <input
                  type="text"
                  value={settings.storage.r2AccessKeyId || ""}
                  onChange={(e) => handleNestedChange("storage", "r2AccessKeyId", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 text-gray-900 text-sm outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Secret Access Key</label>
                <input
                  type="password"
                  value={settings.storage.r2SecretAccessKey || ""}
                  onChange={(e) => handleNestedChange("storage", "r2SecretAccessKey", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 text-gray-900 text-sm outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* SYSTEM CONFIG */}
        {activeTab === "config" && (
          <div className="space-y-8">
            <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">Academic & Batch Rules</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Passing Percentage</label>
                <input
                  type="number"
                  value={settings.academic.passingPercentage || 80}
                  onChange={(e) => handleNestedChange("academic", "passingPercentage", Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 text-gray-900 text-sm outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Required Attendance %</label>
                <input
                  type="number"
                  value={settings.academic.attendanceRequirement || 75}
                  onChange={(e) => handleNestedChange("academic", "attendanceRequirement", Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 text-gray-900 text-sm outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Default Batch Capacity</label>
                <input
                  type="number"
                  value={settings.batch.defaultCapacity || 50}
                  onChange={(e) => handleNestedChange("batch", "defaultCapacity", Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 text-gray-900 text-sm outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Max Batch Capacity</label>
                <input
                  type="number"
                  value={settings.batch.maxCapacity || 100}
                  onChange={(e) => handleNestedChange("batch", "maxCapacity", Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 text-gray-900 text-sm outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* PAYMENT & FINANCE */}
        {activeTab === "finance" && (
          <div className="space-y-8">
            <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">General Payment Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Currency</label>
                <input
                  type="text"
                  value={settings.payment?.currency || "USD"}
                  onChange={(e) => handleNestedChange("payment", "currency", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 text-gray-900 text-sm outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Environment Mode</label>
                <select
                  value={settings.payment?.mode || "test"}
                  onChange={(e) => handleNestedChange("payment", "mode", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 text-gray-900 text-sm outline-none"
                >
                  <option value="test">Test Mode</option>
                  <option value="live">Live Mode</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Default Tax %</label>
                <input
                  type="number"
                  value={settings.payment?.taxPercentage || 0}
                  onChange={(e) => handleNestedChange("payment", "taxPercentage", Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 text-gray-900 text-sm outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Payment Terms</label>
                <input
                  type="text"
                  value={settings.payment?.paymentTerms || ""}
                  onChange={(e) => handleNestedChange("payment", "paymentTerms", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 text-gray-900 text-sm outline-none"
                />
              </div>
            </div>

            <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2 mt-8">Invoices & Receipts</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Invoice Prefix</label>
                <input
                  type="text"
                  value={settings.payment?.invoicePrefix || "INV-"}
                  onChange={(e) => handleNestedChange("payment", "invoicePrefix", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 text-gray-900 text-sm outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Receipt Prefix</label>
                <input
                  type="text"
                  value={settings.payment?.receiptPrefix || "REC-"}
                  onChange={(e) => handleNestedChange("payment", "receiptPrefix", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 text-gray-900 text-sm outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Refund Policy Text</label>
                <textarea
                  value={settings.payment?.refundPolicyText || ""}
                  onChange={(e) => handleNestedChange("payment", "refundPolicyText", e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 text-gray-900 text-sm outline-none"
                />
              </div>
            </div>

            <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2 mt-8">Payment Methods</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {["cash", "bank-transfer", "upi", "credit-card", "debit-card", "cheque", "online-gateway", "wallet", "custom"].map((method) => (
                <div key={method} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={settings.payment?.enabledPaymentMethods?.includes(method)}
                    onChange={(e) => {
                      const current = settings.payment?.enabledPaymentMethods || [];
                      const updated = e.target.checked
                        ? [...current, method]
                        : current.filter((m: string) => m !== method);
                      handleNestedChange("payment", "enabledPaymentMethods", updated);
                    }}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <label className="text-sm text-gray-700 capitalize">{method.replace("-", " ")}</label>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between border-b border-gray-100 pb-2 mt-8">
              <h3 className="text-lg font-bold text-gray-900">Payment Gateways</h3>
              <button
                onClick={() => {
                  const current = settings.payment?.gateways || [];
                  handleNestedChange("payment", "gateways", [
                    ...current,
                    { provider: "stripe", enabled: false, mode: "test", publicKey: "", secretKey: "" }
                  ]);
                }}
                className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-1 px-3 rounded transition"
              >
                + Add Gateway
              </button>
            </div>
            <div className="space-y-6">
              {(settings.payment?.gateways || []).map((gateway: any, index: number) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-bold text-sm text-gray-800">Gateway #{index + 1}</h4>
                    <button
                      onClick={() => {
                        const current = [...(settings.payment?.gateways || [])];
                        current.splice(index, 1);
                        handleNestedChange("payment", "gateways", current);
                      }}
                      className="text-xs text-rose-600 font-bold hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Provider</label>
                      <input
                        type="text"
                        value={gateway.provider}
                        onChange={(e) => {
                          const current = [...(settings.payment?.gateways || [])];
                          current[index] = { ...gateway, provider: e.target.value };
                          handleNestedChange("payment", "gateways", current);
                        }}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 text-gray-900 text-sm outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Mode</label>
                      <select
                        value={gateway.mode}
                        onChange={(e) => {
                          const current = [...(settings.payment?.gateways || [])];
                          current[index] = { ...gateway, mode: e.target.value };
                          handleNestedChange("payment", "gateways", current);
                        }}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 text-gray-900 text-sm outline-none"
                      >
                        <option value="test">Test</option>
                        <option value="live">Live</option>
                      </select>
                    </div>
                    <div className="md:col-span-2 flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={gateway.enabled}
                        onChange={(e) => {
                          const current = [...(settings.payment?.gateways || [])];
                          current[index] = { ...gateway, enabled: e.target.checked };
                          handleNestedChange("payment", "gateways", current);
                        }}
                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      />
                      <label className="text-sm font-semibold text-gray-700">Gateway Enabled</label>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Public Key</label>
                      <input
                        type="text"
                        value={gateway.publicKey || ""}
                        onChange={(e) => {
                          const current = [...(settings.payment?.gateways || [])];
                          current[index] = { ...gateway, publicKey: e.target.value };
                          handleNestedChange("payment", "gateways", current);
                        }}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 text-gray-900 text-sm outline-none"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Secret Key</label>
                      <input
                        type="password"
                        placeholder={gateway.secretKey === "********" ? "******** (Unchanged)" : "Enter secret key..."}
                        value={gateway.secretKey === "********" ? "" : (gateway.secretKey || "")}
                        onChange={(e) => {
                          const current = [...(settings.payment?.gateways || [])];
                          current[index] = { ...gateway, secretKey: e.target.value };
                          handleNestedChange("payment", "gateways", current);
                        }}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 text-gray-900 text-sm outline-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
              {(!settings.payment?.gateways || settings.payment.gateways.length === 0) && (
                <div className="text-sm text-gray-500 italic py-4">No gateways configured.</div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Action Bar */}
      <div className="flex justify-end pt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-lg transition shadow-sm"
        >
          {saving ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              Saving...
            </span>
          ) : "Save Configuration"}
        </button>
      </div>
    </div>
  );
}
