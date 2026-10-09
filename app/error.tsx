"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to telemetry service in production
    console.error("Unhandled runtime boundary error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center text-3xl font-black mb-6">
        !
      </div>
      <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
        Something Went Wrong
      </h1>
      <p className="mt-3 text-slate-500 max-w-md text-base leading-relaxed">
        An unexpected error occurred while processing your request. Our engineering team has been notified.
      </p>
      {error.digest && (
        <p className="mt-2 text-xs font-mono text-slate-400 bg-slate-100 px-3 py-1 rounded-md">
          Error Digest: {error.digest}
        </p>
      )}
      <div className="mt-8 flex gap-4">
        <button
          onClick={() => reset()}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md text-sm transition"
        >
          Try Again
        </button>
        <Link
          href="/"
          className="px-6 py-3 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold rounded-xl text-sm transition"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}
