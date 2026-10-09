/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * RuleEngineService
 * Evaluates deterministic, configurable business rules for batch assignment.
 * No AI. No ML. Pure conditional logic driven by Platform Settings.
 *
 * Rule execution order (from highest to lowest priority):
 * 1. SEAT_AVAILABLE        → assign student
 * 2. BATCH_FULL            → waiting list (if enabled)
 * 3. TEACHER_UNAVAILABLE   → assign alternate (if configured)
 * 4. CAPACITY_WARNING      → generate recommendation
 * 5. SEAT_RELEASED         → auto-promote next waiting student
 * 6. ENROLLMENT_CANCELLED  → release seat, trigger seat-released rule
 */
import { settingsRepository } from "../../repositories/settings.repository";
import { batchRepository } from "../../repositories/batch.repository";
import { batchTimelineRepository } from "../../repositories/batch-timeline.repository";
import { batchRecommendationRepository } from "../../repositories/batch-recommendation.repository";
import { CapacityService } from "./capacity.service";

export type RuleContext = {
  batchId: string;
  userId?: string;
  studentId?: string;
  enrollmentId?: string;
  teacherId?: string;
};

export type RuleResult = {
  rule: string;
  outcome: "assign" | "waiting-list" | "recommendation" | "release" | "skip" | "error";
  message: string;
  shouldAutoPromote?: boolean;
};

export class RuleEngineService {
  /**
   * Rule: SEAT_AVAILABLE
   * Returns true if capacity allows direct assignment
   */
  static async canAssignDirectly(batchId: string): Promise<boolean> {
    const snapshot = await CapacityService.getSnapshot(batchId);
    return !snapshot.isFull;
  }

  /**
   * Rule: BATCH_FULL
   * Returns true if waiting list should be offered
   */
  static async shouldAddToWaitingList(batchId: string): Promise<boolean> {
    const snapshot = await CapacityService.getSnapshot(batchId);
    return snapshot.isFull && snapshot.waitingListEnabled;
  }

  /**
   * Rule: CAPACITY_WARNING
   * If utilization >= 80%, generate a warning recommendation (advisory only)
   */
  static async checkCapacityWarning(batchId: string, userId?: string): Promise<void> {
    const snapshot = await CapacityService.getSnapshot(batchId);
    if (snapshot.utilizationPercent >= 80 && !snapshot.isFull) {
      await batchRecommendationRepository.create({
        batch: batchId as any,
        type: "nearly-full",
        title: "Batch Nearly Full",
        message: `Batch is at ${snapshot.utilizationPercent}% capacity (${snapshot.currentStrength}/${snapshot.maxCapacity} seats). Consider opening a new batch.`,
        severity: "warning",
        isResolved: false,
        triggeredByRule: "CAPACITY_WARNING",
      });
      await batchTimelineRepository.create({
        batch: batchId as any,
        event: "recommendation-generated",
        description: `Capacity warning at ${snapshot.utilizationPercent}%`,
        performedBy: userId as any,
        metadata: { utilizationPercent: snapshot.utilizationPercent },
      });
    }
    if (snapshot.isFull) {
      await batchRecommendationRepository.create({
        batch: batchId as any,
        type: "capacity-warning",
        title: "Batch Full – Overflow Detected",
        message: `Batch has reached maximum capacity (${snapshot.maxCapacity} seats). Overflow students are on the waiting list.`,
        severity: "critical",
        isResolved: false,
        triggeredByRule: "BATCH_FULL",
      });
    }
  }

  /**
   * Rule: LOW_ENROLLMENT
   * If strength < minCapacity threshold after N days, generate merge suggestion
   */
  static async checkLowEnrollment(batchId: string): Promise<void> {
    const batch = await batchRepository.findById(batchId);
    if (!batch) return;
    if (batch.currentStrength < batch.minCapacity) {
      await batchRecommendationRepository.create({
        batch: batchId as any,
        type: "low-enrollment",
        title: "Low Enrollment Alert",
        message: `Batch has only ${batch.currentStrength} students (minimum: ${batch.minCapacity}). Consider merging with another batch.`,
        severity: "warning",
        isResolved: false,
        triggeredByRule: "LOW_ENROLLMENT",
      });
    }
  }

  /**
   * Rule: SEAT_RELEASED / AUTO_PROMOTE
   * If autoAllocationEnabled is true, returns true to promote next waiting student
   */
  static async shouldAutoPromote(batchId: string): Promise<boolean> {
    const settings = await settingsRepository.findOne({ key: "global" });
    const snapshot = await CapacityService.getSnapshot(batchId);
    return (settings?.batch?.autoAllocationEnabled ?? true) && !snapshot.isFull && snapshot.waitingCount > 0;
  }

  /**
   * Evaluate all rules for a given batch and return results
   */
  static async evaluate(ctx: RuleContext): Promise<RuleResult[]> {
    const results: RuleResult[] = [];
    const snapshot = await CapacityService.getSnapshot(ctx.batchId);

    // Rule 1: Direct assignment possible
    if (!snapshot.isFull) {
      results.push({ rule: "SEAT_AVAILABLE", outcome: "assign", message: "Seat available for direct assignment" });
    }

    // Rule 2: Batch full → waiting list
    if (snapshot.isFull && snapshot.waitingListEnabled) {
      results.push({ rule: "BATCH_FULL", outcome: "waiting-list", message: "Batch full – student will join waiting list" });
    }

    // Rule 3: Batch full, waiting list disabled
    if (snapshot.isFull && !snapshot.waitingListEnabled) {
      results.push({ rule: "NO_CAPACITY", outcome: "error", message: "Batch is full and waiting list is disabled" });
    }

    // Rule 4: Capacity warning
    if (snapshot.utilizationPercent >= 80) {
      results.push({
        rule: "CAPACITY_WARNING",
        outcome: "recommendation",
        message: `Capacity at ${snapshot.utilizationPercent}% – warning recommendation generated`,
      });
    }

    // Rule 5: Auto promote eligible
    const shouldPromote = await RuleEngineService.shouldAutoPromote(ctx.batchId);
    if (shouldPromote) {
      results.push({
        rule: "SEAT_RELEASED",
        outcome: "assign",
        message: "Seat released – next waiting student eligible for auto-promotion",
        shouldAutoPromote: true,
      });
    }

    return results;
  }
}
