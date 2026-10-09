/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * AnalyticsService
 *
 * READ-ONLY aggregation engine. Consumes published data from existing models.
 * NEVER modifies business data.
 */
import { Student } from "../../models/student.model";
import { Teacher } from "../../models/teacher.model";
import { Course } from "../../models/course.model";
import { Enrollment } from "../../models/enrollment.model";
import { Lead } from "../../models/lead.model";
import { Cohort } from "../../models/cohort.model";
import { Batch } from "../../models/batch.model";
import { BatchStudent } from "../../models/batch-student.model";
import { LiveClass } from "../../models/live-class.model";
import { Attendance } from "../../models/attendance.model";
import { Assignment } from "../../models/assignment.model";
import { AssignmentSubmission } from "../../models/assignment-submission.model";
import { Assessment } from "../../models/assessment.model";
import { AssessmentResult } from "../../models/assessment-result.model";
import { Certificate } from "../../models/certificate.model";
import { Invoice } from "../../models/invoice.model";
import { Payment } from "../../models/payment.model";
import { Refund } from "../../models/refund.model";

export class AnalyticsService {
  /**
   * Executive Summary — aggregates KPIs across all modules
   */
  static async getExecutiveSummary() {
    const [
      totalStudents,
      activeStudents,
      totalTeachers,
      totalCourses,
      totalEnrollments,
      activeEnrollments,
      totalLeads,
      convertedLeads,
      totalCohorts,
      activeCohorts,
      totalBatches,
      totalLiveClasses,
      totalAttendanceRecords,
      presentAttendanceRecords,
      totalSubmissions,
      totalAssessmentResults,
      passedResults,
      totalCertificates,
      issuedCertificates,
      invoices,
      successfulPayments,
      approvedRefunds,
    ] = await Promise.all([
      Student.countDocuments({ isDeleted: false }),
      Student.countDocuments({ isDeleted: false, status: "ACTIVE" }),
      Teacher.countDocuments({ isDeleted: false }),
      Course.countDocuments({ isDeleted: false }),
      Enrollment.countDocuments({ isDeleted: false }),
      Enrollment.countDocuments({ isDeleted: false, status: "active" }),
      Lead.countDocuments({ isDeleted: false }),
      Lead.countDocuments({ isDeleted: false, status: "converted" }),
      Cohort.countDocuments({ isDeleted: false }),
      Cohort.countDocuments({ isDeleted: false, status: { $in: ["running", "confirmed"] } }),
      Batch.countDocuments({ isDeleted: false }),
      LiveClass.countDocuments({ isDeleted: false }),
      Attendance.countDocuments({ isDeleted: false }),
      Attendance.countDocuments({ isDeleted: false, attendanceStatus: "present" }),
      AssignmentSubmission.countDocuments({ isDeleted: false }),
      AssessmentResult.countDocuments({ isDeleted: false }),
      AssessmentResult.countDocuments({ isDeleted: false, passed: true }),
      Certificate.countDocuments({ isDeleted: false }),
      Certificate.countDocuments({ isDeleted: false, status: "issued" }),
      Invoice.find({ isDeleted: false }).lean().then(docs => docs),
      Payment.countDocuments({ isDeleted: false, status: "success" }),
      Refund.countDocuments({ isDeleted: false, status: "approved" }),
    ]);

    const totalRevenue = (invoices as any[]).reduce((sum: number, inv: any) => sum + (inv.totalAmount || 0), 0);
    const totalOutstanding = (invoices as any[]).reduce((sum: number, inv: any) => sum + (inv.outstandingAmount || 0), 0);

    const attendanceRate = totalAttendanceRecords > 0
      ? Math.round((presentAttendanceRecords / totalAttendanceRecords) * 100)
      : 0;

    const assessmentPassRate = totalAssessmentResults > 0
      ? Math.round((passedResults / totalAssessmentResults) * 100)
      : 0;

    const leadConversionRate = totalLeads > 0
      ? Math.round((convertedLeads / totalLeads) * 100)
      : 0;

    const certificateIssuanceRate = totalCertificates > 0
      ? Math.round((issuedCertificates / totalCertificates) * 100)
      : 0;

    return {
      students: {
        total: totalStudents,
        active: activeStudents,
        inactive: totalStudents - activeStudents,
      },
      teachers: {
        total: totalTeachers,
      },
      courses: {
        total: totalCourses,
      },
      enrollments: {
        total: totalEnrollments,
        active: activeEnrollments,
      },
      admissions: {
        totalLeads,
        convertedLeads,
        conversionRate: leadConversionRate,
      },
      cohorts: {
        total: totalCohorts,
        active: activeCohorts,
      },
      batches: {
        total: totalBatches,
      },
      academic: {
        totalLiveClasses,
        attendanceRate,
        totalSubmissions,
        assessmentPassRate,
      },
      certificates: {
        total: totalCertificates,
        issued: issuedCertificates,
        issuanceRate: certificateIssuanceRate,
      },
      finance: {
        totalRevenue,
        totalOutstanding,
        successfulPayments,
        approvedRefunds,
        collectionRate: totalRevenue > 0
          ? Math.round(((totalRevenue - totalOutstanding) / totalRevenue) * 100)
          : 0,
      },
    };
  }

