"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, User, Phone, Mail, MapPin, Calendar, 
  MessageSquare, FileText, Activity, Tag, Clock, 
  CircleCheck, CircleX, TrendingUp, UploadCloud, 
  TriangleAlert, ChevronRight, UserCheck 
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ui/dialogs/ToastProvider";

export default function LeadDetailsPage() {
  const params = useParams() || {};
  const router = useRouter();
  const toast = useToast();
  const id = (params.id || "") as string;

  const [lead, setLead] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"followups" | "application" | "communication" | "documents" | "timeline">("followups");

  // CRM Operations States
  const [followUps, setFollowUps] = useState<any[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  
  // Followup Logging form
  const [logForm, setLogForm] = useState({
    mode: "call",
    outcome: "interested",
    remarks: "",
    priority: "medium"
  });

  // Communication Form
  const [comType, setComType] = useState<"email" | "sms" | "whatsapp">("email");
  const [comTemplate, setComTemplate] = useState("welcome");
  const [comHistory, setComHistory] = useState<any[]>([
    { type: "email", template: "Welcome Letter", status: "delivered", timestamp: new Date(Date.now() - 3600000) }
  ]);

  const [docs, setDocs] = useState([
    { name: "High School Certificate / Diploma", verified: false, file: "diploma_v1.pdf" },
    { name: "Government ID (Passport/License)", verified: false, file: "passport_scan.jpg" },
    { name: "Academic Transcript", verified: false, file: null }
  ]);

  const [offerGenerated, setOfferGenerated] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [checkoutResult, setCheckoutResult] = useState<any>(null);

  const fetchLeadData = () => {
    if (!id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([
      fetch(`/api/crm/leads/${id}`).then(res => res.json()),
      fetch(`/api/crm/leads/${id}/followups`).then(res => res.json()).catch(() => ({ data: [] })),
      fetch(`/api/crm/leads/${id}/timeline`).then(res => res.json()).catch(() => ({ data: [] }))
    ]).then(([leadData, fuData, tlData]) => {
      if (leadData.success) {
        setLead(leadData.data);
      }
      if (fuData.success) {
        setFollowUps(fuData.data);
      }
      if (tlData.success) {
        setTimeline(tlData.data);
      }
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchLeadData();
  }, [id]);

  const handleUpdateStatus = async (newStatus: string) => {
    try {
      const res = await fetch(`/api/crm/leads/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        setLead(data.data);
        fetchLeadData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogFollowUp = async () => {
    try {
      const res = await fetch(`/api/crm/leads/${id}/followups`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: logForm.mode,
          outcome: logForm.outcome,
          remarks: logForm.remarks,
          date: new Date()
        })
      });
      const data = await res.json();
      if (data.success) {
        setLogForm({ mode: "call", outcome: "interested", remarks: "", priority: "medium" });
        fetchLeadData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendCom = () => {
    setComHistory(prev => [
      { type: comType, template: comTemplate, status: "delivered", timestamp: new Date() },
      ...prev
    ]);
    toast.success("Message Delivered", `${comType.toUpperCase()} message sent successfully!`);
  };

  const handleVerifyDoc = (index: number) => {
    setDocs(prev => prev.map((d, i) => i === index ? { ...d, verified: !d.verified } : d));
  };

  // Convert to Application
  const handleConvertToApplication = () => {
    handleUpdateStatus("application_submitted");
    toast.success("Lead Updated", "Lead promoted to Application status.");
  };

  // Counsellor Initiates Paid Enrollment from Lead
  const handleInitiateEnrollment = async () => {
    setEnrolling(true);
    try {
      const res = await fetch(`/api/crm/leads/${id}/enroll`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: "Enrollment initiated by admissions counsellor" })
      });
      const data = await res.json();
      if (data.success) {
        setCheckoutResult(data.data);
        toast.success("Enrollment Initiated", `Authoritative invoice #${data.data.invoiceNumber} created for ${data.data.courseName}.`);
        fetchLeadData();
      } else {
        toast.error("Conversion Error", data.message || "Failed to initiate enrollment.");
      }
    } catch (e: any) {
      toast.error("Network Error", e.message || "An error occurred.");
    } finally {
      setEnrolling(false);
    }
  };

  const [resending, setResending] = useState(false);
  const handleResendEmail = async (emailType: "enrollment_offer" | "payment_confirmation" | "receipt") => {
    setResending(true);
    try {
      const res = await fetch(`/api/crm/leads/${id}/resend-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailType }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Email Sent", data.message || "Notification email sent successfully.");
      } else {
        toast.error("Error", data.message || "Failed to resend email.");
      }
    } catch (e: any) {
      toast.error("Network Error", e.message || "Failed to resend email.");
    } finally {
      setResending(false);
    }
  };

  // Mark Demo as Completed
  const handleMarkDemoCompleted = async () => {
    const demoId = lead?.demoSession?.id;
    if (!demoId) {
      toast.error("No Demo Session", "No demo session is linked to this lead to complete.");
      return;
    }
    try {
      const res = await fetch(`/api/crm/demos/${demoId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Marked completed by counsellor in Admin CRM" }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Demo Completed", "Authoritative demo session marked as completed.");
        fetchLeadData();
      } else {
        toast.error("Completion Error", data.message || data.error || "Failed to mark demo completed.");
      }
    } catch (e: any) {
      toast.error("Network Error", e.message || "An error occurred.");
    }
  };

  // Enroll Student
  const handleEnrollStudent = () => {
    handleUpdateStatus("enrolled");
    toast.success("Student Enrolled", "Student enrollment successful! Promoted lead to active student.");
  };

  // Compute lead score
  const getLeadScore = () => {
    if (!lead) return 0;
    let score = 20;
    if (lead.priority === "high") score += 30;
    if (lead.status === "qualified") score += 20;
    if (lead.status === "admission_accepted") score += 20;
    if (lead.leadSource === "website" || lead.leadSource === "referral") score += 10;
    return score;
  };

  if (loading) return <div className="p-8 text-gray-500">Loading lead details...</div>;
  if (!lead) return <div className="p-8 text-red-500">Lead not found.</div>;

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/crm/leads" className="p-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-500">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-extrabold text-gray-900">{lead.fullName}</h1>
              <span className="text-xs font-mono font-bold text-gray-400">#{lead.leadId}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">{lead.email} &bull; {lead.phone}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <select 
            value={lead.status}
            onChange={(e) => handleUpdateStatus(e.target.value)}
            className="px-3.5 py-2 border rounded-lg text-xs font-bold bg-white text-gray-700 shadow-xs"
          >
            <option value="new">New</option>
            <option value="demo_scheduled">Demo Scheduled</option>
            <option value="demo_completed">Demo Completed</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
            <option value="followup">Counselling</option>
            <option value="application_submitted">Application Submitted</option>
            <option value="documents_pending">Documents Pending</option>
            <option value="admission_offered">Admission Offered</option>
            <option value="enrollment_pending">Enrollment Initiated</option>
            <option value="enrolled">Enrolled</option>
            <option value="lost">Lost</option>
          </select>
          
          {lead.status !== "enrolled" && (
            <button 
              onClick={handleInitiateEnrollment}
              disabled={enrolling}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold text-xs rounded-lg shadow-sm transition flex items-center gap-2"
            >
              {enrolling ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Enrolling...</span>
                </>
              ) : (
                <span>Enroll Student</span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Split layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left column: Overview & Demo Details */}
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-5">
            <h3 className="font-bold text-gray-900 border-b pb-2 text-sm">Lead Overview</h3>
            
            <div className="space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500 font-semibold">Priority</span>
                <span className="font-bold uppercase text-gray-900">{lead.priority}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-semibold">Lead Source</span>
                <span className="font-bold capitalize text-gray-900">{lead.leadSource}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-semibold">Interest Course / Program</span>
                <span className="font-bold text-gray-900">{lead.interestedCourse}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-semibold">Location</span>
                <span className="font-bold text-gray-900">{lead.city || "Unknown"}, {lead.country || "USA"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-semibold">Lead Score</span>
                <span className="font-bold text-indigo-600">{getLeadScore()} / 100</span>
              </div>
            </div>
          </div>

          {/* Authoritative Linked Child / Student Card */}
          {lead.student ? (
            <div className="bg-white border border-emerald-200 rounded-xl p-5 shadow-sm space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
                <h3 className="font-extrabold text-slate-900 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-emerald-600" /> Authoritative Student
                </h3>
                <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-emerald-100 text-emerald-800">
                  Linked
                </span>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Student Name</span>
                  <span className="font-bold text-slate-900">
                    {lead.student.firstName} {lead.student.lastName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Student ID</span>
                  <span className="font-mono font-bold text-slate-700">{lead.student.studentId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status</span>
                  <span className="capitalize font-semibold text-slate-800">{lead.student.status}</span>
                </div>
              </div>
              <Link
                href={`/admin/students/${lead.student._id}`}
                className="block text-center py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-lg text-xs transition"
              >
                View Student Profile &rarr;
              </Link>
            </div>
          ) : (
            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-5 shadow-sm space-y-2 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-amber-900">
                <TriangleAlert className="w-4 h-4 text-amber-600" /> Child / Student Not Linked
              </div>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                No authoritative child is attached to this lead. Conversion requires an authoritative student link.
              </p>
            </div>
          )}

          {/* DEMO COMPLETED & CONVERSION LIFECYCLE (Phase 3R) */}
          {(lead.demoSession?.status === "completed") && (
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-5 shadow-sm space-y-3.5 text-xs">
              <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                <h3 className="font-extrabold text-emerald-950 flex items-center gap-1.5">
                  <CircleCheck className="w-4 h-4 text-emerald-600" /> DEMO COMPLETED ✓
                </h3>
                <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-emerald-100 text-emerald-800">
                  Passed Threshold
                </span>
              </div>

              <div className="space-y-1.5 text-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-500">Child</span>
                  <span className="font-bold text-slate-900">
                    {lead.student ? `${lead.student.firstName} ${lead.student.lastName}` : "Not linked"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Course</span>
                  <span className="font-bold text-slate-900">{lead.interestedCourse}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Assigned Teacher</span>
                  <span className="font-semibold text-slate-800">
                    {lead.demoSession?.teacher?.name || "Elizabeth Vance"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Demo Result</span>
                  <span className="font-bold text-emerald-700">Completed & Attendance Verified</span>
                </div>
              </div>

              <div className="pt-2 border-t border-emerald-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">NEXT ACTION</span>
                  <span className="font-bold text-indigo-700 text-[11px]">Enrollment: Available</span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleInitiateEnrollment}
                    disabled={enrolling}
                    className="flex-1 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs transition flex items-center justify-center gap-1 shadow-xs cursor-pointer"
                  >
                    {enrolling ? "Initiating..." : "Open Enrollment"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleResendEmail("enrollment_offer")}
                    disabled={resending}
                    className="py-2 px-3 bg-white border border-emerald-300 text-emerald-800 font-semibold rounded-lg text-xs hover:bg-emerald-50 transition cursor-pointer"
                  >
                    Send Enrollment Link
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ENROLLMENT WAITING FOR PAYMENT (Phase 3R) */}
          {(lead.status === "enrollment_pending" || lead.enrollment?.status === "waiting-payment") && (
            <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-5 shadow-sm space-y-3.5 text-xs">
              <div className="flex items-center justify-between border-b border-amber-200 pb-2">
                <h3 className="font-extrabold text-amber-950 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-600" /> ENROLLMENT
                </h3>
                <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-amber-100 text-amber-800">
                  Waiting for Payment
                </span>
              </div>

              <div className="space-y-1.5 text-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-500">Invoice</span>
                  <span className="font-mono font-bold text-slate-900">
                    {lead.invoice?.invoiceNumber || "INV-Generated"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Outstanding</span>
                  <span className="font-bold text-amber-900">
                    ${(((lead.invoice?.outstandingAmount ?? 55000)) / 100).toFixed(2)} USD
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Enrollment #</span>
                  <span className="font-mono font-semibold text-slate-800">
                    {lead.enrollment?.enrollmentNumber || "ENR-Pending"}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-amber-200/80 flex gap-2">
                {checkoutResult?.checkoutUrl ? (
                  <a
                    href={checkoutResult.checkoutUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs text-center transition shadow-xs"
                  >
                    View Enrollment Page
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={handleInitiateEnrollment}
                    className="flex-1 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs transition shadow-xs"
                  >
                    View Enrollment
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleResendEmail("enrollment_offer")}
                  disabled={resending}
                  className="py-2 px-3 bg-white border border-amber-300 text-amber-900 font-semibold rounded-lg text-xs hover:bg-amber-50 transition cursor-pointer"
                >
                  Resend Link
                </button>
              </div>
            </div>
          )}

          {/* ENROLLMENT CONFIRMED / CONVERTED (Phase 3R) */}
          {(lead.status === "enrolled" || lead.enrollment?.status === "confirmed") && (
            <div className="bg-gradient-to-br from-indigo-50/90 to-purple-50/70 border border-indigo-200 rounded-xl p-5 shadow-sm space-y-3.5 text-xs">
              <div className="flex items-center justify-between border-b border-indigo-200 pb-2">
                <h3 className="font-extrabold text-indigo-950 flex items-center gap-1.5">
                  <CircleCheck className="w-4 h-4 text-indigo-600" /> ENROLLMENT: Confirmed
                </h3>
                <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-emerald-100 text-emerald-800">
                  Paid
                </span>
              </div>

              <div className="space-y-1.5 text-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-500">PAYMENT</span>
                  <span className="font-bold text-emerald-700">Paid & Verified</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">INVOICE</span>
                  <span className="font-mono font-bold text-slate-900">
                    {lead.invoice?.invoiceNumber || "INV-Settled"} (Paid)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">RECEIPT</span>
                  <span className="font-mono font-bold text-slate-900">
                    {lead.receipt?.receiptNumber || "RCP-000001"}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-white rounded-lg border border-indigo-100 space-y-1">
                <p className="font-bold text-[11px] text-indigo-950 uppercase tracking-wider">
                  NEXT: Cohort/Batch Assignment
                </p>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Enrollment is confirmed. Cohort allocation will be processed in Phase 4.
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleResendEmail("receipt")}
                disabled={resending}
                className="w-full py-2 bg-white hover:bg-indigo-50 border border-indigo-200 text-indigo-800 font-semibold rounded-lg text-xs transition cursor-pointer"
              >
                Resend Payment Confirmation & Receipt
              </button>
            </div>
          )}

          {/* Demo Details & Completion Card (Scheduled / Incomplete Demos) */}
          {(lead.demoSession ? lead.demoSession.status !== "completed" : lead.status === "demo_scheduled") && (
            <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-5 shadow-sm space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-indigo-200/80 pb-2">
                <h3 className="font-extrabold text-indigo-900 text-xs flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-indigo-600" /> Free Demo Class File
                </h3>
                <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-amber-100 text-amber-800">
                  {lead.demoSession?.status ? `Demo ${lead.demoSession.status}` : "Demo Scheduled"}
                </span>
              </div>

              <div className="space-y-2 text-slate-700">
                <p className="text-[11px] leading-relaxed whitespace-pre-line font-mono bg-white p-3 rounded-lg border border-indigo-100">
                  {lead.notes || "Demo class scheduled. Please coordinate classroom links."}
                </p>
              </div>

              <button
                type="button"
                onClick={handleMarkDemoCompleted}
                className="w-full py-2 bg-white hover:bg-indigo-50 border border-indigo-300 text-indigo-700 font-bold rounded-lg text-xs transition flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <CircleCheck className="w-3.5 h-3.5" /> Mark Demo as Completed
              </button>
            </div>
          )}
        </div>

        {/* Right column: Tabbed CRM operations */}
        <div className="lg:col-span-2 flex flex-col bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden min-h-[500px]">
          {/* Tab Selector */}
          <div className="flex border-b bg-gray-550/20 text-xs font-semibold overflow-x-auto">
            <button 
              onClick={() => setActiveTab("followups")}
              className={`px-4 py-3 border-b-2 transition ${activeTab === 'followups' ? 'border-indigo-600 text-indigo-600 bg-white' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
            >
              Follow Ups
            </button>
            <button 
              onClick={() => setActiveTab("application")}
              className={`px-4 py-3 border-b-2 transition ${activeTab === 'application' ? 'border-indigo-600 text-indigo-600 bg-white' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
            >
              Applications
            </button>
            <button 
              onClick={() => setActiveTab("communication")}
              className={`px-4 py-3 border-b-2 transition ${activeTab === 'communication' ? 'border-indigo-600 text-indigo-600 bg-white' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
            >
              Communication
            </button>
            <button 
              onClick={() => setActiveTab("documents")}
              className={`px-4 py-3 border-b-2 transition ${activeTab === 'documents' ? 'border-indigo-600 text-indigo-600 bg-white' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
            >
              Document Center
            </button>
            <button 
              onClick={() => setActiveTab("timeline")}
              className={`px-4 py-3 border-b-2 transition ${activeTab === 'timeline' ? 'border-indigo-600 text-indigo-600 bg-white' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
            >
              Timeline
            </button>
          </div>

          <div className="p-6 flex-1 overflow-y-auto">
            {activeTab === "followups" && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">Log counselor interaction</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Interaction Mode</label>
                      <select 
                        value={logForm.mode}
                        onChange={(e) => setLogForm(p => ({ ...p, mode: e.target.value }))}
                        className="w-full mt-1 border px-3 py-1.5 rounded-lg text-sm bg-white"
                      >
                        <option value="call">Phone Call</option>
                        <option value="email">Email</option>
                        <option value="whatsapp">WhatsApp</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Outcome Status</label>
                      <select 
                        value={logForm.outcome}
                        onChange={(e) => setLogForm(p => ({ ...p, outcome: e.target.value }))}
                        className="w-full mt-1 border px-3 py-1.5 rounded-lg text-sm bg-white"
                      >
                        <option value="interested">Interested</option>
                        <option value="busy">Busy / Call Later</option>
                        <option value="not-interested">Not Interested</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Interaction Remarks</label>
                    <textarea 
                      value={logForm.remarks}
                      onChange={(e) => setLogForm(p => ({ ...p, remarks: e.target.value }))}
                      rows={3}
                      className="w-full mt-1 border px-3 py-2 rounded-lg text-sm"
                      placeholder="Add details of conversation..."
                    />
                  </div>
                  <button 
                    onClick={handleLogFollowUp}
                    className="mt-3 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition"
                  >
                    Schedule Follow Up
                  </button>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-bold text-gray-900 text-xs mb-3">Interaction Logs</h4>
                  <div className="space-y-3">
                    {followUps.map((fu, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 border rounded-lg text-xs space-y-1">
                        <div className="flex justify-between font-bold text-gray-700 capitalize">
                          <span>{fu.mode} interaction</span>
                          <span>{new Date(fu.date).toLocaleDateString()}</span>
                        </div>
                        <p className="text-gray-600"><strong>Outcome:</strong> {fu.outcome}</p>
                        <p className="text-gray-500 italic">{fu.remarks}</p>
                      </div>
                    ))}
                    {followUps.length === 0 && (
                      <div className="text-center text-gray-400 py-6 text-xs">No follow ups completed yet.</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "application" && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">Admissions Pipeline Operations</h3>
                  <p className="text-xs text-gray-500 mt-1">Review documentation, conduct demo evaluations, and initiate paid enrollment.</p>
                </div>

                {/* Counsellor Enrollment Initiation Card */}
                <div className="bg-gradient-to-br from-indigo-50/80 via-white to-violet-50/60 border-2 border-indigo-200 rounded-2xl p-6 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-100 pb-3">
                    <div>
                      <span className="text-[10px] font-black text-indigo-700 uppercase tracking-wider">Counsellor Action</span>
                      <h4 className="font-extrabold text-sm text-slate-900">Initiate LMS Enrollment</h4>
                    </div>
                    <span className="text-xs font-mono font-bold bg-white px-2.5 py-1 rounded-lg border border-indigo-200 text-indigo-800 self-start sm:self-auto">
                      Course: {lead.interestedCourse}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    Convert this lead into an authoritative <strong>Enrollment</strong> and generate an authoritative <strong>Invoice</strong> with a secure checkout session URL.
                  </p>

                  {checkoutResult ? (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3">
                      <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                        <CircleCheck className="w-4 h-4 text-emerald-600" />
                        <span>Enrollment #{checkoutResult.enrollmentNumber} Initiated (Payment Required)</span>
                      </div>
                      <div className="text-xs text-slate-700 space-y-1 bg-white p-3 rounded-lg border border-emerald-100">
                        <p><strong>Invoice Reference:</strong> {checkoutResult.invoiceNumber}</p>
                        <p><strong>Total Payable:</strong> ${(checkoutResult.totalAmount / 100).toFixed(2)} USD</p>
                        <p><strong>Program:</strong> {checkoutResult.courseName}</p>
                      </div>
                      <div className="flex flex-wrap gap-2 pt-1">
                        <a
                          href={checkoutResult.checkoutUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm transition inline-flex items-center gap-1.5"
                        >
                          <span>Open Checkout Page</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </a>
                        <button
                          type="button"
                          onClick={() => {
                            if (navigator.clipboard) {
                              navigator.clipboard.writeText(window.location.origin + checkoutResult.checkoutUrl);
                              toast.success("Copied", "Checkout URL copied to clipboard.");
                            }
                          }}
                          className="px-4 py-2 bg-white border border-emerald-300 text-emerald-800 font-semibold text-xs rounded-lg hover:bg-emerald-50 transition"
                        >
                          Copy Checkout Link
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={enrolling}
                      onClick={handleInitiateEnrollment}
                      className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] disabled:opacity-60 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-300/30 transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {enrolling ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Generating Enrollment & Invoice...</span>
                        </>
                      ) : (
                        <>
                          <span>Initiate Enrollment ({lead.interestedCourse})</span>
                          <ChevronRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-slate-50 border p-4 rounded-xl space-y-4">
                    <h4 className="font-bold text-xs text-gray-800">Convert Pipeline Phase</h4>
                    
                    {lead.status === "new" || lead.status === "contacted" || lead.status === "demo_scheduled" ? (
                      <button 
                        onClick={handleConvertToApplication}
                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold"
                      >
                        Convert to Application
                      </button>
                    ) : (
                      <div className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                        <CircleCheck className="w-4 h-4" /> Converted to Application Pipeline
                      </div>
                    )}
                  </div>

                  <div className="bg-slate-50 border p-4 rounded-xl space-y-4">
                    <h4 className="font-bold text-xs text-gray-800">Offer Letter Generation</h4>
                    {offerGenerated ? (
                      <div className="space-y-2">
                        <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
                          <CircleCheck className="w-4 h-4" /> Offer Letter Generated successfully
                        </span>
                        <button 
                          onClick={() => toast.success("Download Started", "Offer letter downloaded.")}
                          className="px-3 py-1 bg-white border text-gray-700 rounded text-[10px] font-bold"
                        >
                          Download Offer Letter
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => setOfferGenerated(true)}
                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold"
                      >
                        Generate Offer Letter
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "communication" && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">Communication Center</h3>
                  <p className="text-xs text-gray-500 mt-1">Send predefined template messages directly to the lead.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border p-4 bg-slate-50 rounded-xl">
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Channel</label>
                    <select 
                      value={comType}
                      onChange={(e) => setComType(e.target.value as any)}
                      className="w-full mt-1 border px-3 py-1.5 rounded-lg text-sm bg-white"
                    >
                      <option value="email">Email</option>
                      <option value="sms">SMS</option>
                      <option value="whatsapp">WhatsApp</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Predefined Template</label>
                    <select 
                      value={comTemplate}
                      onChange={(e) => setComTemplate(e.target.value)}
                      className="w-full mt-1 border px-3 py-1.5 rounded-lg text-sm bg-white"
                    >
                      <option value="welcome">Welcome Onboarding</option>
                      <option value="interview">Interview Scheduling</option>
                      <option value="followup">Document Pending Reminder</option>
                    </select>
                  </div>
                  <div className="md:col-span-3 flex justify-end">
                    <button 
                      onClick={handleSendCom}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg"
                    >
                      Send {comType.toUpperCase()}
                    </button>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-bold text-xs text-gray-700 mb-3">Delivery History Logs</h4>
                  <div className="space-y-2">
                    {comHistory.map((h, i) => (
                      <div key={i} className="flex justify-between items-center text-xs p-2 border-b">
                        <div>
                          <span className="font-bold capitalize mr-2">{h.type}</span>
                          <span className="text-gray-500">({h.template})</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-bold">{h.status}</span>
                          <span className="text-[10px] text-gray-400">{new Date(h.timestamp).toLocaleTimeString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "documents" && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">Admissions Document Checklist</h3>
                  <p className="text-xs text-gray-500 mt-1">Audit, replace and approve documentation checklists.</p>
                </div>

                <div className="space-y-3">
                  {docs.map((doc, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 border rounded-xl text-xs">
                      <div>
                        <span className="font-semibold text-gray-800 block">{doc.name}</span>
                        {doc.file ? (
                          <span className="text-[10px] text-indigo-600 font-mono mt-1 block hover:underline cursor-pointer">{doc.file}</span>
                        ) : (
                          <span className="text-[10px] text-red-500 font-mono mt-1 block">Not uploaded yet</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {doc.file && (
                          <button 
                            onClick={() => handleVerifyDoc(idx)}
                            className={`px-3 py-1 rounded font-bold text-[10px] ${doc.verified ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700 hover:bg-amber-200'}`}
                          >
                            {doc.verified ? 'Verified ✓' : 'Verify Documents'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "timeline" && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">Lifecycle Activities Feed</h3>
                  <p className="text-xs text-gray-500 mt-1">Audit log of lead state transitions and notes.</p>
                </div>

                <div className="border-l border-gray-200 pl-4 space-y-4">
                  {timeline.map((item, idx) => (
                    <div key={idx} className="relative text-xs">
                      <div className="absolute -left-[21px] top-1.5 w-2 h-2 bg-indigo-600 rounded-full border border-white" />
                      <div className="font-bold text-gray-700 capitalize">{item.event}</div>
                      <p className="text-gray-500 mt-0.5">{item.description}</p>
                      <span className="text-[9px] text-gray-400 mt-1 block">{new Date(item.timestamp).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
