"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function NewsletterPage() {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/public/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, firstName, source: "newsletter-page" }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Subscription failed");

      setStatus("success");
      setMessage(data.message || "Thank you! Please check your email to confirm your subscription.");
      setEmail("");
      setFirstName("");
    } catch (err: unknown) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  };

  return (
    <div className="flex flex-col gap-0 pb-24">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-indigo-50 via-white to-violet-50 pt-20 pb-14 px-6 text-center overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:40px_40px] opacity-30 pointer-events-none" />
        <div className="relative max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold px-4 py-1.5 rounded-full mb-5">
            📬 Weekly insights — free
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
            Stay Ahead with{" "}
            <span className="text-indigo-600">TrueLern Updates</span>
          </h1>
          <p className="mt-5 text-lg text-gray-500 max-w-xl mx-auto leading-relaxed">
            Get the latest on new cohorts, engineering insights, career resources, and
            exclusive early access offers delivered to your inbox.
          </p>
        </div>
      </section>

      {/* Form */}
      <section className="max-w-xl mx-auto px-6 py-16 w-full">
        {status === "success" ? (
          <div className="p-8 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-xl font-bold text-emerald-800">Check Your Inbox!</h2>
            <p className="mt-3 text-sm text-emerald-700 leading-relaxed">{message}</p>
            <p className="mt-4 text-xs text-emerald-600">
              Don&apos;t see it? Check your spam folder and mark us as safe.
            </p>
            <Link
              href="/"
              className="mt-6 inline-block px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition"
            >
              Back to Home
            </Link>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="p-8 md:p-10 bg-white border border-gray-200 rounded-2xl shadow-sm space-y-5"
          >
            <div>
              <h2 className="text-xl font-bold text-gray-900">Subscribe to Updates</h2>
              <p className="text-sm text-gray-400 mt-1">No spam. Unsubscribe anytime.</p>
            </div>

            <div>
              <label htmlFor="nl-firstName" className="block text-xs font-semibold text-gray-500 mb-1">
                First Name
              </label>
              <input
                id="nl-firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Sarah"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:outline-none text-sm text-gray-800"
              />
            </div>

            <div>
              <label htmlFor="nl-email" className="block text-xs font-semibold text-gray-500 mb-1">
                Email Address *
              </label>
              <input
                id="nl-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="sarah@example.com"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:outline-none text-sm text-gray-800"
              />
            </div>

            {status === "error" && (
              <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 px-4 py-3 rounded-lg">
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold text-sm rounded-xl shadow-md shadow-indigo-300/30 transition"
            >
              {status === "loading" ? "Subscribing..." : "Subscribe Now"}
            </button>

            <p className="text-center text-xs text-gray-400">
              By subscribing, you agree to receive emails from TrueLern. View our{" "}
              <Link href="/privacy-policy" className="text-indigo-600 hover:underline">
                Privacy Policy
              </Link>.
            </p>
          </form>
        )}

        {/* What you get */}
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: "🚀", label: "New Cohorts", desc: "Be first to know about upcoming programs" },
            { icon: "💡", label: "Tech Insights", desc: "Engineering blogs and industry analysis" },
            { icon: "🎓", label: "Career Tips", desc: "Interview prep, portfolio advice, job alerts" },
          ].map((item) => (
            <div key={item.label} className="p-5 bg-white border border-gray-200 rounded-xl text-center">
              <div className="text-2xl mb-2">{item.icon}</div>
              <p className="text-sm font-bold text-gray-800">{item.label}</p>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