  /**
   * Admissions KPIs — lead funnel, conversion, this-month intake
   */
  static async getAdmissionsKPIs(dateFrom?: Date, dateTo?: Date) {
    const dateFilter: any = {};
    if (dateFrom || dateTo) {
      dateFilter.createdAt = {};
      if (dateFrom) dateFilter.createdAt.$gte = dateFrom;
      if (dateTo) dateFilter.createdAt.$lte = dateTo;
    }

    // This month
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [
      totalLeads,
      newLeadsThisMonth,
      convertedLeads,
      enrollmentsThisMonth,
      leadsByStatus,
    ] = await Promise.all([
      Lead.countDocuments({ isDeleted: false, ...dateFilter }),
      Lead.countDocuments({ isDeleted: false, createdAt: { $gte: monthStart } }),
      Lead.countDocuments({ isDeleted: false, status: "converted", ...dateFilter }),
      Enrollment.countDocuments({ isDeleted: false, createdAt: { $gte: monthStart } }),
      Lead.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
    ]);

    return {
      totalLeads,
      newLeadsThisMonth,
      convertedLeads,
      enrollmentsThisMonth,
      conversionRate: totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0,
      funnelByStatus: leadsByStatus.reduce((acc: Record<string, number>, item: any) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      chartMetadata: {
        type: "bar",
        dataKey: "admissions-funnel",
        labels: leadsByStatus.map((s: any) => s._id),
        datasets: [{ label: "Leads by Status", data: leadsByStatus.map((s: any) => s.count) }],
      },
    };
  }

  /**
   * Academic KPIs — attendance, assignments, assessments
   */
  static async getAcademicKPIs() {
    const [
      totalLiveClasses,
      completedClasses,
      totalAttendance,
      presentAttendance,
      totalAssignments,
      publishedAssignments,
      totalSubmissions,
      totalResults,
      passedResults,
      attendanceByMonth,
    ] = await Promise.all([
      LiveClass.countDocuments({ isDeleted: false }),
      LiveClass.countDocuments({ isDeleted: false, status: "completed" }),
      Attendance.countDocuments({ isDeleted: false }),
      Attendance.countDocuments({ isDeleted: false, attendanceStatus: "present" }),
      Assignment.countDocuments({ isDeleted: false }),
      Assignment.countDocuments({ isDeleted: false, status: "published" }),
      AssignmentSubmission.countDocuments({ isDeleted: false }),
      AssessmentResult.countDocuments({ isDeleted: false }),
      AssessmentResult.countDocuments({ isDeleted: false, passed: true }),
      Attendance.aggregate([
        { $match: { isDeleted: false } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
            total: { $sum: 1 },
            present: { $sum: { $cond: [{ $eq: ["$attendanceStatus", "present"] }, 1, 0] } },
          },
        },
        { $sort: { _id: 1 } },
        { $limit: 12 },
      ]),
    ]);

    const attendanceRate = totalAttendance > 0 ? Math.round((presentAttendance / totalAttendance) * 100) : 0;
    const submissionRate = publishedAssignments > 0 ? Math.round((totalSubmissions / publishedAssignments) * 100) : 0;
    const passRate = totalResults > 0 ? Math.round((passedResults / totalResults) * 100) : 0;

    return {
      liveClasses: { total: totalLiveClasses, completed: completedClasses },
      attendance: { total: totalAttendance, present: presentAttendance, rate: attendanceRate },
      assignments: { total: totalAssignments, published: publishedAssignments, submissions: totalSubmissions, submissionRate },
      assessments: { total: totalResults, passed: passedResults, passRate },
      chartMetadata: {
        attendance: {
          type: "line",
          dataKey: "attendance-trend",
          labels: attendanceByMonth.map((m: any) => m._id),
          datasets: [
            { label: "Total", data: attendanceByMonth.map((m: any) => m.total) },
            { label: "Present", data: attendanceByMonth.map((m: any) => m.present) },
          ],
        },
        rates: {
          type: "pie",
          dataKey: "academic-rates",
          labels: ["Attendance %", "Submission %", "Pass %"],
          datasets: [{ label: "Rates", data: [attendanceRate, submissionRate, passRate] }],
        },
      },
    };
  }

