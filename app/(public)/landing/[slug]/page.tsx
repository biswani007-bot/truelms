/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import Link from "next/link";
import { connectDB } from "../../../../config/db";
import { pageRepository } from "../../../../repositories/page.repository";
import { heroSectionRepository } from "../../../../repositories/hero-section.repository";

export const revalidate = 60;

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export default async function CMSLandingPage({ params }: RouteParams) {
  await connectDB();
  const { slug } = await params;

  const [page, hero] = await Promise.all([
    pageRepository.findOne({ slug, status: "PUBLISHED" }),
    heroSectionRepository.findOne({ pageName: slug }),
  ]);

  const title = hero?.title || page?.title || "Campaign Program";
  const subtitle = hero?.subtitle || page?.seoDescription || "Empowering tech leaders through live cohort education.";

  return (
    <div className="flex flex-col gap-16 pb-24">
      {/* Hero section */}
      <section className="bg-gradient-to-br from-indigo-50 via-white to-cyan-50 py-20 px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <span className="inline-block bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-1 rounded-full mb-4 uppercase">
            Special Program
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">{title}</h1>
          <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">{subtitle}</p>
          <div className="mt-8 flex justify-center gap-4">
            <Link href="/admissions/apply" className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md">
              Apply Now
            </Link>
            <Link href="/contact" className="px-8 py-3.5 bg-white border border-slate-300 text-slate-700 font-bold rounded-xl shadow-sm">
              Inquire
            </Link>
          </div>
        </div>
      </section>

      {/* Dynamic Content */}
      <section className="max-w-4xl mx-auto px-6">
        {page ? (
          <div className="prose prose-lg text-slate-600" dangerouslySetInnerHTML={{ __html: page.content }} />
        ) : (
          <div className="p-8 border border-slate-200 rounded-2xl bg-white text-center">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Cohort Overview</h2>
            <p className="text-slate-500">Comprehensive hands-on training with 1-on-1 mentorship and career guidance.</p>
          </div>
        )}
      </section>
    </div>
  );
}
