/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * RecommendationService
 * Generates advisory recommendations only. NEVER auto-executes actions.
 */
import { batchRecommendationRepository } from "../../repositories/batch-recommendation.repository";
import { batchRepository } from "../../repositories/batch.repository";
import { batchStudentRepository } from "../../repositories/batch-student.repository";
import { CapacityService } from "./capacity.service";
import { IBatchRecommendation } from "../../models/batch-recommendation.model";

export class RecommendationService {
  /**
   * Run full recommendation scan for a batch
   */
  static async scanBatch(batchId: string): Promise<IBatchRecommendation[]> {
    const batch = await batchRepository.findById(batchId);
    if (!batch) throw new Error(`Batch ${batchId} not found`);

    const snapshot = await CapacityService.getSnapshot(batchId);
    const created: IBatchRecommendation[] = [];

    // 1. Nearly full
    if (snapshot.utilizationPercent >= 80 && !snapshot.isFull) {
      const rec = await batchRecommendationRepository.create({
        batch: batchId as any,
        type: "nearly-full",
        title: "Batch Nearly Full",
        message: `Batch is at ${snapshot.utilizationPercent}% capacity. Consider opening a parallel batch.`,
        severity: "warning",
        isResolved: false,
        triggeredByRule: "CAPACITY_WARNING",
      });
      created.push(rec as any);
    }

    // 2. Fully at max capacity
    if (snapshot.isFull) {
      const rec = await batchRecommendationRepository.create({
        batch: batchId as any,
        type: "capacity-warning",
        title: "Batch at Maximum Capacity",
        message: `Batch is full (${snapshot.maxCapacity} seats). ${snapshot.waitingCount} student(s) are on the waiting list.`,
        severity: "critical",
        isResolved: false,
        triggeredByRule: "BATCH_FULL",
      });
      created.push(rec as any);
    }

    // 3. Low enrollment
    if (batch.currentStrength < batch.minCapacity) {
      const rec = await batchRecommendationRepository.create({
        batch: batchId as any,
        type: "low-enrollment",
        title: "Low Enrollment",
        message: `Only ${batch.currentStrength} students enrolled (minimum ${batch.minCapacity}). Consider merging with another batch.`,
        severity: "warning",
        isResolved: false,
        triggeredByRule: "LOW_ENROLLMENT",
      });
      created.push(rec as any);
    }

    // 4. No teacher assigned
    if (!batch.primaryTeacher) {
      const rec = await batchRecommendationRepository.create({
        batch: batchId as any,
        type: "instructor-needed",
        title: "No Primary Instructor",
        message: `Batch has no primary teacher assigned. Please assign an instructor before the batch starts.`,
        severity: "critical",
        isResolved: false,
        triggeredByRule: "TEACHER_UNAVAILABLE",
      });
      created.push(rec as any);
    }

    return created;
  }

  /**
   * Resolve a recommendation
   */
  static async resolve(recommendationId: string, userId: string, note?: string) {
    return batchRecommendationRepository.update(recommendationId, {
      isResolved: true,
      resolvedAt: new Date() as any,
      resolvedBy: userId as any,
      resolvedNote: note,
    } as any);
  }

  /**
   * Get all unresolved recommendations for a batch
   */
  static async getUnresolved(batchId: string) {
    return batchRecommendationRepository.findMany({ batch: batchId, isResolved: false });
  }

  /**
   * Get active students count for a batch (used for reporting)
   */
  static async getStudentCount(batchId: string) {
    const students = await batchStudentRepository.findMany({ batch: batchId, status: "active" });
    return students.length;
  }
}
