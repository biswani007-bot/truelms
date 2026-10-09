"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CourseSelector } from "@/components/admissions/CourseSelector";

function ApplyForm() {
  const searchParams = useSearchParams();
  const preselectedCourseSlug = searchParams.get("course") || "";
  const preselectedCohort = searchParams.get("cohort") || "";

  const [selectedCourse, setSelectedCourse] = useState<{
    _id: string;
    courseCode: string;
    courseName: string;
    slug: string;
    pricing: {
      price: number;
      discountPrice?: number;
      currency: string;
      displayPrice: number;
    };
  } | null>(null);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    courseSlug: preselectedCourseSlug,
    experience: "",
    source: "apply-form",
    message: "",
  });

  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  // Update courseSlug if searchParam changes after mount
  useEffect(() => {
    if (preselectedCourseSlug) {
      setForm((prev) => ({ ...prev, courseSlug: preselectedCourseSlug }));
    }
  }, [preselectedCourseSlug]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSelectCourse = (course: any) => {
    setSelectedCourse(course);
    setForm((prev) => ({ ...prev, courseSlug: course.slug }));
  };

  const handleClearCourse = () => {
    setSelectedCourse(null);
    setForm((prev) => ({ ...prev, courseSlug: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.courseSlug) {
      setStatus("error");
      setErrorMsg("Please select a course from the catalog to continue.");
      return;
    }

    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/public/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone,
          message: form.message,
          courseSlug: form.courseSlug,
          courseId: selectedCourse?._id,
          experience: form.experience,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || "Application submission failed.");
      }

      if (data?.data?.checkoutToken) {
        window.location.href = `/checkout?session=${encodeURIComponent(data.data.checkoutToken)}`;
        return;
      }

      setStatus("success");
    } catch (err: unknown) {
      setStatus("error");
      setErrorMsg(
        err instanceof Error ? err.message : "An error occurred. Please try again."
      );
    }
  };

  if (status === "success") {
    return (
      <div className="min-h-[50vh] flex items-center justify-center px-6 py-24">
        <div className="max-w-lg w-full text-center p-10 rounded-3xl bg-white border border-gray-200 shadow-lg">
          <div className="text-6xl mb-5">🎉</div>
          <h2 className="text-2xl font-extrabold text-gray-900">
            Application Submitted!
          </h2>
          <p className="mt-4 text-gray-500 leading-relaxed">
            Thank you for applying to TrueLern. Our admissions team will review
            your application and contact you within{" "}
            <strong>24–48 hours</strong> to schedule a brief call.
          </p>
          <div className="mt-6 text-sm text-gray-400">
            Reference email:{" "}
            <span className="font-semibold text-gray-700">{form.email}</span>
          </div>
          <Link
            href="/programs"
            className="mt-8 inline-block px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition"
          >
            View Open Programs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0 pb-24">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-indigo-50 via-white to-violet-50 pt-20 pb-14 px-6 text-center overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:40px_40px] opacity-30 pointer-events-none" />
        <div className="relative max-w-3xl mx-auto">
          <nav className="text-sm text-gray-400 flex items-center justify-center gap-2 mb-5">
            <Link href="/" className="hover:text-gray-700 transition">Home</Link>
            <span>/</span>
            <Link href="/admissions" className="hover:text-gray-700 transition">Admissions</Link>
            <span>/</span>
            <span className="text-gray-700 font-medium">Apply</span>
          </nav>
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
            Apply to{" "}
            <span className="text-indigo-600">TrueLern</span>
          </h1>
          <p className="mt-5 text-lg text-gray-500 max-w-xl mx-auto leading-relaxed">
            Fill out the form below. An admissions counsellor will contact you
            within 24–48 hours to discuss your application.
          </p>
        </div>
      </section>

      {/* Form */}
      <section className="max-w-3xl mx-auto px-6 py-16 w-full">
        <form
          onSubmit={handleSubmit}
          className="p-8 md:p-12 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-6"
        >
          <div>
            <h2 className="text-xl font-bold text-gray-900">Personal Information</h2>
            <p className="text-sm text-gray-400 mt-1">
              Tell us about yourself so we can tailor the right cohort for you.
            </p>
          </div>

          {/* Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label
                htmlFor="apply-firstName"
                className="block text-xs font-semibold text-gray-500 mb-1"
              >
                First Name *
              </label>
              <input
                id="apply-firstName"
                name="firstName"
                type="text"
                required
                value={form.firstName}
                onChange={handleChange}
                placeholder="Sarah"
                className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 focus:border-indigo-500 focus:outline-none text-gray-800 text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="apply-lastName"
                className="block text-xs font-semibold text-gray-500 mb-1"
              >
                Last Name *
              </label>
              <input
                id="apply-lastName"
                name="lastName"
                type="text"
                required
                value={form.lastName}
                onChange={handleChange}
                placeholder="Connor"
                className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 focus:border-indigo-500 focus:outline-none text-gray-800 text-sm"
              />
            </div>
          </div>

          {/* Email + Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label
                htmlFor="apply-email"
                className="block text-xs font-semibold text-gray-500 mb-1"
              >
                Email Address *
              </label>
              <input
                id="apply-email"
                name="email"
                type="email"
                required
                value={form.email}
                onChange={handleChange}
                placeholder="sarah@example.com"
                className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 focus:border-indigo-500 focus:outline-none text-gray-800 text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="apply-phone"
                className="block text-xs font-semibold text-gray-500 mb-1"
              >
                Phone Number *
              </label>
              <input
                id="apply-phone"
                name="phone"
                type="tel"
                required
                value={form.phone}
                onChange={handleChange}
                placeholder="+1 555 000 0000"
                className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 focus:border-indigo-500 focus:outline-none text-gray-800 text-sm"
              />
            </div>
          </div>

          {/* Divider */}
          <hr className="border-gray-100" />
          <div>
            <h2 className="text-lg font-bold text-gray-900">Program Preferences</h2>
          </div>

          {/* Course Selector */}
          <div>
            <CourseSelector
              selectedCourseSlug={form.courseSlug}
              onSelectCourse={handleSelectCourse}
              onClearCourse={handleClearCourse}
            />
          </div>

          {/* Experience level */}
          <div>
            <label
              htmlFor="apply-experience"
              className="block text-xs font-semibold text-gray-500 mb-1"
            >
              Programming Experience Level
            </label>
            <select
              id="apply-experience"
              name="experience"
              value={form.experience}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 focus:border-indigo-500 focus:outline-none text-gray-700 text-sm"
            >
              <option value="">Select level</option>
              <option value="beginner">Beginner (&lt;1 year)</option>
              <option value="intermediate">Intermediate (1–3 years)</option>
              <option value="advanced">Advanced (3–5 years)</option>
              <option value="expert">Expert (5+ years)</option>
            </select>
          </div>

          {/* Message */}
          <div>
            <label
              htmlFor="apply-message"
              className="block text-xs font-semibold text-gray-500 mb-1"
            >
              Why do you want to join TrueLern? *
            </label>
            <textarea
              id="apply-message"
              name="message"
              rows={4}
              required
              value={form.message}
              onChange={handleChange}
              placeholder="Tell us about your learning goals, career objectives, and what you hope to achieve..."
              className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 focus:border-indigo-500 focus:outline-none text-gray-800 text-sm resize-none"
            />
          </div>

          {/* Error */}
          {status === "error" && (
            <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 px-4 py-3 rounded-lg">
              {errorMsg}
            </p>
          )}

          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold text-sm rounded-xl shadow-md shadow-indigo-300/30 transition"
          >
            {status === "loading" ? "Submitting Application..." : "Submit Application"}
          </button>

          <p className="text-center text-xs text-gray-400">
            By submitting, you agree to our{" "}
            <Link href="/privacy-policy" className="text-indigo-600 hover:underline">
              Privacy Policy
            </Link>
            . We will never share your data.
          </p>
        </form>
      </section>
    </div>
  );
}

export default function ApplyPage() {
  return (
    <Suspense>
      <ApplyForm />
    </Suspense>
  );
}
