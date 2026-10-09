import React from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50/70 p-4 font-sans">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-8 shadow-xl">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center justify-center mb-4">
            <img
              src="/TrueLernLogo_horizontal.png"
              alt="TrueLern"
              className="h-12 w-auto object-contain"
            />
          </Link>
          <h2 className="text-xl font-bold text-slate-900">
            Sign In to TrueLern
          </h2>
          <p className="text-xs text-slate-500 mt-1">Access your courses, faculty portal, or admin workspace</p>
        </div>
        {children}
      </div>
    </div>
  );
}
