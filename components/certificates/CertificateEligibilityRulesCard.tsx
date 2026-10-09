"use client";

import React, { useState, useEffect } from "react";
import { Sliders, CheckCircle2, RotateCcw, Save, AlertTriangle, ShieldCheck, Info } from "lucide-react";
import { useToast } from "@/components/ui/dialogs/ToastProvider";

interface EligibilityRules {
  attendanceThreshold: number;
  assignmentSubmissionThreshold: number;
  quizPassingThreshold: number;
  syllabusCompletionRequired: boolean;
}

export default function CertificateEligibilityRulesCard() {
  const toast = useToast();

  const [rules, setRules] = useState<EligibilityRules>({
    attendanceThreshold: 80,
    assignmentSubmissionThreshold: 75,
    quizPassingThreshold: 60,
    syllabusCompletionRequired: true,
  });

  const [savedRules, setSavedRules] = useState<EligibilityRules>({
    attendanceThreshold: 80,
    assignmentSubmissionThreshold: 75,
    quizPassingThreshold: 60,
    syllabusCompletionRequired: true,
  });

  const [recommendedDefaults, setRecommendedDefaults] = useState<EligibilityRules>({
    attendanceThreshold: 80,
    assignmentSubmissionThreshold: 75,
    quizPassingThreshold: 60,
    syllabusCompletionRequired: true,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  // Fetch settings from API
  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/certificates/settings");
      const json = await res.json();
      if (json.success && json.data) {
        setRules(json.data);
        setSavedRules(json.data);
        if (json.meta?.recommendedDefaults) {
          setRecommendedDefaults(json.meta.recommendedDefaults);
        }
      }
    } catch {
      toast.error("Error", "Failed to load certificate eligibility settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Validation
  const validateField = (val: number): string | null => {
    if (isNaN(val)) return "Value is required.";
    if (val < 0) return "Must be at least 0%.";
    if (val > 100) return "Cannot exceed 100%.";
    return null;
  };

  const attendanceError = validateField(rules.attendanceThreshold);
  const assignmentError = validateField(rules.assignmentSubmissionThreshold);
  const quizError = validateField(rules.quizPassingThreshold);
  const hasErrors = Boolean(attendanceError || assignmentError || quizError);

  const isDirty =
    rules.attendanceThreshold !== savedRules.attendanceThreshold ||
    rules.assignmentSubmissionThreshold !== savedRules.assignmentSubmissionThreshold ||
    rules.quizPassingThreshold !== savedRules.quizPassingThreshold ||
    rules.syllabusCompletionRequired !== savedRules.syllabusCompletionRequired;

  // Handle Save
  const handleSave = async () => {
    if (hasErrors) {
      toast.error("Validation Error", "Please correct threshold values before saving.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/certificates/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rules),
      });

      const json = await res.json();
      if (json.success && json.data) {
        setSavedRules(json.data);
        setRules(json.data);
        toast.success(
          "Settings Saved",
          "Certificate eligibility rules updated and applied to all future issuances."
        );
      } else {
        toast.error("Save Failed", json.message || "Failed to update certificate rules.");
      }
    } catch {
      toast.error("Network Error", "Unable to reach certificate settings server.");
    } finally {
      setSaving(false);
    }
  };

  // Handle Reset to Defaults
  const handleResetToDefaults = async () => {
    setSaving(true);
    setShowConfirmReset(false);
    try {
      const res = await fetch("/api/admin/certificates/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reset: true }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        setSavedRules(json.data);
        setRules(json.data);
        toast.success(
          "Reset Completed",
          "Certificate rules restored to recommended TrueLern defaults (80% / 75% / 60% / Required)."
        );
      } else {
        toast.error("Reset Failed", json.message || "Failed to reset certificate rules.");
      }
    } catch {
      toast.error("Network Error", "Unable to reach certificate settings server.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-slate-100 rounded w-1/4"></div>
          <div className="h-4 bg-slate-100 rounded w-1/2"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4">
            <div className="h-28 bg-slate-50 rounded-lg"></div>
            <div className="h-28 bg-slate-50 rounded-lg"></div>
            <div className="h-28 bg-slate-50 rounded-lg"></div>
            <div className="h-28 bg-slate-50 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
            <Sliders className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-slate-900">Certificate Eligibility Rules</h2>
              {isDirty && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                  <AlertTriangle className="size-3" /> Unsaved Changes
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Authoritative backend rules applied across student milestone roadmaps, draft generation, and credential issuance.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowConfirmReset(true)}
            disabled={saving}
            className="px-3 py-1.5 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-lg text-xs font-bold transition flex items-center gap-1.5"
            title="Reset thresholds to TrueLern recommended defaults"
          >
            <RotateCcw className="size-3.5" />
            Reset Defaults
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !isDirty || hasErrors}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm ${
              saving || !isDirty || hasErrors
                ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                : "bg-indigo-600 hover:bg-indigo-700 text-white"
            }`}
          >
            <Save className="size-3.5" />
            {saving ? "Saving..." : "Save Rules"}
          </button>
        </div>
      </div>

      {/* Rules Grid */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Rule 1: Live Attendance */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-200 transition-colors flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-slate-900">Live Attendance</span>
              <span className="text-xs font-mono font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                {rules.attendanceThreshold}%
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed mb-3">
              Student must maintain at least this attendance percentage.
            </p>

            <div className="space-y-2">
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={rules.attendanceThreshold}
                onChange={(e) => setRules((prev) => ({ ...prev, attendanceThreshold: Number(e.target.value) }))}
                className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-slate-100 rounded-lg"
              />
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>0%</span>
                <span className="font-semibold text-slate-600">Saved: {savedRules.attendanceThreshold}%</span>
                <span>100%</span>
              </div>
            </div>

            {attendanceError && <p className="text-[11px] text-red-600 font-semibold mt-1">{attendanceError}</p>}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Recommended:</span>
            <span className="font-bold text-slate-700">{recommendedDefaults.attendanceThreshold}%</span>
          </div>
        </div>

        {/* Rule 2: Assignment Submission */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-200 transition-colors flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-slate-900">Assignment Submission</span>
              <span className="text-xs font-mono font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                {rules.assignmentSubmissionThreshold}%
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed mb-3">
              Student must submit at least this percentage of required assignments.
            </p>

            <div className="space-y-2">
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={rules.assignmentSubmissionThreshold}
                onChange={(e) =>
                  setRules((prev) => ({ ...prev, assignmentSubmissionThreshold: Number(e.target.value) }))
                }
                className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-slate-100 rounded-lg"
              />
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>0%</span>
                <span className="font-semibold text-slate-600">Saved: {savedRules.assignmentSubmissionThreshold}%</span>
                <span>100%</span>
              </div>
            </div>

            {assignmentError && <p className="text-[11px] text-red-600 font-semibold mt-1">{assignmentError}</p>}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Recommended:</span>
            <span className="font-bold text-slate-700">{recommendedDefaults.assignmentSubmissionThreshold}%</span>
          </div>
        </div>

        {/* Rule 3: Quiz / Assessment Passing */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-200 transition-colors flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-slate-900">Quiz / Assessment Passing</span>
              <span className="text-xs font-mono font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                {rules.quizPassingThreshold}%
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed mb-3">
              Student must achieve at least this percentage in the required assessments.
            </p>

            <div className="space-y-2">
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={rules.quizPassingThreshold}
                onChange={(e) => setRules((prev) => ({ ...prev, quizPassingThreshold: Number(e.target.value) }))}
                className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-slate-100 rounded-lg"
              />
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>0%</span>
                <span className="font-semibold text-slate-600">Saved: {savedRules.quizPassingThreshold}%</span>
                <span>100%</span>
              </div>
            </div>

            {quizError && <p className="text-[11px] text-red-600 font-semibold mt-1">{quizError}</p>}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Recommended:</span>
            <span className="font-bold text-slate-700">{recommendedDefaults.quizPassingThreshold}%</span>
          </div>
        </div>

        {/* Rule 4: Syllabus Completion */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-200 transition-colors flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-slate-900">Syllabus Completion</span>
              <span
                className={`text-xs font-mono font-extrabold px-2 py-0.5 rounded ${
                  rules.syllabusCompletionRequired
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {rules.syllabusCompletionRequired ? "ON / Required" : "OFF / Optional"}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed mb-3">
              Student must complete the required syllabus.
            </p>

            <div className="pt-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rules.syllabusCompletionRequired}
                  onChange={(e) =>
                    setRules((prev) => ({ ...prev, syllabusCompletionRequired: e.target.checked }))
                  }
                  className="size-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                <span className="text-xs font-semibold text-slate-700">
                  {rules.syllabusCompletionRequired ? "Mandatory Course Completion" : "Optional Syllabus"}
                </span>
              </label>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Recommended:</span>
            <span className="font-bold text-slate-700">Required (ON)</span>
          </div>
        </div>
      </div>

      {/* Governance Notice Banner */}
      <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 gap-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-4 text-emerald-600" />
          <span>
            <strong>Immutable Credentials:</strong> Modifying thresholds applies immediately to in-progress calculations and new issuances. Historical issued certificates remain protected against silent tampering.
          </span>
        </div>
      </div>

      {/* Confirmation Dialog for Reset */}
      {showConfirmReset && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-slate-900">
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                <AlertTriangle className="size-5" />
              </div>
              <h3 className="text-base font-extrabold">Reset to Recommended Defaults?</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              This will reset the certificate eligibility rules to TrueLern recommended thresholds:
              <br />
              &bull; Live Attendance: <strong>80%</strong>
              <br />
              &bull; Assignment Submission: <strong>75%</strong>
              <br />
              &bull; Quiz / Assessment Passing: <strong>60%</strong>
              <br />
              &bull; Syllabus Completion: <strong>Required (ON)</strong>
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmReset(false)}
                className="px-3.5 py-1.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetToDefaults}
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-sm"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
