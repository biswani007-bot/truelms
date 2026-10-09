/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * BatchService
 * Core CRUD service for Batch lifecycle management.
 * Always reads capacity defaults from Platform Settings.
 */
import { batchRepository } from "../../repositories/batch.repository";
import { batchTimelineRepository } from "../../repositories/batch-timeline.repository";
import { settingsRepository } from "../../repositories/settings.repository";
import { IBatch } from "../../models/batch.model";

export class BatchService {
  /**
   * Create a new batch, reading defaults from Platform Settings
   */
  static async create(data: Partial<IBatch>, userId?: string): Promise<IBatch> {
    const settings = await settingsRepository.findOne({ key: "global" });

    const defaultCapacity = settings?.batch?.defaultCapacity ?? 50;
    const maxCapacity = settings?.batch?.maxCapacity ?? 100;

    const batchStart = data.batchStart ? new Date(data.batchStart) : new Date();
    const batchEnd = data.batchEnd
      ? new Date(data.batchEnd)
      : new Date(batchStart.getTime() + 90 * 24 * 60 * 60 * 1000);

    const targetCapacity = data.maxCapacity ?? data.defaultCapacity ?? defaultCapacity;

    const batchData: Partial<IBatch> = {
      ...data,
      batchStart,
      batchEnd,
      defaultCapacity: data.defaultCapacity ?? targetCapacity,
      maxCapacity: targetCapacity,
      minCapacity: data.minCapacity ?? 5,
      currentStrength: 0,
      availableSeats: targetCapacity,
      reservedSeats: 0,
      waitingCount: 0,
      status: data.status ?? "planning",
    };

    const batch = await batchRepository.create(batchData);

    if (batch.primaryTeacher) {
      const { BatchTeacher } = await import("../../models/batch-teacher.model");
      await BatchTeacher.findOneAndUpdate(
        { batch: batch._id, teacher: batch.primaryTeacher, role: "primary" },
        {
          assignedAt: new Date(),
          assignedBy: userId as any,
          isOverride: false,
          status: "active",
        },
        { upsert: true }
      );
    }

    await batchTimelineRepository.create({
      batch: batch._id as any,
      event: "created",
      description: `Batch created with capacity ${batchData.maxCapacity} (from Platform Settings)`,
      performedBy: userId as any,
    });

    return batch;
  }

  /**
   * Update batch status and log timeline
   */
  static async updateStatus(
    batchId: string,
    newStatus: IBatch["status"],
    userId?: string
  ): Promise<IBatch | null> {
    const batch = await batchRepository.update(batchId, { status: newStatus } as any);

    if (batch) {
      await batchTimelineRepository.create({
        batch: batchId as any,
        event: "status-changed",
        description: `Batch status changed to ${newStatus}`,
        performedBy: userId as any,
        metadata: { newStatus },
      });
    }

    return batch;
  }

  /**
   * Get batch list with optional cohort/course/status filters
   */
  static async list(filters: Record<string, any> = {}) {
    return batchRepository.findMany(filters, {
      populate: ["cohort", "course", "primaryTeacher"],
    });
  }
}
