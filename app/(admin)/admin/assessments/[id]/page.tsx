/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import Link from "next/link";
import { assessmentRepository } from "../../../../../repositories/assessment.repository";
import { assessmentQuestionRepository } from "../../../../../repositories/assessment-question.repository";
import { assessmentAttemptRepository } from "../../../../../repositories/assessment-attempt.repository";
import { assessmentResultRepository } from "../../../../../repositories/assessment-result.repository";
import { assessmentTimelineRepository } from "../../../../../repositories/assessment-timeline.repository";
import { connectDB } from "../../../../../config/db";

interface AssessmentDetailPageProps {
  params: Promise<{ id: string }>;
}

export const revalidate = 0;

export default async function AssessmentDetailPage({ params }: AssessmentDetailPageProps) {
  await connectDB();
  const { id } = await params;

  const assessment = await assessmentRepository.findById(id, {
    populate: ["course", "batch", "teacher"],
  });

  if (!assessment) {
    return (
      <div className="py-20 text-center text-gray-500">
        Assessment not found. <Link href="/admin/assessments" className="text-indigo-600 underline">Back</Link>
      </div>
    );
  }

  // Load questions, attempts, results, timeline
  const linkedQuestions = await assessmentQuestionRepository.findMany({ assessment: id }, { populate: ["questionBank"] });
  const attempts = await assessmentAttemptRepository.findMany({ assessment: id }, { populate: ["student"] });
  const results = await assessmentResultRepository.findMany({ assessment: id }, { populate: ["student"] });
  const timeline = await assessmentTimelineRepository.findMany({ assessment: id }, { sort: "timestamp", order: "desc" } as any);

  const courseObj = assessment.course as any;
  const batchObj = assessment.batch as any;

  return (
    <div className="flex flex-col gap-10">
      {/* Header */}
      <div className="flex justify-between items-start border-b border-gray-200 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-gray-900">{assessment.title}</h1>
            <span className="px-2.5 py-1 rounded bg-indigo-50 text-indigo-600 border border-indigo-200 text-xs font-bold uppercase tracking-wider">
              {assessment.assessmentCode}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">Course: {courseObj?.name} &bull; Batch: {batchObj?.batchName}</p>
        </div>
        <Link
          href="/admin/assessments"
          className="px-4 py-2 border border-gray-200 text-gray-600 hover:bg-white hover:text-white rounded-lg text-sm transition"
        >
          Back to Dashboard
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Core questions & attempts */}
        <div className="flex flex-col gap-8 lg:col-span-2">
          {/* Linked Question Inventory */}
          <div className="bg-gray-50 border border-gray-200 p-6 rounded-2xl">
            <h2 className="text-base font-bold text-gray-900 mb-4">Question Paper Inventory</h2>
            <div className="flex flex-col gap-4">
              {linkedQuestions.map((lq) => {
                const qObj = lq.questionBank as any;
                return (
                  <div key={lq._id?.toString()} className="p-4 bg-white border border-slate-850 rounded-xl">
                    <div className="flex justify-between items-start gap-4">
                      <span className="px-2 py-0.5 rounded bg-white text-gray-500 border border-gray-200 text-[10px] font-mono">
                        {qObj?.questionCode}
                      </span>
                      <span className="text-indigo-600 font-extrabold text-xs">{qObj?.marks || lq.marksOverride} Marks</span>
                    </div>
                    <p className="text-sm text-white mt-3 font-medium">{qObj?.questionText}</p>
                    <div className="mt-3 flex gap-2">
                      <span className="px-2 py-0.5 rounded bg-white text-[10px] text-gray-400 capitalize">{qObj?.type}</span>
                      <span className="px-2 py-0.5 rounded bg-white text-[10px] text-gray-400 capitalize">{qObj?.difficultyLevel}</span>
                    </div>
                  </div>
                );
              })}
              {linkedQuestions.length === 0 && (
                <div className="py-4 text-center text-slate-550 text-xs">No questions linked to this assessment yet.</div>
              )}
            </div>
          </div>

          {/* Student attempts tracker */}
          <div className="bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-base font-bold text-gray-900">Student Attempt Monitoring</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-xs text-gray-400 uppercase tracking-wider">
                    <th className="text-left px-6 py-3">Student</th>
                    <th className="text-left px-6 py-3">Attempt #</th>
                    <th className="text-left px-6 py-3">Started At</th>
                    <th className="text-left px-6 py-3">Duration</th>
                    <th className="text-left px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attempts.map((att) => {
                    const studentObj = att.student as any;
                    return (
                      <tr key={att._id?.toString()} className="border-b border-slate-850 hover:bg-white transition">
                        <td className="px-6 py-3 font-medium text-white">
                          {studentObj ? `${studentObj.firstName} ${studentObj.lastName}` : "N/A"}
                        </td>
                        <td className="px-6 py-3 font-mono text-gray-500">{att.attemptNumber}</td>
                        <td className="px-6 py-3 text-gray-500">{new Date(att.startedAt).toLocaleString()}</td>
                        <td className="px-6 py-3 text-gray-600">{att.timeTaken ? `${att.timeTaken} Secs` : "—"}</td>
                        <td className="px-6 py-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            att.status === "submitted" ? "bg-indigo-50 text-indigo-600 border border-indigo-200" :
                            att.status === "in-progress" ? "bg-emerald-50 text-emerald-600 border border-emerald-200" :
                            "bg-white text-slate-550 border border-gray-200"
                          }`}>
                            {att.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {attempts.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-10 text-slate-550 text-xs">No exam attempts logged.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar specs: Scorecard results & Timelines */}
        <div className="flex flex-col gap-8">
          {/* Results dashboard summary */}
          <div className="bg-gray-50 border border-gray-200 p-6 rounded-2xl">
            <h2 className="text-base font-bold text-gray-900 mb-4">Published Results Scorecard</h2>
            <div className="flex flex-col gap-4">
              {results.map((res) => {
                const studentObj = res.student as any;
                return (
                  <div key={res._id?.toString()} className="p-4 bg-white border border-slate-850 rounded-xl flex justify-between items-center">
                    <div>
                      <span className="block text-xs font-bold text-white">{studentObj ? `${studentObj.firstName} ${studentObj.lastName}` : "Student"}</span>
                      <span className="text-[10px] text-gray-500 block mt-0.5">{res.totalMarksObtained} Marks ({res.percentage}%)</span>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        res.status === "pass" ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-red-950 text-red-400 border border-red-500/20"
                      }`}>
                        {res.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                );
              })}
              {results.length === 0 && (
                <div className="py-4 text-center text-slate-555 text-xs">Final results scoreboard not yet published.</div>
              )}
            </div>
          </div>

          {/* Timeline audit */}
          <div className="bg-gray-50 border border-gray-200 p-6 rounded-2xl">
            <h2 className="text-base font-bold text-gray-900 mb-4">Lifecycle Audit Trail</h2>
            <div className="flex flex-col gap-4 border-l border-gray-200 pl-4 ml-2">
              {timeline.map((item) => (
                <div key={item._id?.toString()} className="relative text-xs">
                  <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-indigo-500 border border-gray-100"></div>
                  <div className="font-bold text-gray-600 capitalize">{item.event}</div>
                  <div className="text-gray-500 mt-0.5">{item.description}</div>
                  <div className="text-slate-550 mt-1 text-[10px]">{new Date(item.timestamp).toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
