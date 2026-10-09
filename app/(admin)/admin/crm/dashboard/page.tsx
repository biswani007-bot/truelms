"use client";

import React, { useEffect, useState } from "react";
import { 
  TrendingUp, Users, DollarSign, CheckSquare,
  Clock, Award, PieChart, ArrowRight, Activity 
} from "lucide-react";
import Link from "next/link";

export default function CRMDashboard() {
  const [leads, setLeads] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/crm/leads?limit=500").then(res => res.json()),
      // We can also fetch tasks, but if the endpoint is not fully ready we fall back safely
      fetch("/api/crm/leads").then(res => res.json()).catch(() => ({ data: [] }))
    ]).then(([leadsData]) => {
      if (leadsData.success) {
        setLeads(leadsData.data);
      }
      setLoading(false);
    });
  }, []);

  const totalLeads = leads.length;
  const qualifiedCount = leads.filter(l => l.status === "qualified" || l.status === "approved").length;
  const enrolledCount = leads.filter(l => l.status === "enrolled").length;
  const conversionRate = totalLeads > 0 ? ((enrolledCount / totalLeads) * 100).toFixed(1) : "0.0";
  const revenueForecast = enrolledCount * 2500; // Mock: $2,500 course fee average

  // Counselor Leaderboard calculation
  const counselors: Record<string, { name: string, enrolled: number, total: number }> = {};
  leads.forEach(l => {
    const ownerName = l.leadOwner?.name || "Unassigned";
    if (!counselors[ownerName]) {
      counselors[ownerName] = { name: ownerName, enrolled: 0, total: 0 };
    }
    counselors[ownerName].total += 1;
    if (l.status === "enrolled") {
      counselors[ownerName].enrolled += 1;
    }
  });

  // Multi-Touch Marketing Attribution
  const channelAttribution: Record<string, { channel: string, total: number, enrolled: number }> = {};
  const campaignAttribution: Record<string, { campaign: string, total: number, enrolled: number }> = {};

  leads.forEach(l => {
    const channel = l.leadSource || l.utmSource || "direct";
    if (!channelAttribution[channel]) {
      channelAttribution[channel] = { channel, total: 0, enrolled: 0 };
    }
    channelAttribution[channel].total += 1;
    if (l.status === "enrolled") {
      channelAttribution[channel].enrolled += 1;
    }

    const campaign = l.campaign || l.utmCampaign || "organic";
    if (!campaignAttribution[campaign]) {
      campaignAttribution[campaign] = { campaign, total: 0, enrolled: 0 };
    }
    campaignAttribution[campaign].total += 1;
    if (l.status === "enrolled") {
      campaignAttribution[campaign].enrolled += 1;
    }
  });

  // Funnel Stage count breakdown
  const stages = [
    { label: "New", status: "new" },
    { label: "Contacted", status: "contacted" },
    { label: "Qualified", status: "qualified" },
    { label: "Counselling", status: "followup" },
    { label: "Offer Out", status: "admission_offered" },
    { label: "Enrolled", status: "enrolled" }
  ];

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">CRM Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Real-time enrollment funnels, performance metrics and revenue targets.</p>
      </div>

      {loading ? (
        <div className="py-12 text-center text-gray-400">Loading admissions metrics...</div>
      ) : (
        <>
          {/* Card stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-gray-500 uppercase">Total Enquiries</span>
                <div className="text-2xl font-black text-gray-900 mt-1">{totalLeads}</div>
              </div>
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><Users className="w-5 h-5" /></div>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-gray-500 uppercase">Qualified</span>
                <div className="text-2xl font-black text-gray-900 mt-1">{qualifiedCount}</div>
              </div>
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl"><CheckSquare className="w-5 h-5" /></div>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-gray-500 uppercase">Conversion Rate</span>
                <div className="text-2xl font-black text-gray-900 mt-1">{conversionRate}%</div>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><TrendingUp className="w-5 h-5" /></div>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-gray-500 uppercase">Revenue Forecast</span>
                <div className="text-2xl font-black text-gray-900 mt-1">${revenueForecast.toLocaleString()}</div>
              </div>
              <div className="p-3 bg-cyan-50 text-cyan-600 rounded-xl"><DollarSign className="w-5 h-5" /></div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Visual Funnel */}
            <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <PieChart className="text-indigo-600" />
                Admissions Funnel Conversion
              </h3>

              <div className="space-y-4">
                {stages.map((stg) => {
                  const count = leads.filter(l => l.status === stg.status).length;
                  const pct = totalLeads > 0 ? (count / totalLeads) * 100 : 0;
                  return (
                    <div key={stg.status} className="flex items-center gap-4 text-xs font-semibold">
                      <span className="w-24 text-gray-600 font-medium">{stg.label}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-3.5 overflow-hidden">
                        <div 
                          className="bg-indigo-600 h-full rounded-full transition-all duration-500" 
                          style={{ width: `${Math.max(4, pct)}%` }} 
                        />
                      </div>
                      <span className="w-12 text-right text-gray-900">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Leaderboard */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2 mb-4">
                  <Award className="text-indigo-600" />
                  Counselor Conversion Standings
                </h3>

                <div className="space-y-4">
                  {Object.values(counselors).map((c, i) => (
                    <div key={i} className="flex justify-between items-center text-xs font-semibold">
                      <span className="text-gray-700 font-medium">{c.name}</span>
                      <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded">
                        {c.enrolled} enrolled / {c.total} total
                      </span>
                    </div>
                  ))}
                  {Object.values(counselors).length === 0 && (
                    <div className="text-center text-gray-400 py-6">No assignments recorded.</div>
                  )}
                </div>
              </div>

              <Link 
                href="/admin/crm/leads" 
                className="mt-6 py-2 bg-slate-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-750 hover:bg-slate-100 flex items-center justify-center gap-1 transition"
              >
                Go to Leads Workspace
              </Link>
            </div>

          </div>

          {/* Marketing & Multi-Touch Attribution Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-2">
            {/* Channel Attribution */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <Activity className="text-indigo-600 w-4 h-4" />
                  Channel Attribution Breakdown
                </h3>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  {Object.keys(channelAttribution).length} Channels
                </span>
              </div>

              <div className="space-y-3">
                {Object.values(channelAttribution).map((ch) => {
                  const pct = totalLeads > 0 ? ((ch.total / totalLeads) * 100).toFixed(1) : "0.0";
                  const convPct = ch.total > 0 ? ((ch.enrolled / ch.total) * 100).toFixed(0) : "0";
                  return (
                    <div key={ch.channel} className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-gray-800 capitalize">
                          {ch.channel.replace(/-/g, " ")}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 font-medium">{ch.total} leads ({pct}%)</span>
                          <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[11px]">
                            {convPct}% conv
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div 
                          className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(4, parseFloat(pct))}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
                {Object.keys(channelAttribution).length === 0 && (
                  <div className="text-center text-gray-400 py-6 text-xs">No channel attribution data available.</div>
                )}
              </div>
            </div>

            {/* Campaign Attribution */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <TrendingUp className="text-emerald-600 w-4 h-4" />
                  Campaign Performance Attribution
                </h3>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  {Object.keys(campaignAttribution).length} Campaigns
                </span>
              </div>

              <div className="space-y-3">
                {Object.values(campaignAttribution).map((cmp) => {
                  const pct = totalLeads > 0 ? ((cmp.total / totalLeads) * 100).toFixed(1) : "0.0";
                  const convPct = cmp.total > 0 ? ((cmp.enrolled / cmp.total) * 100).toFixed(0) : "0";
                  return (
                    <div key={cmp.campaign} className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-gray-800 capitalize">
                          {cmp.campaign.replace(/-/g, " ")}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 font-medium">{cmp.total} enquiries</span>
                          <span className="bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded text-[11px]">
                            {cmp.enrolled} enrolled ({convPct}%)
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div 
                          className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(4, parseFloat(pct))}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
                {Object.keys(campaignAttribution).length === 0 && (
                  <div className="text-center text-gray-400 py-6 text-xs">No campaign attribution data available.</div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
