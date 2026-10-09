/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import Link from "next/link";
import { assignmentRepository } from "../../../../../repositories/assignment.repository";
import { assignmentSubmissionRepository } from "../../../../../repositories/assignment-submission.repository";
import { assignmentEvaluationRepository } from "../../../../../repositories/assignment-evaluation.repository";
import { assignmentRubricRepository } from "../../../../../repositories/assignment-rubric.repository";
import { assignmentTimelineRepository } from "../../../../../repositories/assignment-timeline.repository";
import { connectDB } from "../../../../../config/db";

interface AssignmentDetailPageProps {
  params: Promise<{ id: string }>;
}

export const revalidate = 0;

export default async function AssignmentDetailPage({ params }: AssignmentDetailPageProps) {
  await connectDB();
  const { id } = await params;

  const assignment = await assignmentRepository.findById(id, {
    populate: ["course", "batch", "teacher", "liveClass"],
  });

  if (!assignment) {
    return (
      <div className="py-20 text-center text-gray-500">
        Assignment not found. <Link href="/admin/assignments" className="text-indigo-600 underline">Back</Link>
      </div>
    );
  }

  // Load submissions, rubrics, evaluations, timeline
  const submissions = await assignmentSubmissionRepository.findMany({ assignment: id }, { populate: ["student"] });
  const rubrics = await assignmentRubricRepository.findMany({ assignment: id });
  const timeline = await assignmentTimelineRepository.findMany({ assignment: id }, { sort: "timestamp", order: "desc" } as any);
  const { AssignmentAttachment } = require("../../../../../models/assignment-attachment.model");
  const attachments = await AssignmentAttachment.find({ assignment: id }).lean();

  // Load evaluations mapped by submission ID
  const submissionIds = submissions.map((s) => s._id.toString());
  const evaluations = await assignmentEvaluationRepository.findMany({ submission: { $in: submissionIds } });
  const evalMap = new Map(evaluations.map((e) => [e.submission.toString(), e]));

  const courseObj = assignment.course as any;
  const batchObj = assignment.batch as any;
  const teacherObj = assignment.teacher as any;

  return (
    <div className="flex flex-col gap-10">
      {/* Header */}
      <div className="flex justify-between items-start border-b border-gray-200 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-gray-900">{assignment.title}</h1>
            <span className="px-2.5 py-1 rounded bg-indigo-50 text-indigo-600 border border-indigo-200 text-xs font-bold uppercase tracking-wider">
              {assignment.assignmentCode}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">Course: {courseObj?.name} &bull; Batch: {batchObj?.batchName}</p>
        </div>
        <Link
          href="/admin/assignments"
          className="px-4 py-2 border border-gray-200 text-gray-600 hover:bg-white hover:text-white rounded-lg text-sm transition"
        >
          Back to Listing
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Core details & submissions */}
        <div className="flex flex-col gap-8 lg:col-span-2">
          {/* Specifications */}
          <div className="bg-gray-50 border border-gray-200 p-6 rounded-2xl">
            <h2 className="text-base font-bold text-gray-900 mb-4">Specs & Instructions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-500">
              <div>
                <span className="block text-xs font-semibold text-gray-400">Instructor:</span>
                <span className="text-gray-900 font-medium mt-0.5 block">{teacherObj ? `${teacherObj.firstName} ${teacherObj.lastName}` : "TBD"}</span>
              </div>
              <div>
                <span className="block text-xs font-semibold text-gray-400">Type:</span>
                <span className="text-gray-900 font-medium mt-0.5 block capitalize">{assignment.type}</span>
              </div>
              <div>
                <span className="block text-xs font-semibold text-gray-400">Due Date:</span>
                <span className="text-gray-900 font-medium mt-0.5 block">{new Date(assignment.dueDate).toLocaleString()}</span>
              </div>
              <div>
                <span className="block text-xs font-semibold text-gray-400">Passing Threshold:</span>
                <span className="text-gray-900 font-medium mt-0.5 block">{assignment.passingMarks} / {assignment.totalMarks} Marks</span>
              </div>
            </div>
            {assignment.description && (
              <div className="mt-6 pt-6 border-t border-gray-200 text-sm">
                <span className="block text-xs font-semibold text-gray-400 mb-2">Description & Requirements:</span>
                <div 
                  className="text-gray-700 prose prose-sm max-w-none" 
                  dangerouslySetInnerHTML={{ __html: assignment.description }} 
                />
              </div>
            )}
            
            {attachments && attachments.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200 text-sm">
                <span className="block text-xs font-semibold text-gray-400 mb-2">Attachments:</span>
                <ul className="flex flex-col gap-2">
                  {attachments.map((att: any) => (
                    <li key={att._id.toString()}>
                      <a href={att.fileUrl} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                        {att.fileName}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Submissions Roster */}
          <div className="bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-base font-bold text-gray-900">Student Submission Ledger</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-xs text-gray-400 uppercase tracking-wider">
                    <th className="text-left px-6 py-3">Student</th>
                    <th className="text-left px-6 py-3">Date</th>
                    <th className="text-left px-6 py-3">Submission #</th>
                    <th className="text-left px-6 py-3">Status</th>
                    <th className="text-left px-6 py-3">Marks</th>
                    <th className="text-left px-6 py-3">Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((sub) => {
                    const studentObj = sub.student as any;
                    const evalObj = evalMap.get(sub._id.toString());

                    return (
                      <tr key={sub._id?.toString()} className="border-b border-slate-850 hover:bg-white transition">
                        <td className="px-6 py-3 font-medium text-white">
                          {studentObj ? `${studentObj.firstName} ${studentObj.lastName}` : "N/A"}
                        </td>
                        <td className="px-6 py-3 text-gray-500">{new Date(sub.submittedAt).toLocaleDateString()}</td>
                        <td className="px-6 py-3 font-mono text-gray-500">{sub.submissionNumber}</td>
                        <td className="px-6 py-3">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                            sub.status === "submitted" ? "bg-indigo-50 text-indigo-600 border border-indigo-200" :
                            sub.status === "late" ? "bg-red-950 text-red-400 border border-red-500/20" :
                            "bg-white text-slate-550 border border-gray-200"
                          }`}>
                            {sub.status}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-gray-600">{evalObj ? `${evalObj.marksObtained} Marks` : "Not Graded"}</td>
                        <td className="px-6 py-3 font-mono font-bold text-white">{evalObj?.grade || "—"}</td>
                      </tr>
                    );
                  })}
                  {submissions.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-slate-550 text-xs">No student submissions received.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar specs: Rubrics & Timeline logs */}
        <div className="flex flex-col gap-8">
          {/* Rubrics Criteria */}
          <div className="bg-gray-50 border border-gray-200 p-6 rounded-2xl">
            <h2 className="text-base font-bold text-gray-900 mb-4">Grading Rubric Matrix</h2>
            <div className="flex flex-col gap-4">
              {rubrics.map((rubric) => (
                <div key={rubric._id?.toString()} className="p-4 bg-white border border-slate-850 rounded-xl">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-gray-600">{rubric.criterion}</span>
                    <span className="text-indigo-600 font-extrabold">{rubric.maxMarks} Marks</span>
                  </div>
                  {rubric.description && <p className="text-[11px] text-gray-500 mt-1">{rubric.description}</p>}
                </div>
              ))}
              {rubrics.length === 0 && (
                <div className="py-4 text-center text-slate-550 text-xs">No scoring rubric criteria specified.</div>
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
                  <div className="text-slate-550 mt-1 text-[10px]">{new Date(item.timestamp).toLocaleDateString()}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
