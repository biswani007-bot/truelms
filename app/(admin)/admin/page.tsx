import React from "react";
import Link from "next/link";
import { connectDB } from "../../../config/db";
import { studentRepository } from "../../../repositories/student.repository";
import { teacherRepository } from "../../../repositories/teacher.repository";
import { courseRepository } from "../../../repositories/course.repository";
import { enrollmentRepository } from "../../../repositories/enrollment.repository";
import { batchRepository } from "../../../repositories/batch.repository";
import { invoiceRepository } from "../../../repositories/invoice.repository";
import { leadRepository } from "../../../repositories/lead.repository";
import { liveClassRepository } from "../../../repositories/live-class.repository";
import AdminExecutiveDashboardCharts from "../../../components/dashboard/AdminExecutiveDashboardCharts";

export const revalidate = 0;

export const metadata = {
  title: "Admin Dashboard | TrueLern",
  description: "Enterprise LMS Admin Console — KPI overview across all modules.",
};

export default async function AdminDashboardPage() {
  await connectDB();

  const [
    students,
    teachers,
    courses,
    enrollments,
    batches,
    invoices,
    leads,
    liveClasses,
  ] = await Promise.all([
    studentRepository.findMany({}),
    teacherRepository.findMany({}),
    courseRepository.findMany({}),
    enrollmentRepository.findMany({}),
    batchRepository.findMany({}),
    invoiceRepository.findMany({}),
    leadRepository.findMany({}),
    liveClassRepository.findMany({}),
  ]);

  const activeStudents = students.filter(
    (s) => (s as any).status === "active"
  ).length;

  const activeEnrollments = enrollments.filter(
    (e) => (e as any).status === "learning-started"
  ).length;

  const activeBatches = batches.filter(
    (b) => (b as any).status === "active"
  ).length;

  const paidInvoices = invoices.filter(
    (inv) => (inv as any).status === "paid"
  );

  const totalRevenue = paidInvoices.reduce(
    (sum, inv) => sum + ((inv as any).totalAmount || 0),
    0
  );

  const todayStr = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const topInstructors = teachers.slice(0, 4).map((t: any) => {
    const user = t.user as any;
    return {
      id: t._id?.toString() || Math.random().toString(),
      name: user ? `${user.firstName || "Faculty"} ${user.lastName || ""}`.trim() : "Instructor",
      role: t.specialization || "Senior Faculty",
    };
  });

  const courseCounts = courses.length;

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-8">
      {/* Row 1 - Top Command Row */}
      <div className="grid grid-cols-12 gap-4 items-stretch">
        {/* Hero Banner */}
        <div 
          className="col-span-12 lg:col-span-8 rounded-2xl p-6 text-white relative overflow-hidden flex flex-col justify-between shadow-xl shadow-purple-950/20" 
          style={{ background: "linear-gradient(135deg, #150937 0%, #200D56 45%, #2E127B 80%, #3B1499 100%)" }}
        >
          <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-purple-500/20 blur-3xl pointer-events-none"></div>
          <div className="absolute right-48 top-4 w-32 h-32 rounded-full bg-indigo-400/10 blur-2xl pointer-events-none"></div>
          
          <div className="relative z-10 max-w-[62%]">
            <h2 className="text-2xl font-bold tracking-tight text-white leading-snug">
              Platform Operational Update:<br/>All Systems Go!
            </h2>
            <p className="text-xs text-purple-200/80 font-medium mt-1.5 flex items-center gap-1.5">
              <span>{todayStr}</span>
            </p>
          </div>

          <div className="relative z-10 flex items-center gap-8 mt-5 pt-3 border-t border-purple-400/20">
            <div>
              <p className="text-[11px] text-purple-200 font-medium">Total Students</p>
              <p className="text-2xl font-extrabold text-white tracking-tight mt-0.5">{students.length}</p>
            </div>
            <div className="h-8 w-px bg-purple-400/30"></div>
            <div>
              <p className="text-[11px] text-purple-200 font-medium">Total Teachers</p>
              <p className="text-2xl font-extrabold text-white tracking-tight mt-0.5">{teachers.length}</p>
            </div>
          </div>
          
          {/* Graduates SVG Illustration placeholder */}
          <div className="absolute right-4 bottom-0 top-2 w-[34%] flex items-end justify-center pointer-events-none select-none z-10 opacity-70">
            <img src="/Truelernlogo_favicon.png" alt="Hero Graphic" className="h-24 w-auto object-contain" />
          </div>
        </div>

        {/* Ready to Expand Card */}
        <div className="col-span-12 lg:col-span-4 dashboard-card p-5 flex flex-col justify-between bg-gradient-to-b from-white to-[#F6F8FD] shadow-sm">
          <div className="text-center">
            <h3 className="text-base font-bold text-slate-900 tracking-tight">Ready to Expand Your Offerings?</h3>
            <Link href="/admin/courses" className="mt-3 w-full py-2 px-4 rounded-xl text-white text-xs font-semibold shadow-md shadow-purple-600/25 flex items-center justify-center gap-1.5 transition hover:opacity-95" style={{ background: "linear-gradient(135deg, #6018E0 0%, #7622F5 100%)" }}>
              <span className="text-sm font-bold">+</span>
              <span>New Course</span>
            </Link>
          </div>
          
          <div className="grid grid-cols-2 gap-2.5 mt-4">
            <div className="bg-slate-100/80 rounded-xl p-2.5 text-center border border-slate-200/60">
              <p className="text-[10px] text-slate-500 font-medium leading-snug">Active Courses In Progress</p>
              <p className="text-2xl font-bold text-slate-900 mt-0.5">{courseCounts}</p>
            </div>
            <div className="bg-slate-100/80 rounded-xl p-2.5 text-center border border-slate-200/60">
              <p className="text-[10px] text-slate-500 font-medium leading-snug">Pending Leads / Enrollments</p>
              <p className="text-2xl font-bold text-slate-900 mt-0.5">{leads.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2 & 3 Client Charts Container */}
      <AdminExecutiveDashboardCharts 
        studentsCount={students.length}
        enrollmentsCount={enrollments.length}
        leadsCount={leads.length}
        revenueTotal={totalRevenue}
        teachersData={topInstructors}
        activeBatches={activeBatches}
        coursesCount={courseCounts}
      />
    </div>
  );
}
