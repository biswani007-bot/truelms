"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertCircle,
  Award,
  ChevronLeft,
  ChevronRight,
  Send,
  Sparkles,
  HelpCircle,
  FileText,
  RotateCcw,
} from "lucide-react";

export default function StudentAssessmentRunnerPage() {
  const params = useParams() || {};
  const id = (params.id || "") as string;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [assessment, setAssessment] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Runner state
  const [mode, setMode] = useState<"overview" | "running" | "result">("overview");
  const [currentAttempt, setCurrentAttempt] = useState<any>(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    fetch(`/api/assessments/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.data) {
          setAssessment(data.data);
          const durationMins = data.data.duration || 30;
          setTimeLeft(durationMins * 60);
        } else {
          setError(data?.message || "Assessment not found");
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load assessment:", err);
        setError("Failed to fetch assessment details.");
        setLoading(false);
      });
  }, [id]);

  // Countdown timer when test is running
  useEffect(() => {
    if (mode === "running" && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [mode, timeLeft]);

  const handleStartTest = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/assessments/${id}/start`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to start assessment attempt");
      }
      setCurrentAttempt(data.data);
      setMode("running");
      setCurrentQIndex(0);
    } catch (err: any) {
      setError(err.message || "Unable to start assessment.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAnswerSelect = (questionId: string, answer: any, isMulti: boolean = false) => {
    setAnswers((prev) => {
      if (isMulti) {
        const current = Array.isArray(prev[questionId]) ? prev[questionId] : [];
        if (current.includes(answer)) {
          return { ...prev, [questionId]: current.filter((a: string) => a !== answer) };
        } else {
          return { ...prev, [questionId]: [...current, answer] };
        }
      }
      return {
        ...prev,
        [questionId]: answer,
      };
    });
  };

  const handleAutoSubmit = () => {
    handleSubmitTest(true);
  };

  const handleSubmitTest = async (isAuto = false) => {
    if (!currentAttempt) return;
    setSubmitting(true);
    setError(null);

    const formattedAnswers = Object.entries(answers).map(([qId, ans]) => ({
      questionId: qId,
      answer: ans,
    }));

    try {
      const res = await fetch(`/api/assessments/${currentAttempt._id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: formattedAnswers,
          autoSubmitted: isAuto,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to submit assessment answers");
      }

      setResult(data.data);
      setMode("result");
    } catch (err: any) {
      setError(err.message || "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-slate-500 text-sm">
        <div className="animate-spin w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full mr-3" />
        Loading assessment runner...
      </div>
    );
  }

  if (error && !assessment) {
    return (
      <div className="max-w-xl mx-auto text-center py-16">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-2" />
        <h2 className="text-lg font-bold text-slate-900">{error}</h2>
        <Link
          href="/parent/assessments"
          className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Assessments
        </Link>
      </div>
    );
  }

  const questions = assessment?.questions || [];
  const currentQ = questions[currentQIndex];

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  // 1. OVERVIEW SCREEN
  if (mode === "overview") {
    return (
      <div className="max-w-3xl mx-auto flex flex-col gap-6">
        <Link
          href="/parent/assessments"
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> All Assessments
        </Link>

        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-mono">
              {assessment.assessmentCode}
            </span>
            <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full">
              {assessment.status}
            </span>
          </div>

          <h1 className="text-2xl font-extrabold text-slate-900">{assessment.title}</h1>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">{assessment.description}</p>

          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Questions</span>
              <span className="text-lg font-black text-slate-900">{questions.length}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Time Limit</span>
              <span className="text-lg font-black text-slate-900">{assessment.duration || 30} mins</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Max Marks</span>
              <span className="text-lg font-black text-slate-900">{assessment.maximumMarks || 100}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Pass Threshold</span>
              <span className="text-lg font-black text-slate-900">{assessment.passingMarks || 40}%</span>
            </div>
          </div>

          <div className="mt-6 space-y-2 text-xs text-slate-500">
            <p className="font-bold text-slate-700">Important Instructions:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Once you click Start, your timer will begin immediately.</li>
              <li>You can navigate between questions freely and change your responses.</li>
              <li>If the timer expires, your test will be auto-submitted automatically.</li>
            </ul>
          </div>

          {error && (
            <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-xs">
              {error}
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
            <button
              onClick={handleStartTest}
              disabled={submitting}
              className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-100 transition disabled:opacity-50"
            >
              {submitting ? "Initiating Session..." : "Start Assessment Now →"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. RESULT SCREEN
  if (mode === "result") {
    const score = result?.score ?? 0;
    const percentage = result?.percentage ?? 0;
    const isPassing = percentage >= (assessment.passingMarks || 40);

    return (
      <div className="max-w-2xl mx-auto flex flex-col gap-6">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm text-center">
          <div
            className={`w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4 ${
              isPassing ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
            }`}
          >
            <Award className="w-8 h-8" />
          </div>

          <span
            className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full ${
              isPassing ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
            }`}
          >
            {isPassing ? "Assessment Passed" : "Needs Retake"}
          </span>

          <h1 className="text-2xl font-extrabold text-slate-900 mt-3">{assessment.title}</h1>
          <p className="text-xs text-slate-500 mt-1">Assessment results evaluated and logged to your gradebook.</p>

          <div className="mt-6 p-6 rounded-2xl bg-slate-50 border border-slate-100 grid grid-cols-2 gap-4 max-w-sm mx-auto">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Total Score
              </span>
              <span className="text-3xl font-black text-slate-900">{score}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Percentage
              </span>
              <span className={`text-3xl font-black ${isPassing ? "text-emerald-600" : "text-rose-600"}`}>
                {percentage}%
              </span>
            </div>
          </div>

          <div className="mt-8 flex justify-center gap-3">
            <Link
              href="/parent/assessments"
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition"
            >
              View Official Gradebook
            </Link>
            <Link
              href="/parent/assessments"
              className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition"
            >
              Back to Assessments
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 3. RUNNING TEST RUNNER SCREEN
  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      {/* Top Runner Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-between sticky top-20 z-10">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Assessment</span>
          <h2 className="font-bold text-slate-900 text-sm truncate max-w-xs sm:max-w-md">{assessment.title}</h2>
        </div>

        {/* Countdown Timer */}
        <div
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border font-mono font-bold text-sm ${
            timeLeft < 120
              ? "bg-rose-50 border-rose-200 text-rose-700 animate-pulse"
              : "bg-slate-50 border-slate-200 text-slate-800"
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>{formatTimer(timeLeft)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Question Workspace (3 cols) */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
            {currentQ ? (
              <div>
                <div className="flex items-center justify-between gap-2 pb-4 border-b border-slate-100 mb-6">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                    Question {currentQIndex + 1} of {questions.length}
                  </span>
                  <span className="text-xs font-bold text-slate-400">
                    Marks: <strong className="text-slate-800">{currentQ.marks || 5}</strong>
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 leading-snug mb-6 whitespace-pre-wrap">
                  {currentQ.questionText}
                </h3>

                {/* Options Rendering */}
                {currentQ.type === "MCQ" && currentQ.options && (
                  <div className="space-y-3">
                    {currentQ.options.map((opt: string, optIdx: number) => {
                      const isSelected = answers[currentQ.questionBankId || currentQ._id] === opt;
                      return (
                        <label
                          key={optIdx}
                          onClick={() => handleAnswerSelect(currentQ.questionBankId || currentQ._id, opt)}
                          className={`flex items-center gap-3.5 p-4 rounded-2xl border text-xs font-medium cursor-pointer transition ${
                            isSelected
                              ? "bg-indigo-50 border-indigo-600 text-indigo-900 shadow-sm"
                              : "border-slate-200 hover:bg-slate-50 text-slate-700"
                          }`}
                        >
                          <input type="radio" checked={isSelected} readOnly className="text-indigo-600 focus:ring-indigo-500 w-4 h-4" />
                          <span className="flex-1">{opt}</span>
                        </label>
                      );
                    })}
                  </div>
                )}

                {currentQ.type === "multiple-select" && currentQ.options && (
                  <div className="space-y-3">
                    {currentQ.options.map((opt: string, optIdx: number) => {
                      const currentAns = answers[currentQ.questionBankId || currentQ._id] || [];
                      const isSelected = currentAns.includes(opt);
                      return (
                        <label
                          key={optIdx}
                          onClick={(e) => {
                            e.preventDefault();
                            handleAnswerSelect(currentQ.questionBankId || currentQ._id, opt, true);
                          }}
                          className={`flex items-center gap-3.5 p-4 rounded-2xl border text-xs font-medium cursor-pointer transition ${
                            isSelected
                              ? "bg-indigo-50 border-indigo-600 text-indigo-900 shadow-sm"
                              : "border-slate-200 hover:bg-slate-50 text-slate-700"
                          }`}
                        >
                          <input type="checkbox" checked={isSelected} readOnly className="text-indigo-600 focus:ring-indigo-500 w-4 h-4 rounded" />
                          <span className="flex-1">{opt}</span>
                        </label>
                      );
                    })}
                  </div>
                )}

                {currentQ.type === "true-false" && (
                  <div className="flex gap-4">
                    {["True", "False"].map((opt) => {
                      const isSelected = answers[currentQ.questionBankId || currentQ._id] === opt;
                      return (
                        <label
                          key={opt}
                          onClick={() => handleAnswerSelect(currentQ.questionBankId || currentQ._id, opt)}
                          className={`flex-1 flex items-center justify-center gap-3.5 p-4 rounded-2xl border text-sm font-bold cursor-pointer transition ${
                            isSelected
                              ? "bg-indigo-50 border-indigo-600 text-indigo-900 shadow-sm"
                              : "border-slate-200 hover:bg-slate-50 text-slate-700"
                          }`}
                        >
                          <input type="radio" checked={isSelected} readOnly className="text-indigo-600 focus:ring-indigo-500 w-4 h-4" />
                          <span>{opt}</span>
                        </label>
                      );
                    })}
                  </div>
                )}

                {(currentQ.type === "short-answer" || currentQ.type === "fill-in-the-blanks") && (
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">
                      Your Answer:
                    </label>
                    <input
                      type="text"
                      value={answers[currentQ.questionBankId || currentQ._id] || ""}
                      onChange={(e) => handleAnswerSelect(currentQ.questionBankId || currentQ._id, e.target.value)}
                      placeholder="Type your answer here..."
                      className="w-full p-4 rounded-2xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                )}

                {(!currentQ.type || currentQ.type === "essay") && (
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">
                      Your Written Response:
                    </label>
                    <textarea
                      rows={6}
                      value={answers[currentQ.questionBankId || currentQ._id] || ""}
                      onChange={(e) => handleAnswerSelect(currentQ.questionBankId || currentQ._id, e.target.value)}
                      placeholder="Type your structured technical answer or explanation here..."
                      className="w-full p-4 rounded-2xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center py-8">No questions configured for this test.</p>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center">
            <button
              onClick={() => setCurrentQIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentQIndex === 0}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>

            {currentQIndex < questions.length - 1 ? (
              <button
                onClick={() => setCurrentQIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 shadow-sm"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => handleSubmitTest(false)}
                disabled={submitting}
                className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-md shadow-emerald-100 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{submitting ? "Submitting Answers..." : "Finish & Submit Test"}</span>
              </button>
            )}
          </div>
        </div>

        {/* Question Jump Grid (1 col) */}
        <div className="flex flex-col gap-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-4 pb-2 border-b border-slate-100">
              Questions Map
            </h4>

            <div className="grid grid-cols-4 gap-2">
              {questions.map((q: any, idx: number) => {
                const currentAnswer = answers[q.questionBankId || q._id];
                const isAnswered = currentAnswer !== undefined && 
                  (Array.isArray(currentAnswer) ? currentAnswer.length > 0 : String(currentAnswer).trim() !== "");
                const isCurrent = idx === currentQIndex;

                return (
                  <button
                    key={q._id?.toString() || idx}
                    onClick={() => setCurrentQIndex(idx)}
                    className={`h-9 rounded-xl text-xs font-bold transition flex items-center justify-center ${
                      isCurrent
                        ? "bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-400"
                        : isAnswered
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100">
              <button
                onClick={() => handleSubmitTest(false)}
                disabled={submitting}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition disabled:opacity-50"
              >
                Submit Exam
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
