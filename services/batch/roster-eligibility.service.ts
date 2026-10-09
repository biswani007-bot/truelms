/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose from "mongoose";
import { Batch } from "../../models/batch.model";
import { Enrollment } from "../../models/enrollment.model";
import { BatchStudent } from "../../models/batch-student.model";

export interface IEligibleStudentDto {
  _id: string;
  studentId: string;
  code: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone?: string;
  enrollmentId: string;
  enrollmentNumber: string;
  enrollmentStatus: string;
  courseId: string;
  courseName: string;
  courseCode?: string;
  cohortId?: string;
  cohortName?: string;
  isPaid: boolean;
  isEligible: boolean;
}

export class RosterEligibilityService {
  /**
   * Authoritative resolver for students eligible for assignment to a batch.
   * Evaluates batch course, excludes already-assigned students, requires paid/confirmed enrollment.
   */
  static async getEligibleStudentsForBatch(batchId: string, search?: string) {
    if (!mongoose.isValidObjectId(batchId)) {
      return null;
    }

    const batch = await Batch.findById(batchId).populate(["course", "cohort"]);
    if (!batch || (batch as any).isDeleted) {
      return null;
    }

    const courseId = (batch.course as any)?._id || batch.course;
    const cohortId = (batch.cohort as any)?._id || batch.cohort;

    // 1. Find all students already actively assigned to this batch
    const existingAssignments = await BatchStudent.find({
      batch: batch._id,
      status: "active",
      isDeleted: { $ne: true },
    }).select("student");
    const assignedStudentIds = new Set(existingAssignments.map((a: any) => a.student.toString()));

    // 2. Query valid confirmed enrollments for the batch's course
    // Unpaid ('waiting-payment'), cancelled, and refunded enrollments are strictly excluded
    const enrollments = await Enrollment.find({
      course: courseId,
      status: { $in: ["confirmed", "batch-assigned", "learning-started"] },
      isDeleted: { $ne: true },
    })
      .populate([
        { path: "student", populate: { path: "user", select: "email firstName lastName" } },
        { path: "course", select: "courseName courseCode" },
      ])
      .sort({ enrollmentDate: -1 });

    const eligibleList: IEligibleStudentDto[] = [];
    const seenStudentIds = new Set<string>();

    for (const enr of enrollments) {
      const student = enr.student as any;
      if (!student || !student._id) continue;
      const studentIdStr = student._id.toString();

      // Exclude if already assigned to this batch
      if (assignedStudentIds.has(studentIdStr)) continue;

      // Deduplicate (one entry per student)
      if (seenStudentIds.has(studentIdStr)) continue;
      seenStudentIds.add(studentIdStr);

      // Filter by search query if provided (name, studentId, email, phone)
      if (search && search.trim()) {
        const q = search.trim().toLowerCase();
        const fullName = `${student.firstName || ""} ${student.lastName || ""}`.toLowerCase();
        const code = (student.studentId || student.admissionNumber || "").toLowerCase();
        const email = (student.email || student.user?.email || "").toLowerCase();
        const phone = (student.phone || "").toLowerCase();
        const enrNo = (enr.enrollmentNumber || "").toLowerCase();
        if (
          !fullName.includes(q) &&
          !code.includes(q) &&
          !email.includes(q) &&
          !phone.includes(q) &&
          !enrNo.includes(q)
        ) {
          continue;
        }
      }

      const courseRef = enr.course as any;
      const cohortRef = batch.cohort as any;

      eligibleList.push({
        _id: student._id.toString(),
        studentId: student._id.toString(),
        code: student.studentId || student.admissionNumber || "",
        firstName: student.firstName || "",
        lastName: student.lastName || "",
        name: `${student.firstName || ""} ${student.lastName || ""}`.trim(),
        email: student.email || student.user?.email || "",
        phone: student.phone || "",
        enrollmentId: enr._id.toString(),
        enrollmentNumber: enr.enrollmentNumber || "",
        enrollmentStatus: enr.status,
        courseId: courseId.toString(),
        courseName:
          courseRef?.courseName ||
          courseRef?.name ||
          (batch.course as any)?.courseName ||
          "Course",
        courseCode: courseRef?.courseCode || (batch.course as any)?.courseCode || "",
        cohortId: cohortId ? cohortId.toString() : undefined,
        cohortName: cohortRef?.cohortName || cohortRef?.name || undefined,
        isPaid: true,
        isEligible: true,
      });
    }

    return { batch, eligibleStudents: eligibleList };
  }
}
