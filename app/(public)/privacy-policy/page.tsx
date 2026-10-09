/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import Link from "next/link";
import { pageRepository } from "../../../repositories/page.repository";
import { connectDB } from "../../../config/db";

export const revalidate = 300;

export const metadata = {
  title: "Privacy Policy",
  description:
    "Read our privacy policy regarding data collection, storage, and user rights at TrueLern.",
};

export default async function PrivacyPolicyPage() {
  await connectDB();

  let page: any = null;
  try {
    page = await pageRepository.findOne({ slug: "privacy-policy", status: "PUBLISHED" });
  } catch {
    page = null;
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-400 flex items-center gap-2 mb-8">
        <Link href="/" className="hover:text-gray-700 transition">Home</Link>
        <span>/</span>
        <span className="text-gray-700 font-medium">Privacy Policy</span>
      </nav>

      {page ? (
        <>
          {/* CMS-driven content */}
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
        // Fallback static content — replace with CMS page when available
        <div className="prose prose-lg max-w-none text-gray-600 prose-headings:text-gray-900">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900">Privacy Policy</h1>
          <p className="text-sm text-gray-400 mt-1 mb-8">Last updated: July 2026</p>

          <p>
            At TrueLern, we take your privacy and data security seriously. This Privacy Policy
            explains how we collect, process, store, and protect your personal data when you
            use our platform.
          </p>

          <h2>1. Information We Collect</h2>
          <p>
            We collect information you provide directly — such as your name, email address,
            phone number, and payment details during registration and enrollment. We also
            collect usage data including pages visited, features used, and session duration
            to improve the platform experience.
          </p>

          <h2>2. How We Use Your Information</h2>
          <ul>
            <li>To create and manage your learner account</li>
            <li>To process enrollment and payment transactions</li>
            <li>To deliver live cohort classes and course materials</li>
            <li>To send administrative notifications and class reminders</li>
            <li>To generate certificates of completion</li>
            <li>To improve platform features and user experience</li>
          </ul>

          <h2>3. Data Sharing</h2>
          <p>
            We do not sell your personal information. We may share data with trusted
            third-party service providers (e.g. payment processors, cloud hosting) strictly
            to operate the platform. All third parties are bound by data processing agreements.
          </p>

          <h2>4. Data Retention</h2>
          <p>
            We retain your account data for the duration of your active account plus 7 years
            for compliance purposes. Certificate records are retained indefinitely for
            verification purposes.
          </p>

          <h2>5. Your Rights</h2>
          <p>
            You have the right to access, correct, or delete your personal data. To exercise
            these rights, contact us at{" "}
            <a href="mailto:privacy@lmsca.com">privacy@lmsca.com</a>.
          </p>

          <h2>6. Cookie Policy</h2>
          <p>
            We use essential cookies for authentication and session management. See our{" "}
            <Link href="/cookie-policy">Cookie Policy</Link> for full details.
          </p>

          <h2>7. Contact Us</h2>
          <p>
            For privacy-related inquiries, contact our Data Protection Officer at{" "}
            <a href="mailto:privacy@lmsca.com">privacy@lmsca.com</a>.
          </p>
        </div>
      )}

      {/* Footer note */}
      <div className="mt-12 p-5 rounded-xl bg-indigo-50 border border-indigo-100 text-sm text-indigo-700">
        <strong>Questions?</strong> Contact us at{" "}
        <a href="mailto:privacy@lmsca.com" className="underline hover:text-indigo-900">
          privacy@lmsca.com
        </a>
        {" "}or visit our{" "}
        <Link href="/contact" className="underline hover:text-indigo-900">
          Contact page
        </Link>.
      </div>
    </div>
  );
}
