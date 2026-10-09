/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import Link from "next/link";
import { pageRepository } from "../../../repositories/page.repository";
import { connectDB } from "../../../config/db";

export const revalidate = 300;

export const metadata = {
  title: "Cookie Policy",
  description:
    "Learn how TrueLern uses cookies and similar tracking technologies on our platform and public website.",
};

export default async function CookiePolicyPage() {
  await connectDB();

  let page: any = null;
  try {
    page = await pageRepository.findOne({ slug: "cookie-policy", status: "PUBLISHED" });
  } catch {
    page = null;
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <nav className="text-sm text-gray-400 flex items-center gap-2 mb-8">
        <Link href="/" className="hover:text-gray-700 transition">Home</Link>
        <span>/</span>
        <span className="text-gray-700 font-medium">Cookie Policy</span>
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
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900">Cookie Policy</h1>
          <p className="text-sm text-gray-400 mt-1 mb-8">Last updated: July 2026</p>

          <p>
            This Cookie Policy explains how TrueLern uses cookies and similar tracking
            technologies on our website and platform.
          </p>

          <h2>1. What Are Cookies?</h2>
          <p>
            Cookies are small text files placed on your device when you visit a website.
            They help the website remember your preferences, keep you logged in, and
            understand how you use the platform.
          </p>

          <h2>2. Types of Cookies We Use</h2>

          <h3>Essential Cookies</h3>
          <p>
            These cookies are strictly necessary to operate the platform. They manage
            your authentication session and security tokens. Without these, the
            platform cannot function. These cannot be disabled.
          </p>

          <h3>Analytics Cookies</h3>
          <p>
            We use Google Analytics to understand how visitors use our public website.
            This data is anonymised and used to improve content and user experience.
            You can opt out via your browser settings or the Google Analytics opt-out tool.
          </p>

          <h3>Marketing Cookies</h3>
          <p>
            We may use cookies to track the effectiveness of our marketing campaigns,
            including UTM parameters from advertising platforms. These are only used in
            aggregate form.
          </p>

          <h2>3. Managing Cookies</h2>
          <p>
            You can control cookies through your browser settings. Please note that
            disabling essential cookies will prevent you from logging in to the platform.
            Visit <a href="https://www.aboutcookies.org" target="_blank" rel="noopener noreferrer">aboutcookies.org</a>{" "}
            for guidance on managing cookies in your browser.
          </p>

          <h2>4. Third-Party Cookies</h2>
          <p>
            Our website may include content from third-party services (such as embedded
            videos or social media widgets) that set their own cookies. We have no control
            over these cookies. Please refer to the respective third-party privacy policies.
          </p>

          <h2>5. Updates to This Policy</h2>
          <p>
            We may update this Cookie Policy from time to time. Any changes will be
            reflected on this page with an updated date.
          </p>

          <h2>6. Contact</h2>
          <p>
            Questions? Email us at{" "}
            <a href="mailto:privacy@lmsca.com">privacy@lmsca.com</a>.
          </p>
        </div>
      )}
    </div>
  );
}
