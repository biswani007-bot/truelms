"use client";

import React, { useState } from "react";
import { Settings, CheckCircle, Activity, Key } from "lucide-react";
import { useToast } from "@/components/ui/dialogs/ToastProvider";

export default function IntegrationsDashboard() {
  const toast = useToast();
  const [smtpStatus, setSmtpStatus] = useState("Connected");
  const [smsStatus, setSmsStatus] = useState("Connected");
  const [webhookUrl, setWebhookUrl] = useState("https://lmsca-webhook.edu/endpoints");

  const handleTestConnection = (service: string) => {
    toast.success("Connection Successful", `${service} integration test connection succeeded.`);
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="lms-page-title">Third-Party Integrations</h1>
          <p className="lms-caption mt-1">Configure institutional communication adapters, Webhook endpoints, and API Keys.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* SMTP */}
        <div className="bg-white border rounded-xl p-6 shadow-sm flex flex-col justify-between h-52">
          <div>
            <div className="flex justify-between items-start">
              <span className="font-bold text-gray-900 text-sm">SMTP Mail Gateway</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                {smtpStatus}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-2">Manage mail dispatches for student receipts, admissions updates, and password resets.</p>
          </div>
          <button 
            onClick={() => handleTestConnection("SMTP")}
            className="w-full py-2 bg-indigo-650 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition"
          >
            Test Connection
          </button>
        </div>

        {/* SMS Provider */}
        <div className="bg-white border rounded-xl p-6 shadow-sm flex flex-col justify-between h-52">
          <div>
            <div className="flex justify-between items-start">
              <span className="font-bold text-gray-900 text-sm">SMS Gateway (Twilio)</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                {smsStatus}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-2">Send automated SMS reminders for overdue installments and exam schedules.</p>
          </div>
          <button 
            onClick={() => handleTestConnection("Twilio SMS")}
            className="w-full py-2 border bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-lg transition"
          >
            Test Connection
          </button>
        </div>

        {/* Webhooks */}
        <div className="bg-white border rounded-xl p-6 shadow-sm flex flex-col justify-between h-52">
          <div>
            <span className="font-bold text-gray-900 text-sm">Outgoing Webhooks</span>
            <input 
              type="text" 
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              className="w-full mt-2 border px-2 py-1 rounded text-xs focus:outline-none" 
            />
            <p className="text-[10px] text-gray-400 mt-2">Dispatches real-time student activity JSON alerts to third-party endpoints.</p>
          </div>
          <button 
            onClick={() => handleTestConnection("Webhook Receiver")}
            className="w-full py-2 border bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-lg transition"
          >
            Test Connection
          </button>
        </div>
      </div>
    </div>
  );
}
