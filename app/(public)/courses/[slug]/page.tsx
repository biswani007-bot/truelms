/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FAQAccordion } from "../../../../components/public/FAQAccordion";
import { courseRepository } from "../../../../repositories/course.repository";
import { connectDB } from "../../../../config/db";

export const revalidate = 60;

export async function generateMetadata(segmentData: any) {
  const params = await segmentData.params;
  await connectDB();
  const course = await courseRepository.findOne({ slug: params.slug });
  if (!course) return { title: "Course Not Found" };
  return {
    title: course.seoTitle || course.courseName,
    description: course.seoDescription || course.shortDescription,
    openGraph: {
      title: `${course.seoTitle || course.courseName} | TrueLern`,
      description: course.seoDescription || course.shortDescription,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: course.seoTitle || course.courseName,
      description: course.seoDescription || course.shortDescription,
    },
  };
}

const LEVEL_COLORS: Record<string, string> = {
  beginner: "bg-emerald-50 text-emerald-700",
  intermediate: "bg-amber-50 text-amber-700",
  advanced: "bg-rose-50 text-rose-700",
};

export default async function CourseDetailPage(segmentData: any) {
  const params = await segmentData.params;
  const slug = params?.slug as string;
  if (!slug) notFound();

  await connectDB();
  const course = (await courseRepository.findOne(
    { slug, status: "published" },
    { populate: ["category"] } as any
  )) as any;

  if (!course) notFound();

  // JSON-LD Structured Data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.courseName,
    description: course.shortDescription,
    provider: {
      "@type": "Organization",
      name: "TrueLern",
      sameAs: "https://truelern.com",
    },
    courseMode: course.deliveryMode,
    educationalLevel: course.level,
    inLanguage: course.language || "en",
    offers: {
      "@type": "Offer",
      price: course.pricing?.price,
      priceCurrency: course.pricing?.currency || "USD",
    },
  };

  return (
    <>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-7xl mx-auto px-6 py-16 flex flex-col gap-16">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-400 flex items-center gap-2">
          <Link href="/" className="hover:text-gray-700 transition">Home</Link>
          <span>/</span>
          <Link href="/courses" className="hover:text-gray-700 transition">Courses</Link>
          <span>/</span>
          <span className="text-gray-700 font-medium">{course.courseName}</span>
        </nav>

        {/* Hero */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Info */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            {/* Category + Level */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
                {course.category?.name || "Engineering"}
              </span>
              <span
                className={`text-xs font-bold px-3 py-1 rounded-full ${
                  LEVEL_COLORS[course.level] || "bg-gray-100 text-gray-600"
                }`}
              >
                {course.level}
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight">
              {course.courseName}
            </h1>

            <p className="text-lg text-gray-500 leading-relaxed">
              {course.longDescription || course.shortDescription}
            </p>

            {/* Quick stats */}
            <div className="flex flex-wrap gap-6 text-sm">
              <div className="flex flex-col">
                <span className="text-gray-400 text-xs uppercase tracking-wider">Duration</span>
                <span className="font-bold text-gray-800 mt-1">
                  {course.duration} {course.durationUnit}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-gray-400 text-xs uppercase tracking-wider">Delivery</span>
                <span className="font-bold text-gray-800 mt-1 capitalize">
                  {course.deliveryMode?.replace("-", " ")}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-gray-400 text-xs uppercase tracking-wider">Language</span>
                <span className="font-bold text-gray-800 mt-1 uppercase">
                  {course.language || "EN"}
                </span>
              </div>
              {course.certificateAvailable && (
                <div className="flex flex-col">
                  <span className="text-gray-400 text-xs uppercase tracking-wider">Certificate</span>
                  <span className="font-bold text-emerald-600 mt-1">✓ Included</span>
                </div>
              )}
            </div>

            {/* Learning Outcomes */}
            {course.outcomes?.learningOutcomes?.length > 0 && (
              <div className="p-6 rounded-2xl bg-indigo-50 border border-indigo-100">
                <h2 className="text-lg font-bold text-gray-900 mb-4">
                  What You&apos;ll Learn
                </h2>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {course.outcomes.learningOutcomes.map(
                    (outcome: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="text-indigo-500 mt-0.5">✓</span>
                        {outcome}
                      </li>
                    )
                  )}
                </ul>
              </div>
            )}

            {/* Skills */}
            {course.outcomes?.skills?.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-3">Skills Gained</h2>
                <div className="flex flex-wrap gap-2">
                  {course.outcomes.skills.map((skill: string, i: number) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-white border border-gray-200 text-gray-600 text-xs font-medium rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Requirements */}
            {course.requirements?.prerequisites?.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-3">Prerequisites</h2>
                <ul className="space-y-2">
                  {course.requirements.prerequisites.map(
                    (req: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="text-gray-400 mt-0.5">→</span>
                        {req}
                      </li>
                    )
                  )}
                </ul>
              </div>
            )}

            {/* FAQs */}
            {course.faqs?.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-4">
                  Frequently Asked Questions
                </h2>
                <div className="space-y-4">
                  {course.faqs.map((faq: any, i: number) => (
                    <FAQAccordion key={i} q={faq.question} a={faq.answer} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Enrollment Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 p-8 rounded-2xl bg-white border border-gray-200 shadow-lg flex flex-col gap-6">
              {/* Pricing */}
              <div>
                {course.pricing?.discountPrice ? (
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl font-extrabold text-gray-900">
                      {course.pricing.currency}
                      {course.pricing.discountPrice.toLocaleString()}
                    </span>
                    <span className="text-lg text-gray-400 line-through">
                      {course.pricing.currency}
                      {course.pricing.price.toLocaleString()}
                    </span>
                  </div>
                ) : (
                  <span className="text-3xl font-extrabold text-gray-900">
                    {course.pricing?.currency}
                    {course.pricing?.price?.toLocaleString() || "Free"}
                  </span>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  {course.pricing?.validityMonths
                    ? `${course.pricing.validityMonths} months access`
                    : "Lifetime cohort access"}
                </p>
              </div>

              <Link
                href={`/admissions/apply?course=${course.slug}`}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl text-center shadow-md shadow-indigo-300/30 transition"
              >
                Apply Now
              </Link>
              <Link
                href="/contact"
                className="w-full py-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold text-sm rounded-xl text-center transition"
              >
                Ask a Question
              </Link>

              {/* Perks */}
              <ul className="space-y-3 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <span className="text-indigo-500">✓</span>
                  Live instructor-led sessions
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-indigo-500">✓</span>
                  Max 50 learners per cohort
                </li>
                {course.certificateAvailable && (
                  <li className="flex items-center gap-2">
                    <span className="text-indigo-500">✓</span>
                    Certificate of completion
                  </li>
                )}
                <li className="flex items-center gap-2">
                  <span className="text-indigo-500">✓</span>
                  Real project feedback
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
