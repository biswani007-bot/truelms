/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * CapacityService
 * Reads ALL capacity limits from Platform Settings at runtime.
 * NEVER hardcodes capacity values.
 */
import { settingsRepository } from "../../repositories/settings.repository";
import { batchRepository } from "../../repositories/batch.repository";
import { Batch } from "../../models/batch.model";

export interface ICapacitySnapshot {
  defaultCapacity: number;
  maxCapacity: number;
  minCapacity: number;
  currentStrength: number;
  availableSeats: number;
  reservedSeats: number;
  waitingCount: number;
  utilizationPercent: number;
  isFull: boolean;
  isWaitingListOpen: boolean;
  waitingListEnabled: boolean;
  autoAllocationEnabled: boolean;
}

export class CapacityService {
  /**
   * Read live capacity limits from Platform Settings and merge with batch actuals
   */
  static async getSnapshot(batchId: string): Promise<ICapacitySnapshot> {
    const [settings, batch] = await Promise.all([
      settingsRepository.findOne({ key: "global" }),
      batchRepository.findById(batchId),
    ]);

    if (!batch) throw new Error(`Batch ${batchId} not found`);

    const maxCapacity = batch.maxCapacity ?? settings?.batch?.maxCapacity ?? 50;
    const defaultCapacity = batch.defaultCapacity ?? settings?.batch?.defaultCapacity ?? 50;
    const waitingListEnabled = settings?.batch?.waitingListEnabled ?? true;
    const autoAllocationEnabled = settings?.batch?.autoAllocationEnabled ?? true;

    const availableSeats = Math.max(0, maxCapacity - batch.currentStrength - batch.reservedSeats);
    const utilizationPercent = maxCapacity > 0 ? Math.round((batch.currentStrength / maxCapacity) * 100) : 0;
    const isFull = availableSeats <= 0;
    const isWaitingListOpen = isFull && waitingListEnabled;

    return {
      defaultCapacity,
      maxCapacity,
      minCapacity: batch.minCapacity,
      currentStrength: batch.currentStrength,
      availableSeats,
      reservedSeats: batch.reservedSeats,
      waitingCount: batch.waitingCount,
      utilizationPercent,
      isFull,
      isWaitingListOpen,
      waitingListEnabled,
      autoAllocationEnabled,
    };
  }

  /**
   * Increment student count and recompute available seats
   */
  static async incrementStrength(batchId: string, session?: any): Promise<void> {
    const settings = await settingsRepository.findOne({ key: "global" });
    const batch = await batchRepository.findById(batchId, { lean: false });
    if (!batch) throw new Error(`Batch ${batchId} not found`);

    const maxCapacity = batch.maxCapacity ?? settings?.batch?.maxCapacity ?? 50;
    const newStrength = batch.currentStrength + 1;
    const newAvailable = Math.max(0, maxCapacity - newStrength - batch.reservedSeats);
    const newStatus = newAvailable <= 0 ? "full" : batch.status === "open" ? "open" : batch.status;

    await Batch.findByIdAndUpdate(
      batchId,
      { currentStrength: newStrength, availableSeats: newAvailable, status: newStatus },
      { session }
    );
  }

  /**
   * Decrement student count (seat released)
   */
  static async decrementStrength(batchId: string, session?: any): Promise<void> {
    const settings = await settingsRepository.findOne({ key: "global" });
    const batch = await batchRepository.findById(batchId, { lean: false });
    if (!batch) throw new Error(`Batch ${batchId} not found`);

    const maxCapacity = batch.maxCapacity ?? settings?.batch?.maxCapacity ?? 50;
    const newStrength = Math.max(0, batch.currentStrength - 1);
    const newAvailable = Math.max(0, maxCapacity - newStrength - batch.reservedSeats);

    // If batch was full, reopen it
    const newStatus = batch.status === "full" || batch.status === "waiting-list" ? "open" : batch.status;

    await Batch.findByIdAndUpdate(
      batchId,
      { currentStrength: newStrength, availableSeats: newAvailable, status: newStatus },
      { session }
    );
  }

  /**
   * Increment waiting list counter
   */
  static async incrementWaiting(batchId: string, session?: any): Promise<void> {
    const batch = await batchRepository.findById(batchId, { lean: false });
    if (!batch) throw new Error(`Batch ${batchId} not found`);

    await Batch.findByIdAndUpdate(
      batchId,
      { waitingCount: batch.waitingCount + 1, status: "waiting-list" },
      { session }
    );
  }

  /**
   * Decrement waiting list counter
   */
  static async decrementWaiting(batchId: string, session?: any): Promise<void> {
    const batch = await batchRepository.findById(batchId, { lean: false });
    if (!batch) throw new Error(`Batch ${batchId} not found`);

    const newWaiting = Math.max(0, batch.waitingCount - 1);
    await Batch.findByIdAndUpdate(batchId, { waitingCount: newWaiting }, { session });
  }
}
