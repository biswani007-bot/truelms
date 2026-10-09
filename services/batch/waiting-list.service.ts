/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * WaitingListService
 * Manages waiting list positions, priority ordering, auto/manual promotion.
 */
import mongoose from "mongoose";
import { batchWaitingListRepository } from "../../repositories/batch-waiting-list.repository";
import { batchTimelineRepository } from "../../repositories/batch-timeline.repository";
import { CapacityService } from "./capacity.service";
import { BatchWaitingList } from "../../models/batch-waiting-list.model";

export class WaitingListService {
  /**
   * Add a student to the waiting list with next available position
   */
  static async addToWaitingList(
    batchId: string,
    studentId: string,
    enrollmentId: string,
    options: { priority?: "normal" | "high" | "urgent"; userId?: string; session?: mongoose.ClientSession } = {}
  ) {
    const { priority = "normal", userId, session } = options;

    // Deduplication check
    const isAlreadyWaiting = await batchWaitingListRepository.findOne({ batch: batchId, student: studentId, status: "waiting" });
    if (isAlreadyWaiting) return isAlreadyWaiting;

    // Get next position
    const existing = await batchWaitingListRepository.findMany({ batch: batchId, status: "waiting" });
    const nextPosition = existing.length + 1;

    const entry = await batchWaitingListRepository.create(
      {
        batch: batchId as any,
        student: studentId as any,
        enrollment: enrollmentId as any,
        position: nextPosition,
        priority,
        enrollmentDate: new Date(),
        autoPromotionEnabled: true,
        status: "waiting",
      },
      { session }
    );

    await CapacityService.incrementWaiting(batchId, session);

    await batchTimelineRepository.create({
      batch: batchId as any,
      event: "waiting-list-added",
      description: `Student added to waiting list at position ${nextPosition} (priority: ${priority})`,
      performedBy: userId as any,
      referenceId: studentId as any,
      referenceType: "student",
    });

    return entry;
  }

  /**
   * Manually promote a specific waiting list entry
   */
  static async promoteManual(entryId: string, userId: string) {
    const entry = await batchWaitingListRepository.findById(entryId, { lean: false });
    if (!entry) throw new Error("Waiting list entry not found");
    if (entry.status !== "waiting") throw new Error("Entry is not in waiting status");

    const batchId = entry.batch.toString();
    const snapshot = await CapacityService.getSnapshot(batchId);
    if (snapshot.isFull) throw new Error("Cannot promote – batch is still full");

    await BatchWaitingList.findByIdAndUpdate(entryId, {
      status: "promoted",
      promotedAt: new Date(),
      promotedBy: userId,
    });

    await CapacityService.decrementWaiting(batchId);
    await CapacityService.incrementStrength(batchId);

    await batchTimelineRepository.create({
      batch: entry.batch as any,
      event: "waiting-list-promoted",
      description: `Student manually promoted from waiting list (position ${entry.position})`,
      performedBy: userId as any,
      referenceId: entry.student as any,
      referenceType: "student",
    });

    // Re-sort positions for remaining entries
    await WaitingListService.reorderPositions(batchId);

    return entry;
  }

  /**
   * Auto-promote the highest priority, lowest position waiting student
   */
  static async autoPromoteNext(batchId: string) {
    // Sort by priority then position
    const priorityOrder: Record<string, number> = { urgent: 0, high: 1, normal: 2 };
    const waiting = await batchWaitingListRepository.findMany({ batch: batchId, status: "waiting", autoPromotionEnabled: true });
    if (!waiting.length) return null;

    const sorted = waiting.sort((a, b) => {
      const pa = priorityOrder[a.priority] ?? 2;
      const pb = priorityOrder[b.priority] ?? 2;
      if (pa !== pb) return pa - pb;
      return a.position - b.position;
    });

    const next = sorted[0];

    await BatchWaitingList.findByIdAndUpdate(next._id, {
      status: "promoted",
      promotedAt: new Date(),
    });

    await CapacityService.decrementWaiting(batchId);
    await CapacityService.incrementStrength(batchId);

    await batchTimelineRepository.create({
      batch: batchId as any,
      event: "waiting-list-promoted",
      description: `Student auto-promoted from waiting list (position ${next.position}, priority: ${next.priority})`,
      referenceId: next.student as any,
      referenceType: "student",
    });

    await WaitingListService.reorderPositions(batchId);
    return next;
  }

  /**
   * Cancel a waiting list entry
   */
  static async cancel(entryId: string, userId: string) {
    const entry = await batchWaitingListRepository.findById(entryId, { lean: false });
    if (!entry) throw new Error("Waiting list entry not found");

    const batchId = entry.batch.toString();

    await BatchWaitingList.findByIdAndUpdate(entryId, {
      status: "cancelled",
      cancelledAt: new Date(),
      cancelledBy: userId,
    });

    await CapacityService.decrementWaiting(batchId);

    await batchTimelineRepository.create({
      batch: entry.batch as any,
      event: "waiting-list-cancelled",
      description: `Waiting list entry cancelled (position ${entry.position})`,
      performedBy: userId as any,
      referenceId: entry.student as any,
      referenceType: "student",
    });

    await WaitingListService.reorderPositions(batchId);
    return entry;
  }

  /**
   * Renumber positions after promotion / cancellation
   */
  static async reorderPositions(batchId: string) {
    const remaining = await batchWaitingListRepository.findMany({ batch: batchId, status: "waiting" });
    const sorted = remaining.sort((a, b) => a.position - b.position);
    const bulkOps = sorted.map((entry, idx) => ({
      updateOne: {
        filter: { _id: entry._id },
        update: { $set: { position: idx + 1 } },
      },
    }));
    if (bulkOps.length > 0) {
      await BatchWaitingList.bulkWrite(bulkOps);
    }
  }
}
