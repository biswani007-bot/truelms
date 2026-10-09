/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { teacherRepository } from "../../../../../repositories/teacher.repository";
import { teacherAvailabilityRepository } from "../../../../../repositories/teacher-availability.repository";
import { teacherLeaveRepository } from "../../../../../repositories/teacher-leave.repository";
import { teacherPerformanceRepository } from "../../../../../repositories/teacher-performance.repository";
import { connectDB } from "../../../../../config/db";
import { WorkspaceHeader } from "@/components/workspace/WorkspaceHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { DashboardCard } from "@/components/ui/DashboardCard";
import { ArrowLeft, UsersRound, Calendar, Clock, Star, Award, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { AdminTeacherActions } from "@/components/admin/AdminTeacherActions";

interface TeacherDetailsPageProps {
  params: Promise<{ id: string }>;
}

export const revalidate = 0;

export default async function TeacherDetailsPage({ params }: TeacherDetailsPageProps) {
  await connectDB();
  const { id } = await params;

  const teacher = await teacherRepository.findById(id, { populate: "user" });
  if (!teacher) {
    return (
      <div className="py-20 text-center text-slate-500 font-medium">
        Teacher profile not found.{" "}
        <Link href="/admin/teachers" className="text-indigo-600 font-semibold hover:underline">
          Back to Faculty
        </Link>
      </div>
    );
  }

  // Load sub-documents
  const availability = await teacherAvailabilityRepository.findOne({ teacher: id });
  const leaves = await teacherLeaveRepository.findMany({ teacher: id });
  const performance = await teacherPerformanceRepository.findOne({ teacher: id });

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  return (
    <div className="flex flex-col gap-8 max-w-7xl">
      {/* Enterprise Workspace Header */}
      <WorkspaceHeader
        entityName={`${teacher.firstName} ${teacher.lastName}`}
        status={teacher.status}
        entityId={teacher.teacherCode}
        createdDate={new Date(teacher.joiningDate).toLocaleDateString()}
        moduleIcon={<UsersRound className="size-5" />}
        breadcrumb={[
          { label: "Dashboard", href: "/admin" },
          { label: "Faculty", href: "/admin/teachers" },
          { label: `${teacher.firstName} ${teacher.lastName}` },
        ]}
        description={`${teacher.designation || "Faculty Member"} · ${teacher.department || "General"} Department`}
        secondaryActions={
          <div className="flex gap-2 items-center">
            <AdminTeacherActions teacher={JSON.parse(JSON.stringify(teacher))} />
            <Link
              href="/admin/teachers"
              className="inline-flex items-center gap-1.5 px-3 py-2 lms-button-text text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors"
            >
              <ArrowLeft className="size-4" />
              Back to Faculty
            </Link>
          </div>
        }
      />

      {/* Performance KPI Cards */}
      {performance && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <DashboardCard title="Average Rating" variant="metric">
            <div className="flex items-center gap-2">
              <Star className="size-5 text-amber-500 fill-amber-500" />
              <div className="lms-metric text-indigo-600">{performance.averageRating}</div>
            </div>
            <p className="lms-caption mt-1">Out of 5.0 rating scale</p>
          </DashboardCard>

          <DashboardCard title="Evaluations" variant="metric">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-5 text-emerald-500" />
              <div className="lms-metric text-emerald-600">{performance.assignmentsEvaluatedCount}</div>
            </div>
            <p className="lms-caption mt-1">Submissions evaluated</p>
          </DashboardCard>

          <DashboardCard title="Completion Rate" variant="metric">
            <div className="flex items-center gap-2">
              <Award className="size-5 text-sky-500" />
              <div className="lms-metric text-sky-600">{performance.courseCompletionRate}%</div>
            </div>
            <p className="lms-caption mt-1">Curriculum delivery rate</p>
          </DashboardCard>

          <DashboardCard title="Avg Response Time" variant="metric">
            <div className="flex items-center gap-2">
              <Clock className="size-5 text-amber-500" />
              <div className="lms-metric text-amber-600">{performance.averageResponseTimeMinutes}m</div>
            </div>
            <p className="lms-caption mt-1">Doubt resolution SLA</p>
          </DashboardCard>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Core Profile & Leaves (2 Cols) */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          <DashboardCard title="Professional Profile" subtitle="Employment contracts, skills mapping, and tenure">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="lms-label text-slate-400 block mb-1">Employee ID</span>
                <span className="lms-code font-bold text-slate-900">{teacher.employeeId}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="lms-label text-slate-400 block mb-1">Employment Type</span>
                <span className="lms-body-sm font-semibold uppercase tracking-wider text-slate-800">
                  {teacher.employmentType}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="lms-label text-slate-400 block mb-1">Teaching Experience</span>
                <span className="lms-body-sm font-semibold text-slate-900">{teacher.experienceYears} Years</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="lms-label text-slate-400 block mb-1">Joining Date</span>
                <span className="lms-code font-medium text-slate-800">
                  {new Date(teacher.joiningDate).toLocaleDateString()}
                </span>
              </div>
              <div className="col-span-full p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="lms-label text-slate-400 block mb-2">Areas of Expertise & Skills</span>
                <div className="flex flex-wrap gap-2">
                  {teacher.skills.map((skill: string) => (
                    <span
                      key={skill}
                      className="px-2.5 py-1 rounded-lg bg-white text-slate-700 text-xs font-semibold border border-slate-200 shadow-xs"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </DashboardCard>

          {/* Leaves History */}
          <DashboardCard title="Leave Records" subtitle="Historical time-off requests and leave balance logs">
            <div className="flex flex-col gap-3">
              {leaves.map((leave) => (
                <div
                  key={leave._id?.toString()}
                  className="flex justify-between items-center p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs"
                >
                  <div>
                    <div className="lms-body-sm font-bold text-slate-900 capitalize">
                      Leave Type: {leave.leaveType}
                    </div>
                    <div className="lms-code text-slate-500 mt-1 flex items-center gap-1">
                      <Calendar className="size-3" />
                      {new Date(leave.startDate).toLocaleDateString()} -{" "}
                      {new Date(leave.endDate).toLocaleDateString()}
                    </div>
                  </div>
                  <StatusBadge status={leave.status} showDot />
                </div>
              ))}
              {leaves.length === 0 && (
                <p className="lms-caption text-slate-400 py-2">No leave records logged.</p>
              )}
            </div>
          </DashboardCard>
        </div>

        {/* Sidebar: Weekly Schedule (1 Col) */}
        <DashboardCard title="Weekly Availability" subtitle="Configured working slots for live cohort sessions">
          <div className="flex flex-col gap-2.5">
            {availability?.weeklySchedule.map((slot: any, idx: number) => (
              <div
                key={idx}
                className="flex justify-between items-center p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs"
              >
                <span className="lms-body-sm font-semibold text-slate-700">{dayNames[slot.dayOfWeek]}</span>
                <span className="lms-code font-bold text-indigo-600">
                  {slot.startTime} - {slot.endTime}
                </span>
              </div>
            ))}
            {(!availability || availability.weeklySchedule.length === 0) && (
              <p className="lms-caption text-slate-400 py-4 text-center">No working slots configured.</p>
            )}
          </div>
        </DashboardCard>
      </div>
    </div>
  );
}
