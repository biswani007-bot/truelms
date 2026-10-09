/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { studentRepository } from "../../../../../repositories/student.repository";
import { studentGuardianRepository } from "../../../../../repositories/student-guardian.repository";
import { studentMedicalRepository } from "../../../../../repositories/student-medical.repository";
import { studentTimelineRepository } from "../../../../../repositories/student-timeline.repository";
import { studentDocumentRepository } from "../../../../../repositories/student-document.repository";
import { ParentStudentLink } from "@/models/parent-student-link.model";
import { Enrollment } from "@/models/enrollment.model";
import { DemoSession } from "@/models/demo-session.model";
import { BatchStudent } from "@/models/batch-student.model";
import { calculateAge } from "@/utils/age-helper";
import { connectDB } from "../../../../../config/db";
import { WorkspaceHeader } from "@/components/workspace/WorkspaceHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { DashboardCard } from "@/components/ui/DashboardCard";
import { 
  ArrowLeft, User, Phone, MapPin, Shield, Calendar, 
  Building2, BookOpen, Layers, Users2, Mail, CheckCircle, 
  Lock, AlertTriangle 
} from "lucide-react";
import Link from "next/link";
import { AdminStudentActions } from "@/components/admin/AdminStudentActions";
import { StudentDocumentsManager } from "@/components/admin/StudentDocumentsManager";

interface StudentDetailsPageProps {
  params: Promise<{ id: string }>;
}

export const revalidate = 0;

