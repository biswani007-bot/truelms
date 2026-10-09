"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function VerifyContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error" | "no-token">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("no-token");
      return;
    }

    fetch(`/api/public/newsletter?token=${encodeURIComponent(token)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStatus("success");
          setMessage(data.message || "Email verified! Welcome to TrueLern updates.");
        } else {
          setStatus("error");
          setMessage(data.message || "Verification failed. Please try subscribing again.");
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("Something went wrong. Please try again.");
      });
  }, [token]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6 py-24">
      <div className="max-w-md w-full text-center p-10 rounded-2xl bg-white border border-gray-200 shadow-sm">
        {status === "loading" && (
          <>
            <div className="text-4xl mb-4 animate-pulse">📧</div>
            <h1 className="text-xl font-bold text-gray-900">Verifying your email...</h1>
            <p className="text-sm text-gray-400 mt-2">Please wait a moment.</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="text-5xl mb-4">✅</div>
            <h1 className="text-2xl font-extrabold text-gray-900">You&apos;re Subscribed!</h1>
            <p className="text-sm text-gray-500 mt-3 leading-relaxed">{message}</p>
            <Link
              href="/"
              className="mt-6 inline-block px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition"
            >
              Go to Home
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <div className="text-5xl mb-4">❌</div>
            <h1 className="text-2xl font-extrabold text-gray-900">Verification Failed</h1>
            <p className="text-sm text-gray-500 mt-3 leading-relaxed">{message}</p>
            <Link
              href="/newsletter"
              className="mt-6 inline-block px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition"
            >
              Try Subscribing Again
            </Link>
          </>
        )}

        {status === "no-token" && (
          <>
            <div className="text-5xl mb-4">🔗</div>
            <h1 className="text-2xl font-extrabold text-gray-900">Invalid Link</h1>
            <p className="text-sm text-gray-500 mt-3">
              This verification link is invalid or has already been used.
            </p>
            <Link
              href="/newsletter"
              className="mt-6 inline-block px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition"
            >
              Subscribe Again
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function NewsletterVerifyPage() {
  return (
    <Suspense>
      <VerifyContent />
    </Suspense>
  );
}
