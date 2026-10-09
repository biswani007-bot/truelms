/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * TransferService
 * Handles student/teacher transfers, batch merge, batch split.
 */
import { batchStudentRepository } from "../../repositories/batch-student.repository";
import { batchTeacherRepository } from "../../repositories/batch-teacher.repository";
import { batchTimelineRepository } from "../../repositories/batch-timeline.repository";
import { BatchStudent } from "../../models/batch-student.model";
import { BatchTeacher } from "../../models/batch-teacher.model";
import { CapacityService } from "./capacity.service";
import { RuleEngineService } from "./rule-engine.service";
import { WaitingListService } from "./waiting-list.service";

export class TransferService {
  /**
   * Transfer a student from one batch to another
   */
  static async transferStudent(
    fromBatchId: string,
    studentId: string,
    toBatchId: string,
    userId?: string
  ) {
    const assignment = await batchStudentRepository.findOne({ batch: fromBatchId, student: studentId });
    if (!assignment) throw new Error("Student assignment not found in source batch");

    // Check capacity in destination batch
    const canAssign = await RuleEngineService.canAssignDirectly(toBatchId);
    if (!canAssign) throw new Error("Destination batch is full. Transfer not possible.");

    // Mark source batch assignment as transferred (keeping batch: fromBatchId so it appears in transferred list)
    await BatchStudent.findByIdAndUpdate(assignment._id, {
      status: "transferred",
    });

    // Ensure enrollment ID is present
    let enrollmentId = assignment.enrollment;
    if (!enrollmentId) {
      const { Enrollment } = await import("../../models/enrollment.model");
      const enr = await Enrollment.findOne({ student: studentId, isDeleted: { $ne: true } });
      if (enr) {
        enrollmentId = enr._id;
      }
    }

    // Upsert or create in destination batch
    const existingDest = await BatchStudent.findOne({ batch: toBatchId, student: studentId });
    if (existingDest) {
      await BatchStudent.findByIdAndUpdate(existingDest._id, {
        status: "active",
        assignedAt: new Date(),
        assignedBy: userId as any,
        assignmentType: "manual",
        enrollment: enrollmentId as any,
      });
    } else {
      await batchStudentRepository.create({
        batch: toBatchId as any,
        student: studentId as any,
        enrollment: enrollmentId as any,
        assignedAt: new Date(),
        assignedBy: userId as any,
        assignmentType: "manual",
        status: "active",
      });
    }

    // Capacity adjustments
    await CapacityService.decrementStrength(fromBatchId);
    await CapacityService.incrementStrength(toBatchId);

    // Timeline logs on both batches
    await batchTimelineRepository.create({
      batch: fromBatchId as any,
      event: "student-transferred",
      description: `Student transferred out to batch ${toBatchId}`,
      performedBy: userId as any,
      referenceId: studentId as any,
      referenceType: "student",
      metadata: { destination: toBatchId },
    });

    await batchTimelineRepository.create({
      batch: toBatchId as any,
      event: "student-transferred",
      description: `Student transferred in from batch ${fromBatchId}`,
      performedBy: userId as any,
      referenceId: studentId as any,
      referenceType: "student",
      metadata: { source: fromBatchId },
    });

    // Check auto-promote from source batch waiting list
    const shouldAutoPromote = await RuleEngineService.shouldAutoPromote(fromBatchId);
    if (shouldAutoPromote) {
      await WaitingListService.autoPromoteNext(fromBatchId);
    }

    return { type: "transferred", from: fromBatchId, to: toBatchId };
  }

  /**
   * Transfer a teacher from one batch to another role
   */
  static async transferTeacher(
    fromBatchId: string,
    teacherId: string,
    toBatchId: string,
    role: "primary" | "assistant" | "mentor",
    userId?: string
  ) {
    const assignment = await batchTeacherRepository.findOne({ batch: fromBatchId, teacher: teacherId });
    if (!assignment) throw new Error("Teacher assignment not found in source batch");

    await BatchTeacher.findByIdAndUpdate(assignment._id, { status: "removed" });

    await batchTeacherRepository.create({
      batch: toBatchId as any,
      teacher: teacherId as any,
      role,
      assignedAt: new Date(),
      assignedBy: userId as any,
      isOverride: true,
      status: "active",
    });

    await batchTimelineRepository.create({
      batch: fromBatchId as any,
      event: "teacher-removed",
      description: `Teacher transferred to batch ${toBatchId}`,
      performedBy: userId as any,
      referenceId: teacherId as any,
      referenceType: "teacher",
    });

    await batchTimelineRepository.create({
      batch: toBatchId as any,
      event: "teacher-assigned",
      description: `Teacher transferred from batch ${fromBatchId} as ${role}`,
      performedBy: userId as any,
      referenceId: teacherId as any,
      referenceType: "teacher",
    });

    return { type: "teacher-transferred" };
  }
}
