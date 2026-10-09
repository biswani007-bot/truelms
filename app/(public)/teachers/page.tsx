/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { teacherRepository } from "../../../repositories/teacher.repository";
import { connectDB } from "../../../config/db";

export const revalidate = 60;

export const metadata = {
  title: "Faculty & Instructors",
  description:
    "Meet the directors, staff software engineers, and domain experts leading live cohort classes at TrueLern.",
  openGraph: {
    title: "Faculty & Instructors | TrueLern",
    description: "Industry experts and engineers leading our live cohorts.",
  },
};

export default async function TeachersPage() {
  await connectDB();

  let teachers: any[] = [];
  try {
    teachers = await teacherRepository.findMany(
      { status: "active" },
      { populate: "user" } as any
    );
  } catch {
    teachers = [];
  }

  return (
    <div className="flex flex-col gap-16 pb-24">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-violet-50 via-white to-indigo-50 pt-20 pb-14 px-6 text-center overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:40px_40px] opacity-30 pointer-events-none" />
        <div className="relative max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
            Learn from{" "}
            <span className="text-indigo-600">Industry Experts</span>
          </h1>
          <p className="mt-5 text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
            Our instructors are active practitioners — staff engineers and technology
            leaders who have built platforms scaling to millions of users.
          </p>
        </div>
      </section>

      {/* Faculty Grid */}
      <section className="max-w-7xl mx-auto px-6 w-full">
        {teachers.length === 0 ? (
          <div className="text-center py-24 text-gray-400">
            <div className="text-5xl mb-4">👩‍🏫</div>
            <p className="text-lg font-semibold text-gray-600">
              Faculty profiles coming soon.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {teachers.map((teacher: any) => {
              const name = `${teacher.firstName} ${teacher.lastName}`;
              const initials = `${teacher.firstName?.[0] || ""}${teacher.lastName?.[0] || ""}`;
              const avatar = teacher.user?.avatar;

              return (
                <div
                  key={teacher._id}
                  className="p-8 rounded-2xl bg-white border border-gray-200 hover:border-indigo-200 hover:shadow-lg transition-all duration-300 flex flex-col gap-5"
                >
                  {/* Avatar + Name */}
                  <div className="flex items-start gap-4">
                    {avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={avatar}
                        alt={name}
                        className="w-16 h-16 rounded-full object-cover ring-2 ring-indigo-100 shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-xl shrink-0">
                        {initials}
                      </div>
                    )}
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{name}</h3>
                      <p className="text-indigo-600 text-xs font-semibold mt-0.5">
                        {teacher.designation}
                      </p>
                      <p className="text-gray-400 text-xs mt-0.5">
                        {teacher.department}
                      </p>
                    </div>
                  </div>

                  {/* Bio */}
                  {teacher.bio && (
                    <p className="text-gray-500 text-sm leading-relaxed line-clamp-3">
                      {teacher.bio}
                    </p>
                  )}

                  {/* Skills */}
                  {teacher.skills?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {teacher.skills.slice(0, 5).map((skill: string, i: number) => (
                        <span
                          key={i}
                          className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-semibold rounded-full border border-indigo-100"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Footer row */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs text-gray-500">
                    <span>
                      🏆{" "}
                      <span className="font-semibold text-gray-700">
                        {teacher.experienceYears}+ yrs
                      </span>{" "}
                      experience
                    </span>
                    <span className="capitalize">
                      {teacher.employmentType?.replace("-", " ")}
                    </span>
                  </div>

                  {/* Social links */}
                  <div className="flex gap-3">
                    {teacher.linkedin && (
                      <a
                        href={teacher.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-indigo-600 hover:underline font-medium"
                      >
                        LinkedIn →
                      </a>
                    )}
                    {teacher.website && (
                      <a
                        href={teacher.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-gray-500 hover:underline"
                      >
                        Website →
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-6 w-full">
        <div className="rounded-3xl bg-gradient-to-br from-violet-600 to-indigo-700 p-10 text-center shadow-xl">
          <h2 className="text-2xl md:text-3xl font-extrabold text-white">
            Interested in teaching with us?
          </h2>
          <p className="mt-3 text-indigo-100 text-sm max-w-xl mx-auto">
            We partner with top industry practitioners to deliver the most impactful
            live cohort education. Apply to join our faculty.
          </p>
          <a
            href="mailto:faculty@lmsca.com"
            className="mt-6 inline-block px-7 py-3 bg-white hover:bg-gray-100 text-indigo-700 font-bold rounded-xl text-sm shadow-sm transition"
          >
            Apply as Instructor
          </a>
        </div>
      </section>
    </div>
  );
}
