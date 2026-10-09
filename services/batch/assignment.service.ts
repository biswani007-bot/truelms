/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * AssignmentService
 * Handles student assignment to batches using Rule Engine decisions.
 */
import { batchStudentRepository } from "../../repositories/batch-student.repository";
import { batchTimelineRepository } from "../../repositories/batch-timeline.repository";
import { BatchStudent } from "../../models/batch-student.model";
import { CapacityService } from "./capacity.service";
import { RuleEngineService } from "./rule-engine.service";
import { WaitingListService } from "./waiting-list.service";

export interface IAssignStudentInput {
  batchId: string;
  studentId: string;
  enrollmentId: string;
  userId?: string;
  forceManual?: boolean;
  priority?: "normal" | "high" | "urgent";
}

export class AssignmentService {
  /**
   * Smart assign: evaluates rules, assigns directly or routes to waiting list
   */
  static async assignStudent(input: IAssignStudentInput) {
    const { batchId, studentId, enrollmentId, userId, forceManual = false, priority = "normal" } = input;

    // Check for duplicate assignment
    const existing = await batchStudentRepository.findOne({ batch: batchId, student: studentId });
    if (existing) throw new Error("Student is already assigned to this batch");

    const canAssign = await RuleEngineService.canAssignDirectly(batchId);

    if (canAssign) {
      // Direct assignment
      const assignment = await batchStudentRepository.create({
        batch: batchId as any,
        student: studentId as any,
        enrollment: enrollmentId as any,
        assignedAt: new Date(),
        assignedBy: userId as any,
        assignmentType: forceManual ? "manual" : "automatic",
        status: "active",
      });

      await CapacityService.incrementStrength(batchId);

      await batchTimelineRepository.create({
        batch: batchId as any,
        event: "student-assigned",
        description: `Student assigned to batch (${forceManual ? "manual" : "automatic"} assignment)`,
        performedBy: userId as any,
        referenceId: studentId as any,
        referenceType: "student",
      });

      // Check if near-full warning should be generated
      await RuleEngineService.checkCapacityWarning(batchId, userId);

      return { type: "assigned", assignment };
    }

    // Cannot assign – check waiting list
    const shouldWait = await RuleEngineService.shouldAddToWaitingList(batchId);
    if (shouldWait) {
      const entry = await WaitingListService.addToWaitingList(batchId, studentId, enrollmentId, {
        priority,
        userId,
      });
      return { type: "waiting-list", entry };
    }

    throw new Error("Batch is full and waiting list is disabled. Cannot assign student.");
  }

  /**
   * Remove a student from a batch and release their seat
   */
  static async removeStudent(batchId: string, studentId: string, userId?: string) {
    const assignment = await batchStudentRepository.findOne({ batch: batchId, student: studentId });
    if (!assignment) throw new Error("Assignment not found");

    await BatchStudent.findOneAndUpdate(
      { batch: batchId, student: studentId },
      { status: "removed" }
    );

    await CapacityService.decrementStrength(batchId);

    await batchTimelineRepository.create({
      batch: batchId as any,
      event: "student-removed",
      description: `Student removed from batch`,
      performedBy: userId as any,
      referenceId: studentId as any,
      referenceType: "student",
    });

    // Rule: SEAT_RELEASED – check for auto-promote
    const shouldAutoPromote = await RuleEngineService.shouldAutoPromote(batchId);
    if (shouldAutoPromote) {
      await WaitingListService.autoPromoteNext(batchId);
    }

    return { type: "removed" };
  }

  /**
   * Swap two students between batches
   */
  static async swapStudents(
    batchAId: string,
    studentAId: string,
    batchBId: string,
    studentBId: string,
    userId?: string
  ) {
    // Remove A from batch A, assign to batch B (and vice versa)
    const assignmentA = await batchStudentRepository.findOne({ batch: batchAId, student: studentAId });
    const assignmentB = await batchStudentRepository.findOne({ batch: batchBId, student: studentBId });

    if (!assignmentA || !assignmentB) throw new Error("One or both assignments not found");

    // Update batch references
    await BatchStudent.findByIdAndUpdate(assignmentA._id, { batch: batchBId as any });
    await BatchStudent.findByIdAndUpdate(assignmentB._id, { batch: batchAId as any });

    await batchTimelineRepository.create({
      batch: batchAId as any,
      event: "student-swapped",
      description: `Student swapped with another batch`,
      performedBy: userId as any,
      referenceId: studentAId as any,
      referenceType: "student",
    });

    await batchTimelineRepository.create({
      batch: batchBId as any,
      event: "student-swapped",
      description: `Student swapped with another batch`,
      performedBy: userId as any,
      referenceId: studentBId as any,
      referenceType: "student",
    });

    return { type: "swapped" };
  }
}
