/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import Link from "next/link";
import { pageRepository } from "../../../repositories/page.repository";
import { connectDB } from "../../../config/db";

export const revalidate = 300;

export const metadata = {
  title: "Terms of Service",
  description:
    "Read the TrueLern terms of service governing your use of the platform, cohort programs, and related services.",
  openGraph: {
    title: "Terms of Service | TrueLern",
    description: "TrueLern platform terms of service and enrollment conditions.",
  },
};

export default async function TermsPage() {
  await connectDB();

  let page: any = null;
  try {
    page = await pageRepository.findOne({ slug: "terms-of-service", status: "PUBLISHED" });
  } catch {
    page = null;
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <nav className="text-sm text-gray-400 flex items-center gap-2 mb-8">
        <Link href="/" className="hover:text-gray-700 transition">Home</Link>
        <span>/</span>
        <span className="text-gray-700 font-medium">Terms of Service</span>
      </nav>

      {page ? (
        <>
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900">
              {page.seoTitle || page.title}
            </h1>
            {page.publishedDate && (
              <p className="text-sm text-gray-400 mt-2">
                Last updated:{" "}
                {new Date(page.publishedDate).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            )}
          </div>
          <div
            className="prose prose-lg max-w-none text-gray-600 prose-headings:text-gray-900 prose-a:text-indigo-600"
            dangerouslySetInnerHTML={{ __html: page.content }}
          />
        </>
      ) : (
        <div className="prose prose-lg max-w-none text-gray-600 prose-headings:text-gray-900">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900">Terms of Service</h1>
          <p className="text-sm text-gray-400 mt-1 mb-8">Last updated: July 2026</p>

          <p>
            By accessing or using the TrueLern platform and enrolling in any live cohort program,
            you agree to be bound by these Terms of Service. Please read them carefully.
          </p>

          <h2>1. Acceptable Use</h2>
          <p>
            You agree to use the platform only for lawful purposes and in accordance with
            these Terms. You must not use the platform in any way that violates applicable
            local, national, or international law or regulation.
          </p>
          <ul>
            <li>Respect academic integrity in all assignments and assessments</li>
            <li>Do not share your account credentials with others</li>
            <li>Treat fellow learners and instructors with respect</li>
            <li>Do not record or redistribute live class content without permission</li>
          </ul>

          <h2>2. Enrollment & Access</h2>
          <p>
            Upon enrollment, you receive access to the cohort materials, live class sessions,
            and collaboration tools for the duration of your cohort. Access is non-transferable
            and may not be shared.
          </p>

          <h2>3. Intellectual Property</h2>
          <p>
            All course materials, recordings, assessments, and platform content are owned by
            TrueLern or its licensors. You may not reproduce, distribute, or create derivative
            works without express written consent.
          </p>

          <h2>4. Payments & Refunds</h2>
          <p>
            All fees are due as specified at enrollment. For refund eligibility, see our{" "}
            <Link href="/refund-policy">Refund Policy</Link>.
          </p>

          <h2>5. Termination</h2>
          <p>
            We reserve the right to suspend or terminate access for users who violate these
            Terms, engage in academic dishonesty, or engage in disruptive behaviour in
            community channels.
          </p>

          <h2>6. Limitation of Liability</h2>
          <p>
            TrueLern is not liable for any indirect, incidental, or consequential damages arising
            from your use of the platform. Our total liability shall not exceed the amount
            paid by you for the applicable cohort.
          </p>

          <h2>7. Governing Law</h2>
          <p>
            These Terms are governed by the laws of the State of California, USA, without
            regard to conflict of law principles.
          </p>

          <h2>8. Contact</h2>
          <p>
            For questions about these Terms, contact us at{" "}
            <a href="mailto:legal@lmsca.com">legal@lmsca.com</a>.
          </p>
        </div>
      )}

      <div className="mt-12 p-5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-600">
        Questions about these terms?{" "}
        <Link href="/contact" className="text-indigo-600 underline hover:text-indigo-900">
          Contact our legal team
        </Link>.
      </div>
    </div>
  );
}