  /**
   * Finance KPIs — revenue, outstanding, refund rate, collection rate
   */
  static async getFinanceKPIs() {
    const [
      invoices,
      payments,
      refunds,
      revenueByMonth,
    ] = await Promise.all([
      Invoice.find({ isDeleted: false }).lean(),
      Payment.find({ isDeleted: false, status: "success" }).lean(),
      Refund.find({ isDeleted: false, status: "approved" }).lean(),
      Payment.aggregate([
        { $match: { isDeleted: false, status: "success" } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m", date: "$paymentDate" } },
            total: { $sum: "$amount" },
          },
        },
        { $sort: { _id: 1 } },
        { $limit: 12 },
      ]),
    ]);

    const totalRevenue = (invoices as any[]).reduce((s: number, i: any) => s + (i.totalAmount || 0), 0);
    const totalOutstanding = (invoices as any[]).reduce((s: number, i: any) => s + (i.outstandingAmount || 0), 0);
    const totalCollected = (payments as any[]).reduce((s: number, p: any) => s + (p.amount || 0), 0);
    const totalRefunded = (refunds as any[]).reduce((s: number, r: any) => s + (r.amount || 0), 0);

    const collectionRate = totalRevenue > 0 ? Math.round((totalCollected / totalRevenue) * 100) : 0;
    const refundRate = totalCollected > 0 ? Math.round((totalRefunded / totalCollected) * 100) : 0;

    const invoicesByStatus = (invoices as any[]).reduce((acc: Record<string, number>, inv: any) => {
      acc[inv.status] = (acc[inv.status] || 0) + 1;
      return acc;
    }, {});

    return {
      revenue: { total: totalRevenue, outstanding: totalOutstanding, collected: totalCollected },
      refunds: { total: totalRefunded, count: (refunds as any[]).length },
      rates: { collectionRate, refundRate },
      invoicesByStatus,
      chartMetadata: {
        revenueTrend: {
          type: "area",
          dataKey: "revenue-trend",
          labels: revenueByMonth.map((m: any) => m._id),
          datasets: [{ label: "Collections ($)", data: revenueByMonth.map((m: any) => m.total) }],
        },
        invoiceStatus: {
          type: "pie",
          dataKey: "invoice-status",
          labels: Object.keys(invoicesByStatus),
          datasets: [{ label: "Invoices", data: Object.values(invoicesByStatus) }],
        },
      },
    };
  }

  /**
   * Teacher KPIs — workload, batch utilization
   */
  static async getTeacherKPIs() {
    const [
      totalTeachers,
      totalBatches,
      batchStudents,
      classesPerTeacher,
    ] = await Promise.all([
      Teacher.countDocuments({ isDeleted: false }),
      Batch.countDocuments({ isDeleted: false }),
      BatchStudent.countDocuments({ isDeleted: false }),
      LiveClass.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: "$teacher", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
    ]);

    const avgClassesPerTeacher = totalTeachers > 0
      ? Math.round(classesPerTeacher.reduce((s: number, t: any) => s + t.count, 0) / totalTeachers)
      : 0;

    const avgStudentsPerBatch = totalBatches > 0 ? Math.round(batchStudents / totalBatches) : 0;

    return {
      totalTeachers,
      totalBatches,
      avgClassesPerTeacher,
      avgStudentsPerBatch,
      batchUtilization: avgStudentsPerBatch,
      chartMetadata: {
        workload: {
          type: "bar",
          dataKey: "teacher-workload",
          labels: classesPerTeacher.map((_: any, i: number) => `Teacher ${i + 1}`),
          datasets: [{ label: "Classes Conducted", data: classesPerTeacher.map((t: any) => t.count) }],
        },
      },
    };
  }
}
