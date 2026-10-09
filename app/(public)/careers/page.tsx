import React from "react";

export const metadata = {
  title: "Careers | TrueLern",
  description: "Join us in redefining cohort-based technical education worldwide.",
};

export default function CareersPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16 text-center">
      <h1 className="text-4xl font-extrabold text-slate-900">Careers at TrueLern</h1>
      <p className="mt-4 text-gray-500">Join our team of builders, designers, and educators shaping live-cohort digital pipelines.</p>
      <div className="mt-12 p-8 rounded-2xl bg-white border border-gray-200 text-gray-400">
        We currently do not have any open positions. Check back next quarter!
      </div>
    </div>
  );
}
