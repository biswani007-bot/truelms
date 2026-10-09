"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Sparkles, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";

const PORTAL_CONFIG: Record<
  string,
  { title: string; subtitle: string; buttonText: string; placeholder: string }
> = {
  student: {
    title: "Student Portal",
    subtitle: "Sign in to access your courses, live classes, and assignments",
    buttonText: "Sign In to Student Portal",
    placeholder: "student@example.com",
  },
  faculty: {
    title: "Faculty Portal",
    subtitle: "Sign in to manage your batches, attendance, and live classes",
    buttonText: "Sign In to Faculty Portal",
    placeholder: "faculty@truelern.com",
  },
  parent: {
    title: "Parent Portal",
    subtitle: "Sign in to view your child's academic progress, attendance, and reports",
    buttonText: "Sign In to Parent Portal",
    placeholder: "parent@example.com",
  },
  admin: {
    title: "Admin Workspace",
    subtitle: "Sign in to manage operations, users, and platform settings",
    buttonText: "Sign In to Admin Workspace",
    placeholder: "admin@truelern.com",
  },
};

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const handoffToken = searchParams.get("handoff") || "";
  const portalParam = (searchParams.get("portal") || "").toLowerCase();
  const portalInfo = PORTAL_CONFIG[portalParam];

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [handoffContext, setHandoffContext] = useState<{
    firstName: string;
    studentId?: string;
    courseName?: string;
  } | null>(null);
  const [verifyingHandoff, setVerifyingHandoff] = useState(!!handoffToken);

  // Retrieve authorized handoff context if token present in URL
  useEffect(() => {
    if (!handoffToken) {
      setVerifyingHandoff(false);
      return;
    }

    async function verifyHandoff() {
      try {
        const res = await fetch(`/api/auth/handoff?token=${encodeURIComponent(handoffToken)}`);
        const json = await res.json();
        if (res.ok && json.data) {
          setEmail(json.data.email || "");
          setHandoffContext({
            firstName: json.data.firstName || "Student",
            studentId: json.data.studentId,
            courseName: json.data.courseName,
          });
        } else {
          setError(json.message || "Handoff session expired or invalid. Please sign in directly.");
        }
      } catch {
        setError("Could not verify enrollment login session.");
      } finally {
        setVerifyingHandoff(false);
      }
    }

    verifyHandoff();
  }, [handoffToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Invalid credentials");
      }

      const role = (data.data?.user?.role?.name || "").toLowerCase();

      // Authoritative redirect based purely on authenticated user's actual role
      if (
        [
          "super-admin",
          "admin",
          "superadmin",
          "operations-manager",
          "academic-manager",
          "finance-manager",
        ].includes(role)
      ) {
        router.push("/admin");
      } else if (role === "teacher") {
        router.push("/teacher/dashboard");
      } else if (role === "parent") {
        router.push("/parent/dashboard");
      } else {
        router.push("/student/dashboard");
      }
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (verifyingHandoff) {
    return (
      <div className="py-8 text-center text-slate-500 text-xs flex flex-col items-center gap-3">
        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <span>Authorizing enrollment login context...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Portal Context Banner if portal query provided */}
      {portalInfo && !handoffContext && (
        <div className="p-3 bg-indigo-50/80 border border-indigo-100 rounded-xl text-center">
          <span className="text-xs font-semibold text-indigo-700">
            {portalInfo.title}
          </span>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {portalInfo.subtitle}
          </p>
        </div>
      )}

      {/* Student Enrollment Verified Banner */}
      {handoffContext && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-left">
          <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs mb-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Welcome, {handoffContext.firstName}!</span>
          </div>
          <p className="text-[11px] text-emerald-700 leading-relaxed">
            Your enrollment in <strong>{handoffContext.courseName || "your program"}</strong> is confirmed.
            Please enter your password below to access the Student Portal.
          </p>
          {handoffContext.studentId && (
            <div className="mt-2 text-[10px] font-mono text-emerald-600">
              Student ID: {handoffContext.studentId}
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2 font-medium">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
          Email Address
        </label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={portalInfo?.placeholder || "you@example.com"}
          className="w-full px-4 py-3 bg-white border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 rounded-xl text-sm text-slate-900 placeholder-slate-400 outline-none transition"
        />
      </div>

      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
            Password
          </label>
        </div>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="w-full px-4 py-3 bg-white border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 rounded-xl text-sm text-slate-900 placeholder-slate-400 outline-none transition"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white rounded-xl text-sm font-bold transition shadow-md shadow-indigo-300/30 disabled:opacity-50 mt-1 flex items-center justify-center gap-2 cursor-pointer"
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Signing In...</span>
          </>
        ) : (
          <>
            <span>{portalInfo?.buttonText || "Sign In to TrueLern"}</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>

      <div className="relative flex items-center py-2">
        <div className="flex-grow border-t border-slate-200"></div>
        <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-medium uppercase tracking-wider">or</span>
        <div className="flex-grow border-t border-slate-200"></div>
      </div>

      <button
        type="button"
        onClick={() => window.location.href = "/api/auth/oauth/google"}
        disabled={loading}
        className="w-full py-3 bg-white hover:bg-slate-50 border border-slate-200 active:scale-[0.99] text-slate-700 rounded-xl text-sm font-bold transition shadow-sm disabled:opacity-50 flex items-center justify-center gap-3 cursor-pointer"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
        Sign in with Google
      </button>

      <button
        type="button"
        onClick={() => window.location.href = "/api/auth/oauth/microsoft"}
        disabled={loading}
        className="w-full py-3 bg-white hover:bg-slate-50 border border-slate-200 active:scale-[0.99] text-slate-700 rounded-xl text-sm font-bold transition shadow-sm disabled:opacity-50 flex items-center justify-center gap-3 cursor-pointer mt-3"
      >
        <svg className="w-5 h-5" viewBox="0 0 21 21">
          <path fill="#f25022" d="M1 1h9v9H1z" />
          <path fill="#7fba00" d="M11 1h9v9h-9z" />
          <path fill="#00a4ef" d="M1 11h9v9H1z" />
          <path fill="#ffb900" d="M11 11h9v9h-9z" />
        </svg>
        Sign in with Microsoft
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="py-8 text-center text-slate-500 text-xs">Loading sign in...</div>}>
      <LoginForm />
    </Suspense>
  );
}
