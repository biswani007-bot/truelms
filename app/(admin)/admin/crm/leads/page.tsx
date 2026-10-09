"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Search, Filter, Plus, Download, Layout, SlidersHorizontal, 
  Grid, List, CheckSquare, TriangleAlert, Settings, UserPlus 
} from "lucide-react";
import { EnterpriseDialog } from "@/components/ui/dialogs/EnterpriseDialog";
import { useToast } from "@/components/ui/dialogs/ToastProvider";

export default function LeadListPage() {
  const router = useRouter();
  const toast = useToast();
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"kanban" | "table">("kanban");
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);

  // Create Lead Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newLeadName, setNewLeadName] = useState("");
  const [newLeadPhone, setNewLeadPhone] = useState("");
  const [newLeadEmail, setNewLeadEmail] = useState("");
  const [newLeadCourse, setNewLeadCourse] = useState("Junior Foundation");
  const [createLoading, setCreateLoading] = useState(false);
  
  // Filters state
  const [sourceFilter, setSourceFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [density, setDensity] = useState<"compact" | "normal" | "relaxed">("normal");

  // Kanban Columns
  const pipelineStages = [
    { label: "New", status: "new" },
    { label: "Demo Scheduled", status: "demo_scheduled" },
    { label: "Demo Completed", status: "demo_completed" },
    { label: "Contacted", status: "contacted" },
    { label: "Qualified", status: "qualified" },
    { label: "Counselling", status: "followup" },
    { label: "Enrollment Initiated", status: "enrollment_pending" },
    { label: "Enrolled", status: "enrolled" },
    { label: "Lost", status: "lost" }
  ];

  // Column Visibility
  const [columns, setColumns] = useState({
    leadId: true,
    fullName: true,
    course: true,
    source: true,
    priority: true,
    status: true
  });
  const [showColMenu, setShowColMenu] = useState(false);
  const [focusIndex, setFocusIndex] = useState<number>(-1);

  const fetchLeads = () => {
    setLoading(true);
    fetch(`/api/crm/leads?search=${search}&limit=100`)
      .then((res) => res.json())
      .then((data) => {
        const parsed = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data?.data?.data)
          ? data.data.data
          : [];
        setLeads(parsed);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchLeads();
  }, [search]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (filteredLeads.length === 0 || view !== "table") return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setFocusIndex(prev => (prev + 1) % filteredLeads.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setFocusIndex(prev => (prev - 1 + filteredLeads.length) % filteredLeads.length);
      } else if (e.key === "Enter" && focusIndex >= 0) {
        e.preventDefault();
        router.push(`/admin/crm/leads/${filteredLeads[focusIndex]._id}`);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [leads, focusIndex, view]);

  const toggleSelect = (id: string) => {
    setSelectedLeads(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleBulkStatusChange = async (newStatus: string) => {
    try {
      await Promise.all(selectedLeads.map(id => 
        fetch(`/api/crm/leads/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus })
        })
      ));
      setSelectedLeads([]);
      fetchLeads();
      toast.success("Bulk Update Complete", `Status of ${selectedLeads.length} leads updated to ${newStatus}.`);
    } catch (e) {
      console.error(e);
      toast.error("Update Failed", "Failed to update selected leads.");
    }
  };

  const handleCreateLeadConfirm = async () => {
    if (!newLeadName.trim() || !newLeadPhone.trim() || !newLeadEmail.trim()) {
      toast.error("Validation Error", "Lead full name, phone number, and email address are required.");
      return;
    }
    setCreateLoading(true);
    try {
      const res = await fetch("/api/crm/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: newLeadName.trim(),
          phone: newLeadPhone.trim(),
          email: newLeadEmail.trim(),
          interestedCourse: newLeadCourse,
          country: "USA",
          state: "California",
          city: "Los Angeles",
          priority: "medium",
          leadSource: "manual"
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Lead Created", `New lead "${newLeadName}" added to the pipeline.`);
        setShowCreateModal(false);
        setNewLeadName("");
        setNewLeadPhone("");
        setNewLeadEmail("");
        fetchLeads();
      } else {
        toast.error("Creation Failed", data.error || "Failed to create lead.");
      }
    } catch (e) {
      console.error(e);
      toast.error("Network Error", "An error occurred while creating the lead.");
    } finally {
      setCreateLoading(false);
    }
  };

  const exportCSV = () => {
    const headers = ["Lead ID", "Name", "Course", "Source", "Priority", "Status"];
    const rows = filteredLeads.map(l => [
      l.leadId,
      l.fullName,
      l.interestedCourse,
      l.leadSource,
      l.priority,
      l.status
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "lmsca_crm_leads.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredLeads = leads.filter(l => {
    const matchSource = sourceFilter === "ALL" || l.leadSource === sourceFilter;
    const matchPriority = priorityFilter === "ALL" || l.priority === priorityFilter;
    const matchStatus = statusFilter === "ALL" || l.status === statusFilter;
    return matchSource && matchPriority && matchStatus;
  });

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Sticky Header Section */}
      <div className="sticky top-0 bg-slate-50 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 z-20 border-b border-gray-100">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Lead Pipeline</h1>
          <p className="text-sm text-gray-500 mt-1">Acquire, qualify, and enroll students through the admissions funnel.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => toast.info("Import Leads", "Admissions lead import feature initiated.")}
            className="px-4 py-2 border bg-white hover:bg-gray-50 text-gray-700 font-semibold text-sm rounded-lg shadow-sm transition"
          >
            Import Leads
          </button>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-lg shadow-sm transition"
          >
            Create Lead
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
        {/* Toolbar & Filters */}
        <div className="p-4 border-b border-gray-100 flex flex-wrap justify-between items-center gap-4 bg-gray-50/50">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Search by name, email, or id..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 border rounded-lg text-sm bg-white"
              />
            </div>
            
            <select 
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="px-3 py-1.5 border rounded-lg text-sm bg-white"
            >
              <option value="ALL">All Sources</option>
              <option value="website">Website</option>
              <option value="landing-page">Landing Page</option>
              <option value="referral">Referral</option>
              <option value="manual">Manual</option>
            </select>

            <select 
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-1.5 border rounded-lg text-sm bg-white"
            >
              <option value="ALL">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={exportCSV} className="p-2 border bg-white hover:bg-gray-50 rounded-lg text-sm font-semibold flex items-center gap-1.5">
              <Download className="w-4 h-4" /> Export
            </button>

            <div className="flex bg-gray-100 rounded-lg p-1">
              <button 
                onClick={() => setView("kanban")}
                className={`p-1.5 rounded-md ${view === 'kanban' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setView("table")}
                className={`p-1.5 rounded-md ${view === 'table' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Bulk Action Sticky Bar */}
        {selectedLeads.length > 0 && (
          <div className="bg-indigo-50 border-b border-indigo-150 px-4 py-2.5 flex justify-between items-center z-15 sticky top-14">
            <span className="text-xs font-bold text-indigo-700">{selectedLeads.length} leads selected</span>
            <div className="flex gap-2">
              <button onClick={() => handleBulkStatusChange("qualified")} className="px-3 py-1 bg-indigo-600 text-white rounded text-xs font-bold hover:bg-indigo-700">Bulk Qualify</button>
              <button onClick={() => handleBulkStatusChange("lost")} className="px-3 py-1 bg-white border border-indigo-300 text-indigo-700 rounded text-xs font-bold hover:bg-indigo-50">Mark Lost</button>
            </div>
          </div>
        )}

        {/* View Content */}
        {loading ? (
          <div className="py-12 text-center text-gray-400">Loading leads...</div>
        ) : view === "kanban" ? (
          /* Kanban Board layout */
          <div className="p-6 overflow-x-auto flex gap-6 bg-slate-50 min-h-[600px]">
            {pipelineStages.map((stage) => {
              const stageLeads = filteredLeads.filter(l => l.status === stage.status);
              return (
                <div key={stage.status} className="w-72 shrink-0 flex flex-col bg-gray-100/70 border rounded-xl p-3 max-h-[550px]">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">{stage.label}</span>
                    <span className="bg-gray-200 text-gray-700 text-[10px] font-bold px-2 py-0.5 rounded-full">{stageLeads.length}</span>
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                    {stageLeads.map((lead) => (
                      <div 
                        key={lead._id}
                        onClick={() => router.push(`/admin/crm/leads/${lead._id}`)}
                        className="bg-white border p-3 rounded-lg shadow-sm hover:border-indigo-400 hover:shadow transition cursor-pointer space-y-2"
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-gray-400 font-mono">#{lead.leadId}</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${lead.priority === 'high' ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-500'}`}>{lead.priority}</span>
                        </div>
                        <div className="font-semibold text-xs text-gray-900">{lead.fullName}</div>
                        <div className="text-[10px] text-gray-500 truncate">{lead.interestedCourse}</div>
                      </div>
                    ))}
                    {stageLeads.length === 0 && (
                      <div className="text-center text-[10px] text-gray-400 py-6">Empty stage</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Data Table View */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-gray-500 text-xs font-semibold uppercase tracking-wider">
                  <th className="p-4 w-12">
                    <input 
                      type="checkbox" 
                      checked={selectedLeads.length === filteredLeads.length}
                      onChange={() => {
                        if (selectedLeads.length === filteredLeads.length) setSelectedLeads([]);
                        else setSelectedLeads(filteredLeads.map(l => l._id));
                      }}
                      className="rounded" 
                    />
                  </th>
                  {columns.leadId && <th className="p-4">Lead ID</th>}
                  {columns.fullName && <th className="p-4">Name</th>}
                  {columns.course && <th className="p-4">Course preference</th>}
                  {columns.source && <th className="p-4">Source</th>}
                  {columns.priority && <th className="p-4">Priority</th>}
                  {columns.status && <th className="p-4">Status</th>}
                  <th className="p-4 text-right">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredLeads.map((lead, idx) => (
                  <tr 
                    key={lead._id}
                    className={`hover:bg-gray-50/50 transition group ${focusIndex === idx ? 'bg-indigo-50/30' : ''}`}
                  >
                    <td className="p-4">
                      <input 
                        type="checkbox" 
                        checked={selectedLeads.includes(lead._id)}
                        onChange={() => toggleSelect(lead._id)}
                        className="rounded" 
                      />
                    </td>
                    {columns.leadId && <td className="p-4 font-mono text-xs font-bold text-indigo-600">{lead.leadId}</td>}
                    {columns.fullName && <td className="p-4 font-semibold text-gray-900">{lead.fullName}</td>}
                    {columns.course && <td className="p-4 text-gray-600">{lead.interestedCourse}</td>}
                    {columns.source && <td className="p-4 text-gray-500 capitalize">{lead.leadSource}</td>}
                    {columns.priority && (
                      <td className="p-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${lead.priority === 'high' ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-500'}`}>{lead.priority}</span>
                      </td>
                    )}
                    {columns.status && (
                      <td className="p-4">
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded bg-slate-100 text-gray-700 capitalize">{lead.status}</span>
                      </td>
                    )}
                    <td className="p-4 text-right">
                      <Link href={`/admin/crm/leads/${lead._id}`} className="text-xs font-bold text-indigo-600 hover:text-indigo-800">
                        View File
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Lead EnterpriseDialog */}
      <EnterpriseDialog
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Add New Admissions Lead"
        subtitle="Manually register a prospect into the admissions pipeline."
        confirmLabel="Create Lead"
        cancelLabel="Cancel"
        onConfirm={handleCreateLeadConfirm}
        loading={createLoading}
      >
        <div className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Full Name *</label>
            <input
              type="text"
              value={newLeadName}
              onChange={(e) => setNewLeadName(e.target.value)}
              placeholder="e.g. Sarah Jenkins"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Phone Number *</label>
              <input
                type="text"
                value={newLeadPhone}
                onChange={(e) => setNewLeadPhone(e.target.value)}
                placeholder="+1 (555) 019-2831"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Email Address *</label>
              <input
                type="email"
                value={newLeadEmail}
                onChange={(e) => setNewLeadEmail(e.target.value)}
                placeholder="sarah@example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Program Preference</label>
            <select
              value={newLeadCourse}
              onChange={(e) => setNewLeadCourse(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Junior Foundation">Junior Foundation</option>
              <option value="Future-Ready Builders">Future-Ready Builders</option>
              <option value="Communication & Confidence">Communication &amp; Confidence</option>
              <option value="Money Skills">Money Skills</option>
              <option value="Emotional Intelligence">Emotional Intelligence</option>
              <option value="AI Readiness">AI Readiness</option>
            </select>
          </div>
        </div>
      </EnterpriseDialog>
    </div>
  );
}
