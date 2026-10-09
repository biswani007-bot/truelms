/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import Link from "next/link";
import { pageRepository } from "../../../repositories/page.repository";
import { connectDB } from "../../../config/db";

export const revalidate = 300;

export const metadata = {
  title: "Refund Policy",
  description:
    "Learn about the TrueLern cohort cancellation and refund policy including eligibility windows and procedures.",
};

export default async function RefundPolicyPage() {
  await connectDB();

  let page: any = null;
  try {
    page = await pageRepository.findOne({ slug: "refund-policy", status: "PUBLISHED" });
  } catch {
    page = null;
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <nav className="text-sm text-gray-400 flex items-center gap-2 mb-8">
        <Link href="/" className="hover:text-gray-700 transition">Home</Link>
        <span>/</span>
        <span className="text-gray-700 font-medium">Refund Policy</span>
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
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900">Refund Policy</h1>
          <p className="text-sm text-gray-400 mt-1 mb-8">Last updated: July 2026</p>

          <p>
            We are committed to delivering a high-quality learning experience. If for any
            reason you are not satisfied, our refund policy is designed to be fair and
            transparent.
          </p>

          <h2>1. Full Refund Window</h2>
          <p>
            You are eligible for a <strong>100% full refund</strong> if you request it
            at least <strong>24 hours before the second live lecture</strong> of your
            enrolled cohort. No questions asked.
          </p>

          <h2>2. Partial Refund Window</h2>
          <p>
            Requests made after the second live lecture but before the end of Week 2 are
            eligible for a <strong>50% partial refund</strong>, minus any applicable
            processing fees.
          </p>

          <h2>3. No Refund Period</h2>
          <p>
            No refunds are issued after the completion of Week 2 of your cohort, as
            substantial course content and faculty time will have been delivered.
          </p>

          <h2>4. How to Request a Refund</h2>
          <ol>
            <li>
              Email <a href="mailto:finance@truelern.com">finance@truelern.com</a> with your
              enrolled email address and cohort details
            </li>
            <li>Include your reason for the refund request</li>
            <li>Refunds are processed within <strong>7–10 business days</strong></li>
            <li>Refunds are issued to the original payment method</li>
          </ol>

          <h2>5. Cohort Cancellation by TrueLern</h2>
          <p>
            If TrueLern cancels a cohort due to insufficient enrollment or unforeseen
            circumstances, all enrolled students will receive a <strong>full refund</strong>{" "}
            within 5 business days, or may transfer to the next available cohort.
          </p>

          <h2>6. Installment Plans</h2>
          <p>
            For installment plan enrollments, the refund amount is calculated based on
            payments already made and the applicable refund window.
          </p>
        </div>
      )}

      <div className="mt-12 p-5 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-800">
        <strong>Need a refund?</strong> Email us at{" "}
        <a href="mailto:finance@lmsca.com" className="underline">
          finance@lmsca.com
        </a>
        {" "}and our team will respond within 2 business days.
      </div>
    </div>
  );
}
