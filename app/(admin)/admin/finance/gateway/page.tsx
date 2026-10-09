"use client";

import React, { useState } from "react";
import { WorkspaceHeader } from "@/components/workspace/WorkspaceHeader";
import { 
  CreditCard, ShieldCheck, Activity, Key, Globe, Eye, EyeOff, 
  CheckCircle2, RefreshCw, Zap, Server, AlertCircle 
} from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EnterpriseDialog } from "@/components/ui/dialogs/EnterpriseDialog";
import { useToast } from "@/components/ui/dialogs/ToastProvider";

export default function PaymentGatewaySettings() {
  const toast = useToast();

  // Gateway Active States
  const [stripeConnected, setStripeConnected] = useState(true);
  const [offlineEnabled, setOfflineEnabled] = useState(true);

  // Config States
  const [envMode, setEnvMode] = useState<"test" | "live">("test");
  const [publishableKey, setPublishableKey] = useState("pk_test_51MzLMSCA89201948210398");
  const [secretKey, setSecretKey] = useState("sk_test_51MzLMSCA99401827401928");
  const [webhookSecret, setWebhookSecret] = useState("whsec_51MzLMSCA88192039182");
  const [showSecret, setShowSecret] = useState(false);
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);
  const [defaultCurrency, setDefaultCurrency] = useState("USD");
  const [savingConfig, setSavingConfig] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);

  // Disconnect Modal
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [disconnectLoading, setDisconnectLoading] = useState(false);

  const handleTestConnection = async () => {
    setTestingConnection(true);
    await new Promise((res) => setTimeout(res, 800));
    setTestingConnection(false);
    toast.success("Stripe Connection Verified", "Successfully authenticated with Stripe API in test mode.");
  };

  const handleSaveConfig = async () => {
    setSavingConfig(true);
    await new Promise((res) => setTimeout(res, 600));
    setSavingConfig(false);
    toast.success("Gateway Configuration Saved", "Stripe API keys and webhook settings updated successfully.");
  };

  const handleDisconnectConfirm = async () => {
    setDisconnectLoading(true);
    await new Promise((res) => setTimeout(res, 600));
    setStripeConnected(false);
    setDisconnectLoading(false);
    setShowDisconnectModal(false);
    toast.warning("Gateway Disconnected", "Stripe primary gateway has been disabled.");
  };

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto">
      {/* Workspace Header */}
      <WorkspaceHeader
        entityName="Payment Gateway Workspace"
        description="Manage institutional payment processors, API credentials, Webhook security, and health telemetry."
        moduleIcon={<CreditCard className="size-5" />}
        breadcrumb={[
          { label: "Admin", href: "/admin" },
          { label: "Finance", href: "/admin/finance" },
          { label: "Gateway" },
        ]}
        status={stripeConnected ? "active" : "inactive"}
        primaryAction={
          <button
            onClick={handleSaveConfig}
            disabled={savingConfig}
            className="lms-btn lms-btn-primary"
          >
            {savingConfig ? "Saving..." : "Save Configuration"}
          </button>
        }
        secondaryActions={
          <button
            onClick={handleTestConnection}
            disabled={testingConnection}
            className="lms-btn lms-btn-secondary"
          >
            <RefreshCw className={`size-4 ${testingConnection ? "animate-spin" : ""}`} />
            Test Connection
          </button>
        }
      />

      {/* Gateway Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Stripe */}
        <div className="lms-card p-6 flex flex-col justify-between border-l-4 border-l-indigo-600">
          <div>
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 lms-card-title">Stripe Payments</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase">Primary</span>
              </div>
              <StatusBadge status={stripeConnected ? "active" : "inactive"} showDot />
            </div>
            <p className="lms-caption text-slate-500 mb-4">
              Accept global credit cards, debit cards, Apple Pay, Google Pay, and SEPA transfers.
            </p>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="lms-badge-text bg-slate-100 text-slate-600 px-2 py-0.5 rounded">Visa</span>
              <span className="lms-badge-text bg-slate-100 text-slate-600 px-2 py-0.5 rounded">MasterCard</span>
              <span className="lms-badge-text bg-slate-100 text-slate-600 px-2 py-0.5 rounded">Amex</span>
              <span className="lms-badge-text bg-slate-100 text-slate-600 px-2 py-0.5 rounded">Apple Pay</span>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="lms-code text-xs text-slate-400">Mode: {envMode.toUpperCase()}</span>
            {stripeConnected ? (
              <button
                onClick={() => setShowDisconnectModal(true)}
                className="lms-button-text text-xs text-red-600 hover:text-red-700"
              >
                Disable
              </button>
            ) : (
              <button
                onClick={() => {
                  setStripeConnected(true);
                  toast.success("Gateway Enabled", "Stripe gateway activated.");
                }}
                className="lms-button-text text-xs text-indigo-600 hover:text-indigo-700"
              >
                Connect Stripe
              </button>
            )}
          </div>
        </div>

        {/* Offline Payments */}
        <div className="lms-card p-6 flex flex-col justify-between border-l-4 border-l-emerald-500">
          <div>
            <div className="flex justify-between items-start mb-3">
              <span className="font-bold text-slate-900 lms-card-title">Offline & Bank Wire</span>
              <StatusBadge status={offlineEnabled ? "active" : "inactive"} showDot />
            </div>
            <p className="lms-caption text-slate-500 mb-4">
              Direct wire transfers, manual receipts, bank drafts, and physical cash collection ledger.
            </p>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="lms-badge-text bg-slate-100 text-slate-600 px-2 py-0.5 rounded">Bank Transfer</span>
              <span className="lms-badge-text bg-slate-100 text-slate-600 px-2 py-0.5 rounded">Cash Ledger</span>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="lms-code text-xs text-slate-400">Internal Vault</span>
            <button
              onClick={() => {
                setOfflineEnabled(!offlineEnabled);
                toast.success("Setting Updated", `Offline collections ${!offlineEnabled ? "enabled" : "disabled"}.`);
              }}
              className="lms-button-text text-xs text-indigo-600 hover:text-indigo-700"
            >
              {offlineEnabled ? "Configure" : "Enable"}
            </button>
          </div>
        </div>

        {/* PayPal */}
        <div className="lms-card p-6 flex flex-col justify-between opacity-75 border-l-4 border-l-slate-300">
          <div>
            <div className="flex justify-between items-start mb-3">
              <span className="font-bold text-slate-900 lms-card-title">PayPal Checkout</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500 uppercase">Coming Soon</span>
            </div>
            <p className="lms-caption text-slate-500 mb-4">
              Express billing checkouts, PayPal Pay-Later, and institutional buyer accounts.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100">
            <button disabled className="lms-button-text text-xs text-slate-400 cursor-not-allowed">
              Integration Ready
            </button>
          </div>
        </div>

        {/* Razorpay */}
        <div className="lms-card p-6 flex flex-col justify-between opacity-75 border-l-4 border-l-slate-300">
          <div>
            <div className="flex justify-between items-start mb-3">
              <span className="font-bold text-slate-900 lms-card-title">Razorpay</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500 uppercase">Coming Soon</span>
            </div>
            <p className="lms-caption text-slate-500 mb-4">
              UPI collections, net banking, and major Indian credit/debit card issuers.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100">
            <button disabled className="lms-button-text text-xs text-slate-400 cursor-not-allowed">
              Integration Ready
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Configuration Panel */}
        <div className="lg:col-span-2 lms-card p-6 space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <h3 className="lms-card-title flex items-center gap-2">
              <Key className="size-4 text-indigo-600" />
              Stripe API & Webhook Configuration
            </h3>
            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setEnvMode("test")}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${envMode === "test" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-500"}`}
              >
                Test Mode
              </button>
              <button
                onClick={() => setEnvMode("live")}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${envMode === "live" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-500"}`}
              >
                Live Production
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {/* Publishable Key */}
            <div>
              <label className="lms-label block mb-1.5" htmlFor="pub-key">
                Publishable Key ({envMode.toUpperCase()})
              </label>
              <input
                id="pub-key"
                type="text"
                value={publishableKey}
                onChange={(e) => setPublishableKey(e.target.value)}
                className="lms-input lms-code"
              />
            </div>

            {/* Secret Key */}
            <div>
              <label className="lms-label block mb-1.5" htmlFor="sec-key">
                Secret Key ({envMode.toUpperCase()})
              </label>
              <div className="relative">
                <input
                  id="sec-key"
                  type={showSecret ? "text" : "password"}
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                  className="lms-input lms-code pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showSecret ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {/* Webhook Secret */}
            <div>
              <label className="lms-label block mb-1.5" htmlFor="wh-sec">
                Webhook Signing Secret
              </label>
              <div className="relative">
                <input
                  id="wh-sec"
                  type={showWebhookSecret ? "text" : "password"}
                  value={webhookSecret}
                  onChange={(e) => setWebhookSecret(e.target.value)}
                  className="lms-input lms-code pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowWebhookSecret(!showWebhookSecret)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showWebhookSecret ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {/* Webhook Endpoint */}
            <div>
              <label className="lms-label block mb-1.5">
                Webhook Receiver Endpoint (Read Only)
              </label>
              <input
                type="text"
                readOnly
                value="https://lmsca-app.com/api/gateway/stripe/webhook"
                className="lms-input lms-code bg-slate-50 text-slate-500 cursor-not-allowed"
              />
            </div>

            {/* Currency Select */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <label className="lms-label block mb-1.5">Default Currency</label>
                <select
                  value={defaultCurrency}
                  onChange={(e) => setDefaultCurrency(e.target.value)}
                  className="lms-input"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="INR">INR (₹)</option>
                </select>
              </div>
              <div>
                <label className="lms-label block mb-1.5">Settlement Cycle</label>
                <input
                  type="text"
                  readOnly
                  value="T+2 Rolling Settlement"
                  className="lms-input bg-slate-50 text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Gateway Telemetry & Health Panel */}
        <div className="lms-card p-6 space-y-6">
          <h3 className="lms-card-title flex items-center gap-2 border-b border-slate-100 pb-4">
            <Activity className="size-4 text-emerald-600" />
            Gateway Health & Telemetry
          </h3>

          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 rounded-xl bg-emerald-50/50 border border-emerald-100">
              <span className="lms-body-sm font-semibold text-emerald-900 flex items-center gap-2">
                <CheckCircle2 className="size-4 text-emerald-600" /> API Connection
              </span>
              <span className="lms-code text-xs text-emerald-700 font-bold">200 OK</span>
            </div>

            <div className="flex justify-between items-center p-3 rounded-xl bg-emerald-50/50 border border-emerald-100">
              <span className="lms-body-sm font-semibold text-emerald-900 flex items-center gap-2">
                <CheckCircle2 className="size-4 text-emerald-600" /> Webhook Listener
              </span>
              <span className="lms-code text-xs text-emerald-700 font-bold">Listening</span>
            </div>

            <div className="space-y-2 pt-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Stripe API Version</span>
                <span className="lms-code text-slate-900 font-bold">2024-06-20</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Last Successful Sync</span>
                <span className="lms-caption text-slate-900">Just now</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Last Payment Logged</span>
                <span className="lms-caption text-slate-900">2 mins ago</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Recent Webhook Errors</span>
                <span className="lms-code text-emerald-600 font-bold">0 Errors</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <button
              onClick={handleTestConnection}
              className="w-full lms-btn lms-btn-secondary py-2 text-xs"
            >
              Run Diagnostic Health Check
            </button>
          </div>
        </div>
      </div>

      {/* Disconnect Gateway Modal */}
      <EnterpriseDialog
        isOpen={showDisconnectModal}
        onClose={() => { if (!disconnectLoading) setShowDisconnectModal(false); }}
        title="Disable Stripe Gateway"
        subtitle="Gateway Overrides"
        description="Are you sure you want to disable the Stripe payment gateway? Students will be unable to pay tuition or course fees online via credit card or digital wallets."
        variant="danger"
        confirmLabel="Disable Gateway"
        cancelLabel="Cancel"
        onConfirm={handleDisconnectConfirm}
        loading={disconnectLoading}
      />
    </div>
  );
}
