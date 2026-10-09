"use client";
import React, { useState, useEffect } from "react";

export default function ParentPortalConfigPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [config, setConfig] = useState({
    attendanceVisibility: true,
    homeworkVisibility: true,
    assessmentVisibility: true,
    gradeVisibility: true,
    feeVisibility: true,
    paymentVisibility: true,
    certificatesVisibility: true,
    timetableVisibility: true,
    calendarVisibility: true,
    announcementsVisibility: true,
    teacherMessagingEnabled: true,
    leaveRequestsEnabled: true,
    pushNotificationsEnabled: true,
    emailNotificationsEnabled: true,
    smsNotificationsEnabled: false,
    downloadPermissions: true,
    reportCardPermissions: true,
    documentPermissions: true,
  });

  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch("/api/admin/settings/parent-portal");
        const data = await res.json();
        if (data.success && data.data) {
          setConfig(data.data);
        }
      } catch (err) {
        console.error("Failed to load parent portal config", err);
      } finally {
        setLoading(false);
      }
    }
    loadConfig();
  }, []);

  const handleToggle = (key: keyof typeof config) => {
    setConfig((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/settings/parent-portal", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (data.success) {
        setMessage("✅ Parent Portal Configuration saved successfully.");
      } else {
        setMessage("❌ Failed to save configuration.");
      }
    } catch (err) {
      setMessage("❌ Error saving configuration.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-sm text-gray-500">Loading Configuration...</div>;
  }

  const sections = [
    {
      title: "Academic & Learning Visibility",
      items: [
        { key: "attendanceVisibility", label: "Attendance Visibility", desc: "Allow parents to view live attendance records" },
        { key: "homeworkVisibility", label: "Homework & Assignments", desc: "Allow parents to track pending/submitted homework" },
        { key: "assessmentVisibility", label: "Assessment Results", desc: "Allow parents to view exam scores and analytics" },
        { key: "gradeVisibility", label: "Gradebook Access", desc: "Enable overall gradebook and GPA visibility" },
        { key: "timetableVisibility", label: "Timetable & Schedules", desc: "Allow parents to view live class schedules" },
        { key: "certificatesVisibility", label: "Certificates & Badges", desc: "Allow parents to view issued certificates" },
      ],
    },
    {
      title: "Finance & Fee Controls",
      items: [
        { key: "feeVisibility", label: "Fee Plan Visibility", desc: "Allow parents to view tuition breakdown and due dates" },
        { key: "paymentVisibility", label: "Online Payments", desc: "Allow parents to complete fee payments directly" },
      ],
    },
    {
      title: "Communication & Permissions",
      items: [
        { key: "announcementsVisibility", label: "Announcements & Broadcasts", desc: "Display institution announcements to parents" },
        { key: "teacherMessagingEnabled", label: "Teacher Direct Messaging", desc: "Enable parent-teacher direct messaging" },
        { key: "leaveRequestsEnabled", label: "Student Leave Requests", desc: "Allow parents to submit leave applications" },
        { key: "downloadPermissions", label: "Resource Downloads", desc: "Allow parents to download learning materials" },
        { key: "reportCardPermissions", label: "Report Card Downloads", desc: "Allow parents to export PDF report cards" },
        { key: "documentPermissions", label: "Document Submissions", desc: "Allow parents to upload verification documents" },
      ],
    },
    {
      title: "Notification Dispatch Channels",
      items: [
        { key: "pushNotificationsEnabled", label: "Mobile Push Notifications", desc: "Dispatch real-time push alerts to Parent Mobile App" },
        { key: "emailNotificationsEnabled", label: "Email Notifications", desc: "Send daily/weekly digest emails to parents" },
        { key: "smsNotificationsEnabled", label: "SMS Alerts", desc: "Send emergency SMS updates to parent mobile numbers" },
      ],
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Parent Portal Configuration</h1>
          <p className="text-sm font-semibold text-gray-500 mt-1">
            Global administrative toggles governing feature visibility, permissions, and messaging for all parent accounts.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold shadow-md transition disabled:opacity-50"
        >
          {saving ? "Saving Changes..." : "Save Portal Settings"}
        </button>
      </div>

      {message && <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 text-xs font-bold text-indigo-800">{message}</div>}

      {/* Configuration Sections */}
      <div className="space-y-6">
        {sections.map((section) => (
          <div key={section.title} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h2 className="text-sm uppercase tracking-wider font-extrabold text-indigo-600">{section.title}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {section.items.map((item) => {
                const isChecked = config[item.key as keyof typeof config];
                return (
                  <div key={item.key} className="flex items-start justify-between p-3.5 rounded-xl bg-slate-50 border border-gray-100">
                    <div className="pr-4">
                      <div className="text-xs font-bold text-gray-900">{item.label}</div>
                      <div className="text-[11px] font-medium text-gray-500">{item.desc}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggle(item.key as keyof typeof config)}
                      className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                        isChecked ? "bg-indigo-600 justify-end" : "bg-gray-300 justify-start"
                      }`}
                    >
                      <span className="w-4 h-4 rounded-full bg-white shadow-md transform transition-transform" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
