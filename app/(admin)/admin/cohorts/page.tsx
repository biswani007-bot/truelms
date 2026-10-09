import React from "react";
import Link from "next/link";
import { cohortRepository } from "../../../../repositories/cohort.repository";
import { AcademicResolver } from "../../../../services/academic/academic.service";
import { connectDB } from "../../../../config/db";

export const revalidate = 0; // Fresh listing

export default async function CohortListPage() {
  await connectDB();
  const rawCohorts = await cohortRepository.findMany({}, { populate: ["course", "academicSession", "primaryInstructor"] });
  const cohorts = rawCohorts.map((c: any) => AcademicResolver.resolveCohort(c));

  return (
    <div className="flex flex-col gap-10">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Live Learning Cohorts</h1>
          <p className="text-sm text-gray-500 mt-1">Configure scheduled program academic runs, check seat allocations, and primary mentors.</p>
        </div>
      </div>

      {/* Cohorts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cohorts.map((cohort: any) => {

          return (
            <div key={cohort._id?.toString()} className="bg-gray-50 border border-gray-200 p-6 rounded-2xl flex flex-col justify-between hover:border-gray-300 transition">
              <div>
                <div className="flex justify-between items-start gap-4">
                  <span className="px-2 py-1 rounded bg-indigo-50 text-indigo-600 border border-indigo-200 text-[10px] font-bold uppercase tracking-wider">
                    {cohort.cohortCode}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    cohort.status === "enrollment-open" ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-white text-gray-500 border border-gray-200"
                  }`}>
                    {cohort.status}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mt-4 line-clamp-1">{cohort.cohortName}</h3>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">Course: {cohort.course?.name || "N/A"}</p>
                <div className="mt-4 flex flex-col gap-2 text-xs text-gray-600">
                  <div className="flex justify-between">
                    <span>Instructor:</span>
                    <span className="font-medium text-white">{cohort.primaryInstructor?.name || "TBD"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Mode:</span>
                    <span className="capitalize font-medium text-white">{cohort.deliveryMode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Start Date:</span>
                    <span className="font-medium text-white">{new Date(cohort.startDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Capacity:</span>
                    <span className="font-medium text-white">{cohort.currentEnrollment} / {cohort.maxCapacity} Seats</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200 flex gap-3">
                <Link
                  href={`/admin/cohorts/${cohort._id?.toString()}`}
                  className="flex-1 text-center py-2 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-lg border border-indigo-200 hover:bg-indigo-900 transition"
                >
                  Manage Program
                </Link>
              </div>
            </div>
          );
        })}
        {cohorts.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-500 text-sm">No live cohorts scheduled.</div>
        )}
      </div>
    </div>
  );
}