export default async function StudentDetailsPage({ params }: StudentDetailsPageProps) {
  await connectDB();
  const { id } = await params;

  const student = await studentRepository.findById(id, { populate: "user" });
  if (!student) {
    return (
      <div className="py-20 text-center text-slate-500 font-medium">
        Student profile not found.{" "}
        <Link href="/admin/students" className="text-indigo-600 font-semibold hover:underline">
          Back to Directory
        </Link>
      </div>
    );
  }

  // 1. Authoritative Parent Resolution via ParentStudentLink
  const parentLinks = await ParentStudentLink.find({
    student: id,
    isDeleted: { $ne: true },
  })
    .sort({ priority: 1 })
    .populate<{ parent: any }>("parent");

  const primaryParentLink = parentLinks.find((l: any) => l.parent && !l.parent.isDeleted) || parentLinks[0];
  const primaryParent = primaryParentLink?.parent;

  // Fallback to legacy guardian record only if no ParentStudentLink exists
  const legacyGuardian = !primaryParent ? await studentGuardianRepository.findOne({ student: id }) : null;

  // 2. Authoritative Academic Context
  const enrollments = await Enrollment.find({
    student: id,
    isDeleted: { $ne: true },
  })
    .populate("course")
    .populate("cohort")
    .sort({ createdAt: -1 });

  const demos = await DemoSession.find({
    student: id,
    isDeleted: { $ne: true },
  })
    .populate("course")
    .sort({ scheduledStart: -1 });

  const batchAssignments = await BatchStudent.find({
    student: id,
    isDeleted: { $ne: true },
  })
    .populate("batch")
    .sort({ createdAt: -1 });

  // 3. Sub-documents
  const medical = await studentMedicalRepository.findOne({ student: id });
  const timeline = await studentTimelineRepository.findMany(
    { student: id },
    { sort: "timestamp", order: "desc" } as any
  );
  const documents = await studentDocumentRepository.findMany(
    { student: id, isDeleted: { $ne: true } },
    { populate: ["verifiedBy", "uploadedBy"], sort: "createdAt", order: "desc" } as any
  );

  const derivedAge = student.dob ? calculateAge(student.dob) : null;
  const fullName = [student.firstName, student.middleName, student.lastName].filter(Boolean).join(" ");

  return (
    <div className="flex flex-col gap-8 max-w-7xl">
      {/* Enterprise Workspace Header */}
      <WorkspaceHeader
        entityName={fullName}
        status={student.status}
        entityId={student.studentId}
        createdDate={(student as any).createdAt ? new Date((student as any).createdAt).toLocaleDateString() : undefined}
        moduleIcon={<User className="size-5" />}
        breadcrumb={[
          { label: "Dashboard", href: "/admin" },
          { label: "Students", href: "/admin/students" },
          { label: fullName },
        ]}
        description={`Admission No: ${student.admissionNumber} · Reg No: ${student.registrationNumber}`}
        secondaryActions={
          <div className="flex gap-2 items-center">
            <AdminStudentActions student={JSON.parse(JSON.stringify(student))} />
            <Link
              href="/admin/students"
              className="inline-flex items-center gap-1.5 px-3 py-2 lms-button-text text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors"
            >
              <ArrowLeft className="size-4" />
              Back to Directory
            </Link>
          </div>
        }
      />

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Core Info (2 Cols) */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          {/* Overview Card */}
          <DashboardCard title="Academic & Personal Profile" subtitle="Student credentials, contact, and educational history">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="lms-label text-slate-400 block mb-1">Admission Number</span>
                <span className="lms-code font-bold text-slate-900">{student.admissionNumber}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="lms-label text-slate-400 block mb-1">Registration Number</span>
                <span className="lms-code font-bold text-slate-900">{student.registrationNumber}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="lms-label text-slate-400 block mb-1">Enrollment Status</span>
                <div className="mt-0.5">
                  <StatusBadge status={student.status} showDot />
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="lms-label text-slate-400 block mb-1">Date of Birth & Age</span>
                <span className="lms-body-sm font-semibold text-slate-800 flex items-center gap-1.5 mt-0.5">
                  <Calendar className="size-3.5 text-slate-400" />
                  {student.dob ? new Date(student.dob).toLocaleDateString() : "—"}
                  {derivedAge !== null && (
                    <span className="text-[11px] font-bold text-indigo-600 ml-1">({derivedAge} yrs)</span>
                  )}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="lms-label text-slate-400 block mb-1">Gender</span>
                <span className="lms-body-sm font-semibold text-slate-800 capitalize mt-0.5 block">
                  {student.gender || "—"}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="lms-label text-slate-400 block mb-1">Contact Phone</span>
                <span className="lms-body-sm font-semibold text-slate-800 flex items-center gap-1.5 mt-0.5">
                  <Phone className="size-3.5 text-slate-400" />
                  {student.phone}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="lms-label text-slate-400 block mb-1">Location</span>
                <span className="lms-body-sm font-semibold text-slate-800 flex items-center gap-1.5 mt-0.5">
                  <MapPin className="size-3.5 text-slate-400" />
                  {[student.city, student.state, student.country].filter(Boolean).join(", ") || "—"}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 md:col-span-2">
                <span className="lms-label text-slate-400 block mb-1">School / College</span>
                <span className="lms-body-sm font-medium text-slate-800 flex items-center gap-1.5 mt-0.5">
                  <Building2 className="size-3.5 text-slate-400" />
                  {student.schoolCollege || "Not Configured"}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="lms-label text-slate-400 block mb-1">Highest Qualification</span>
                <span className="lms-body-sm font-medium text-slate-800 mt-0.5 block">
                  {student.highestQualification || "Not Configured"}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="lms-label text-slate-400 block mb-1">CGPA / Score</span>
                <span className="lms-code font-bold text-indigo-600 mt-0.5 block">
                  {student.cgpaPercentage ? `${student.cgpaPercentage}%` : "—"}
                </span>
              </div>
            </div>
          </DashboardCard>

          {/* Authoritative Parent Profile Card */}
          <DashboardCard 
            title="Authoritative Parent Account" 
            subtitle="Verified relationship via ParentStudentLink architecture"
          >
            {primaryParent ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-100">
                  <span className="lms-label text-emerald-800 block mb-1">Parent / Guardian Name</span>
                  <span className="lms-body-sm font-bold text-slate-900 flex items-center gap-1.5">
                    {primaryParent.firstName} {primaryParent.lastName}
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase">
                      {primaryParentLink.relationshipType || "Guardian"}
                    </span>
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="lms-label text-slate-400 block mb-1">Portal Access</span>
                  <span className="lms-body-sm font-bold flex items-center gap-1.5 text-slate-800">
                    {primaryParentLink.canAccessPortal ? (
                      <span className="text-emerald-700 flex items-center gap-1">
                        <CheckCircle className="size-3.5 text-emerald-600" /> Authorized
                      </span>
                    ) : (
                      <span className="text-amber-700 flex items-center gap-1">
                        <Lock className="size-3.5 text-amber-600" /> Disabled
                      </span>
                    )}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="lms-label text-slate-400 block mb-1">Email Address</span>
                  <span className="lms-body-sm font-medium text-slate-800 flex items-center gap-1.5 truncate">
                    <Mail className="size-3.5 text-slate-400 shrink-0" />
                    {primaryParent.email}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="lms-label text-slate-400 block mb-1">Contact Phone</span>
                  <span className="lms-body-sm font-semibold text-slate-800 flex items-center gap-1.5">
                    <Phone className="size-3.5 text-slate-400" />
                    {primaryParent.phone || "—"}
                  </span>
                </div>
              </div>
            ) : legacyGuardian ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-200">
                  <span className="lms-label text-amber-800 block mb-1">Legacy Guardian Record</span>
                  <span className="lms-body-sm font-bold text-slate-900">
                    {legacyGuardian.guardianName} ({legacyGuardian.guardianRelationship})
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="lms-label text-slate-400 block mb-1">Guardian Phone</span>
                  <span className="lms-code font-bold text-slate-900">{legacyGuardian.guardianPhone}</span>
                </div>
                <div className="col-span-full p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="lms-label text-slate-400 block mb-1">Guardian Email</span>
                  <span className="lms-body-sm font-medium text-slate-700">{legacyGuardian.guardianEmail}</span>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-slate-400 text-xs">
                No Parent linked to this student. Relationship record not established.
              </div>
            )}
          </DashboardCard>

          {/* Academic Context: Course Enrollments & Demos */}
          <DashboardCard title="Academic Context" subtitle="Enrollments, Demo sessions, and Cohort allocations">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              {/* Current Course / Enrollment */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-slate-700 mb-1.5">
                    <BookOpen className="size-3.5 text-indigo-600" />
                    <span>Current Enrollment</span>
                  </div>
                  {enrollments.length > 0 ? (
                    <div className="space-y-1">
                      <p className="font-extrabold text-slate-900 text-sm">
                        {(enrollments[0] as any).course?.courseName || "Enrolled Course"}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Status: <span className="font-semibold capitalize">{(enrollments[0] as any).status}</span>
                      </p>
                    </div>
                  ) : (
                    <p className="text-slate-400 italic">No active enrollment</p>
                  )}
                </div>
              </div>

              {/* Demo Session */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-slate-700 mb-1.5">
                    <Calendar className="size-3.5 text-indigo-600" />
                    <span>Demo Context</span>
                  </div>
                  {demos.length > 0 ? (
                    <div className="space-y-1">
                      <p className="font-extrabold text-slate-900 text-sm">
                        {(demos[0] as any).demoCode}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Status: <span className="font-semibold capitalize">{(demos[0] as any).status}</span>
                      </p>
                    </div>
                  ) : (
                    <p className="text-slate-400 italic">No demos scheduled</p>
                  )}
                </div>
              </div>

              {/* Cohort / Batch Context */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-slate-700 mb-1.5">
                    <Users2 className="size-3.5 text-indigo-600" />
                    <span>Batch Allocation</span>
                  </div>
                  {batchAssignments.length > 0 ? (
                    <div className="space-y-1">
                      <p className="font-extrabold text-slate-900 text-sm">
                        {(batchAssignments[0] as any).batch?.name || "Assigned Batch"}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Status: <span className="font-semibold capitalize">{(batchAssignments[0] as any).status}</span>
                      </p>
                    </div>
                  ) : (
                    <p className="text-slate-400 italic">Not assigned</p>
                  )}
                </div>
              </div>
            </div>
          </DashboardCard>

          {/* Student Document Management & Verification */}
          <StudentDocumentsManager
            studentId={id}
            initialDocuments={JSON.parse(JSON.stringify(documents))}
          />
        </div>

        {/* Sidebar (1 Col) */}
        <div className="flex flex-col gap-6">
          {/* Medical Card */}
          {medical && (
            <DashboardCard title="Medical Information" subtitle="Health records & emergency notes">
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/60">
                  <span className="lms-label text-amber-700 block mb-1 flex items-center gap-1">
                    <Shield className="size-3" /> Allergies
                  </span>
                  <span className="lms-body-sm font-medium text-amber-900">
                    {medical.allergies?.length ? medical.allergies.join(", ") : "None reported"}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="lms-label text-slate-500 block mb-1">Medical Conditions</span>
                  <span className="lms-body-sm font-medium text-slate-800">
                    {medical.medicalConditions?.length ? medical.medicalConditions.join(", ") : "None reported"}
                  </span>
                </div>
              </div>
            </DashboardCard>
          )}

          {/* Timeline Feed */}
          <DashboardCard title="Registration History" subtitle="Audit timeline of student events">
            <div className="flex flex-col gap-4 border-l border-indigo-200 pl-4 ml-2 my-2">
              {timeline.map((item) => (
                <div key={item._id?.toString()} className="relative text-xs">
                  <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-600 ring-4 ring-indigo-50" />
                  <div className="lms-body-sm font-bold text-slate-900 capitalize flex items-center justify-between">
                    <span>{item.event}</span>
                  </div>
                  <div className="lms-caption text-slate-500 mt-0.5">{item.description}</div>
                  <div className="lms-code text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                    <Calendar className="size-2.5" />
                    {new Date(item.timestamp).toLocaleDateString()}
                  </div>
                </div>
              ))}
              {timeline.length === 0 && (
                <p className="lms-caption text-slate-400">No activity recorded yet.</p>
              )}
            </div>
          </DashboardCard>
        </div>
      </div>
    </div>
  );
}
