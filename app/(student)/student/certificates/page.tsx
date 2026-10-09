// @ts-nocheck
import React from "react";
import Link from "next/link";
import { connectDB } from "../../../../config/db";
import { getAuthenticatedStudent } from "../../../../lib/auth/student-session";
import { certificateRepository } from "../../../../repositories/certificate.repository";
import { Enrollment } from "../../../../models/enrollment.model";
import { CertificateEligibility } from "../../../../models/certificate-eligibility.model";
import { EligibilityService } from "../../../../services/certificate/eligibility.service";
import { CertificateEligibilityConfigService } from "../../../../services/certificate/certificate-config.service";
import { 
  Award, 
  CheckCircle2, 
  Download, 
  Clock, 
  Lock, 
  BookOpen, 
  Calendar, 
  AlertCircle,
  FileCheck,
  TrendingUp,
  GraduationCap
} from "lucide-react";

export const revalidate = 0;

export const metadata = {
  title: "My Earned Certificates | TrueLern Student",
  description: "Official verified course completion credentials and certificates.",
};

export default async function StudentCertificatesPage() {
  await connectDB();
  const student = await getAuthenticatedStudent();

  if (!student) {
    return (
      <div className="text-center py-16">
        <h1 className="text-xl font-bold text-slate-900">Please Sign In</h1>
        <p className="text-sm text-slate-500 mt-1">Sign in to view your earned certificates and progress.</p>
      </div>
    );
  }

  // Load authoritative backend eligibility rules
  const rules = await CertificateEligibilityConfigService.getEligibilityRules();

  // 1. Load certificates scoped strictly to authenticated student
  const certificates = await certificateRepository.findMany(
    { student: student._id },
    { populate: ["course"] }
  );

  const issued = certificates.filter((c) => c.status === "issued");
  const pendingCertificates = certificates.filter((c) => c.status === "pending" || c.status === "approved" || c.status === "draft");

  // 2. Load student's active enrollments to show in-progress certificate roadmaps
  const enrollments = await Enrollment.find({
    student: student._id,
    status: { $nin: ["cancelled", "refunded"] },
    isDeleted: { $ne: true },
  })
    .populate("course")
    .lean();

  // 3. Filter out enrollments that already have an officially issued certificate
  const inProgressEnrollments = enrollments.filter((enr) => {
    return !issued.some(
      (c) =>
        c.enrollment?.toString() === enr._id?.toString() ||
        (c.course as any)?._id?.toString() === (enr.course as any)?._id?.toString()
    );
  });

  // 4. Retrieve or calculate authoritative server-side CertificateEligibility for each in-progress enrollment
  const inProgressData = await Promise.all(
    inProgressEnrollments.map(async (enr) => {
      let el = await CertificateEligibility.findOne({ enrollment: enr._id }).lean();
      if (!el) {
        try {
          el = await EligibilityService.calculateEligibility(enr._id.toString());
        } catch {
          el = {
            attendancePercentage: 0,
            assignmentCompletionRate: 0,
            assessmentPassStatus: false,
            courseCompleted: enr.status === "completed",
            isEligible: false,
          };
        }
      }

      // Check if a draft or pending certificate exists for this enrollment
      const draftCert = certificates.find(
        (c) =>
          c.enrollment?.toString() === enr._id?.toString() ||
          (c.course as any)?._id?.toString() === (enr.course as any)?._id?.toString()
      );

      return {
        enrollment: enr,
        course: enr.course,
        eligibility: el,
        draftCert,
      };
    })
  );

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto py-2">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2.5">
          <GraduationCap className="w-7 h-7 text-indigo-600" />
          Earned Certificates & Academic Credentials
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Cryptographically verified completion certificates issued for:{" "}
          <strong className="text-slate-800">{student.firstName} {student.lastName}</strong>
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Issued & Verified", count: issued.length, color: "text-emerald-600" },
          { label: "Pending Issuance", count: pendingCertificates.length, color: "text-amber-600" },
          { label: "Certifications In Progress", count: inProgressData.length, color: "text-indigo-600" },
        ].map((s) => (
          <div key={s.label} className="p-4 rounded-2xl bg-white border border-slate-200 text-center shadow-sm">
            <div className={`text-2xl font-black ${s.color}`}>{s.count}</div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* SECTION 1: ISSUED CERTIFICATES */}
      {issued.length > 0 && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-600" />
              Verified Credentials
            </h2>
            <span className="text-xs text-slate-500 font-medium">
              Official PDF credentials recognized by TrueLern
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {issued.map((cert) => {
              const course = cert.course as any;
              const downloadUrl = `/api/certificates/${cert._id}/download`;

              return (
                <div
                  key={cert._id?.toString()}
                  className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 shadow-xl border border-indigo-500/20 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg bg-white/10 text-indigo-300 backdrop-blur-sm font-mono">
                        {cert.certificateNumber || "TL-CERT-0001"}
                      </span>
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                      </span>
                    </div>

                    <span className="text-xs font-bold text-indigo-200 uppercase tracking-wider block">
                      Certificate of Completion
                    </span>
                    <h3 className="font-extrabold text-white text-xl mt-1 leading-snug">
                      {course?.courseName || course?.name || "Program Mastery"}
                    </h3>

                    <p className="text-xs text-indigo-200/70 mt-3">
                      Awarded to <strong className="text-white">{student.firstName} {student.lastName}</strong> for outstanding performance and complete syllabus fulfillment.
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-white/10 flex justify-between items-center text-xs">
                    <span className="text-indigo-300 font-mono text-[11px] flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      Issued: {cert.issueDate ? new Date(cert.issueDate).toLocaleDateString("en-IN") : "Recent"}
                    </span>

                    <a
                      href={downloadUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white text-indigo-900 font-bold text-xs rounded-xl shadow hover:bg-indigo-50 transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download PDF</span>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 2: CERTIFICATES IN PROGRESS (MILESTONE ROADMAP) */}
      {inProgressData.length > 0 && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-600" />
                Certificates in Progress
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Live academic milestone tracker. Fulfill all 4 requirements to unlock your official credential.
              </p>
            </div>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
              {inProgressData.length} Enrolled {inProgressData.length === 1 ? "Program" : "Programs"}
            </span>
          </div>

          <div className="flex flex-col gap-6">
            {inProgressData.map((item) => {
              const course = item.course as any;
              const el = item.eligibility;
              const enr = item.enrollment;
              const attendance = el?.attendancePercentage ?? 0;
              const assignments = el?.assignmentCompletionRate ?? 0;
              const passedQuizzes = el?.assessmentPassStatus ?? false;
              const isEligible = el?.isEligible ?? false;

              const isAttendanceMet = attendance >= rules.attendanceThreshold;
              const isAssignmentsMet = assignments >= rules.assignmentSubmissionThreshold;
              const isCourseCompleted = el?.courseCompleted || enr.status === "completed";
              const courseDone = rules.syllabusCompletionRequired ? isCourseCompleted : true;

              return (
                <div
                  key={enr._id?.toString()}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 flex flex-col gap-6"
                >
                  {/* Program Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-mono">
                          {course?.courseCode || "PROGRAM"}
                        </span>
                        <h3 className="text-base font-extrabold text-slate-900">
                          {course?.courseName || course?.name || "Enrolled Course"}
                        </h3>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Enrollment Number: <strong className="font-mono text-slate-700">{enr.enrollmentNumber}</strong>
                      </p>
                    </div>

                    <div>
                      {isEligible ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Eligible — Pending Governance Review
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold">
                          <Lock className="w-3.5 h-3.5 text-amber-600" />
                          Locked — Requirements In Progress
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 4-Step Milestone Checklist (E-LMS Inspired, Academic Grade) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Step 1: Attendance */}
                    <div className={`p-4 rounded-xl border ${isAttendanceMet ? "bg-emerald-50/50 border-emerald-200" : "bg-slate-50 border-slate-200"} flex flex-col justify-between`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-700">Live Attendance</span>
                        {isAttendanceMet ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Clock className="w-4 h-4 text-amber-500" />
                        )}
                      </div>
                      <div className="text-xl font-extrabold text-slate-900">{attendance}%</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">Required: &ge; {rules.attendanceThreshold}%</div>
                      <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${isAttendanceMet ? "bg-emerald-500" : "bg-amber-500"}`}
                          style={{ width: `${Math.min(100, attendance)}%` }}
                        />
                      </div>
                    </div>

                    {/* Step 2: Assignments */}
                    <div className={`p-4 rounded-xl border ${isAssignmentsMet ? "bg-emerald-50/50 border-emerald-200" : "bg-slate-50 border-slate-200"} flex flex-col justify-between`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-700">Assignments</span>
                        {isAssignmentsMet ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Clock className="w-4 h-4 text-amber-500" />
                        )}
                      </div>
                      <div className="text-xl font-extrabold text-slate-900">{assignments}%</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">Required: &ge; {rules.assignmentSubmissionThreshold}% submission</div>
                      <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${isAssignmentsMet ? "bg-emerald-500" : "bg-amber-500"}`}
                          style={{ width: `${Math.min(100, assignments)}%` }}
                        />
                      </div>
                    </div>

                    {/* Step 3: Quizzes / Assessments */}
                    <div className={`p-4 rounded-xl border ${passedQuizzes ? "bg-emerald-50/50 border-emerald-200" : "bg-slate-50 border-slate-200"} flex flex-col justify-between`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-700">Assessments</span>
                        {passedQuizzes ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Clock className="w-4 h-4 text-amber-500" />
                        )}
                      </div>
                      <div className={`text-sm font-extrabold mt-1 ${passedQuizzes ? "text-emerald-700" : "text-amber-800"}`}>
                        {passedQuizzes ? "All Quizzes Passed" : "Pending Passing Marks"}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">Passing threshold: &ge; {rules.quizPassingThreshold}%</div>
                    </div>

                    {/* Step 4: Syllabus & Enrollment Status */}
                    <div className={`p-4 rounded-xl border ${courseDone ? "bg-emerald-50/50 border-emerald-200" : "bg-slate-50 border-slate-200"} flex flex-col justify-between`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-700">Course Syllabus</span>
                        {courseDone ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Clock className="w-4 h-4 text-amber-500" />
                        )}
                      </div>
                      <div className={`text-sm font-extrabold mt-1 ${courseDone ? "text-emerald-700" : "text-slate-800"}`}>
                        {courseDone ? "Syllabus Completed" : "In Progress"}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1 capitalize">
                        {rules.syllabusCompletionRequired ? "Mandatory" : "Optional"} &bull; {enr.status.replace(/-/g, " ")}
                      </div>
                    </div>
                  </div>

                  {/* Informational Guidance Footer */}
                  <div className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 ${
                    isEligible 
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200" 
                      : "bg-slate-50 text-slate-600 border border-slate-200"
                  }`}>
                    {isEligible ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>
                          <strong>All academic requirements satisfied!</strong> Your credential profile has been verified and submitted for Academic Director approval. Your official PDF certificate will appear above once issued.
                        </span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>
                          <strong>Certificate Locked:</strong> Attend remaining sessions (&ge; {rules.attendanceThreshold}%), submit pending assignments (&ge; {rules.assignmentSubmissionThreshold}%), and pass all required quizzes (&ge; {rules.quizPassingThreshold}%) to unlock your verified TrueLern certificate.
                        </span>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 3: EMPTY STATE (No Certificates & No Active Enrollments) */}
      {issued.length === 0 && inProgressData.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center max-w-xl mx-auto shadow-sm">
          <Award className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-900">No Certificates or Active Courses</h3>
          <p className="text-sm text-slate-500 mt-1">
            You do not currently have any active course enrollments. Enroll in a program to begin learning and earning cryptographically verified certificates.
          </p>
          <div className="mt-6">
            <Link
              href="/courses"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow hover:bg-indigo-700 transition"
            >
              <BookOpen className="w-4 h-4" />
              Explore Courses
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
