import React from "react";
import Link from "next/link";

export const metadata = {
  title: "Admissions",
  description:
    "Learn about the TrueLern admissions process, eligibility requirements, fees, and how to apply for our live cohort programs.",
  openGraph: {
    title: "Admissions | TrueLern",
    description: "Apply to TrueLern live cohort programs. Learn about eligibility, fees, and our admissions process.",
  },
};

const PROCESS_STEPS = [
  {
    step: "01",
    title: "Submit Application",
    desc: "Fill out your application form with your details, course preference, and a brief statement about your learning goals.",
    icon: "📝",
  },
  {
    step: "02",
    title: "Counsellor Review",
    desc: "An admissions counsellor reviews your application and contacts you within 24–48 hours to schedule a brief call.",
    icon: "👤",
  },
  {
    step: "03",
    title: "Demo Session",
    desc: "Attend a complimentary 30-minute demo session to experience the live cohort environment first-hand.",
    icon: "🎥",
  },
  {
    step: "04",
    title: "Enrollment Offer",
    desc: "Receive your enrollment offer with cohort details, schedule, and payment information.",
    icon: "📋",
  },
  {
    step: "05",
    title: "Payment & Confirmation",
    desc: "Complete payment to secure your seat. Flexible installment plans are available.",
    icon: "💳",
  },
  {
    step: "06",
    title: "Onboarding",
    desc: "Receive your platform access, orientation materials, and join the cohort Slack community.",
    icon: "🚀",
  },
];

const ELIGIBILITY = [
  "Basic programming knowledge (any language)",
  "Reliable internet connection for live sessions",
  "Minimum 10 hours per week commitment",
  "Strong motivation to learn and collaborate",
  "No formal degree requirement",
];

const IMPORTANT_DATES = [
  { event: "Cohort 13 Applications Open", date: "August 1, 2025" },
  { event: "Early Decision Deadline", date: "August 20, 2025" },
  { event: "Final Application Deadline", date: "September 5, 2025" },
  { event: "Cohort 13 Orientation", date: "September 15, 2025" },
  { event: "Cohort 13 Start Date", date: "September 22, 2025" },
];

export default function AdmissionsPage() {
  return (
    <div className="flex flex-col gap-20 pb-24">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-indigo-50 via-white to-violet-50 pt-20 pb-14 px-6 text-center overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:40px_40px] opacity-30 pointer-events-none" />
        <div className="relative max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
            Start Your{" "}
            <span className="text-indigo-600">Journey</span>
          </h1>
          <p className="mt-5 text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
            Our admissions process is straightforward and designed to ensure
            every cohort member is set up for success from day one.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/admissions/apply"
              className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-300/50 text-sm transition"
            >
              Apply Now
            </Link>
            <Link
              href="/programs"
              className="px-8 py-4 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 font-semibold rounded-xl shadow-sm text-sm transition"
            >
              View Open Programs
            </Link>
          </div>
        </div>
      </section>

      {/* Admissions Process */}
      <section className="max-w-7xl mx-auto px-6 w-full">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-extrabold text-gray-900">Admissions Process</h2>
          <p className="mt-3 text-gray-500 max-w-xl mx-auto">
            From application to your first live session — here&apos;s how it works.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {PROCESS_STEPS.map((step) => (
            <div
              key={step.step}
              className="p-8 rounded-2xl bg-white border border-gray-200 hover:border-indigo-200 hover:shadow-lg transition-all duration-300"
            >
              <div className="flex items-center gap-4 mb-5">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-xl">
                  {step.icon}
                </div>
                <span className="text-3xl font-black text-indigo-100 select-none">
                  {step.step}
                </span>
              </div>
              <h3 className="text-lg font-bold text-gray-900">{step.title}</h3>
              <p className="mt-2 text-gray-500 text-sm leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Eligibility + Dates */}
      <section className="max-w-7xl mx-auto px-6 w-full grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Eligibility */}
        <div className="p-8 rounded-2xl bg-white border border-gray-200">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-6">Eligibility</h2>
          <ul className="space-y-4">
            {ELIGIBILITY.map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                <span className="mt-0.5 text-indigo-500 font-bold">✓</span>
                {item}
              </li>
            ))}
          </ul>
          <div className="mt-6 p-4 rounded-xl bg-indigo-50 border border-indigo-100 text-xs text-indigo-700 font-medium">
            ℹ️ &nbsp;We welcome learners of all backgrounds. What matters most is
            your drive to learn and contribute.
          </div>
        </div>

        {/* Important Dates */}
        <div className="p-8 rounded-2xl bg-white border border-gray-200">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-6">Important Dates</h2>
          <div className="space-y-4">
            {IMPORTANT_DATES.map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
              >
                <span className="text-sm text-gray-700 font-medium">{item.event}</span>
                <span className="text-sm font-bold text-indigo-600 shrink-0 ml-4">
                  {item.date}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Fees & Scholarships */}
      <section className="max-w-7xl mx-auto px-6 w-full">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-gray-900">Fees & Scholarships</h2>
          <p className="mt-3 text-gray-500 max-w-xl mx-auto">
            We believe in fair, transparent pricing. Scholarships are available for
            qualifying learners.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              title: "Flexible Installments",
              icon: "📅",
              desc: "Split your cohort fee into 2–3 monthly installments at no additional charge.",
            },
            {
              title: "Need-Based Scholarships",
              icon: "🎓",
              desc: "Up to 40% fee reduction for qualifying learners demonstrating financial need.",
            },
            {
              title: "Team Discounts",
              icon: "👥",
              desc: "Organizations enrolling 3+ learners in the same cohort receive a 15% team discount.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="p-8 rounded-2xl bg-white border border-gray-200 text-center hover:border-indigo-200 hover:shadow-lg transition-all"
            >
              <div className="text-4xl mb-4">{item.icon}</div>
              <h3 className="text-lg font-bold text-gray-900">{item.title}</h3>
              <p className="mt-3 text-gray-500 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-4xl mx-auto px-6 w-full">
        <div className="rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-700 p-12 text-center shadow-xl shadow-indigo-300/30">
          <h2 className="text-3xl font-extrabold text-white">
            Ready to Apply?
          </h2>
          <p className="mt-4 text-indigo-100 text-sm max-w-xl mx-auto">
            Secure your seat in the next cohort. Spots are strictly limited to 50
            learners per batch.
          </p>
          <Link
            href="/admissions/apply"
            className="mt-8 inline-block px-10 py-4 bg-white hover:bg-gray-100 text-indigo-700 font-bold rounded-xl shadow-sm text-sm transition"
          >
            Start Application →
          </Link>
        </div>
      </section>
    </div>
  );
}
