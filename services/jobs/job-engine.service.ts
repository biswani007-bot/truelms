import mongoose from "mongoose";
import { Job, IJob, JobPriority } from "../../models/job.model";
import { logger } from "../../utils/logger";

export type JobHandler = (payload: any, job: IJob) => Promise<any>;

export class JobEngineService {
  private static handlers: Map<string, JobHandler> = new Map();
  private static workerId: string = `worker-${process.pid}-${Math.random().toString(36).substring(2, 7)}`;
  private static leaseDurationMs: number = 3 * 60 * 1000; // 3 minutes lease timeout

  static registerHandler(jobType: string, handler: JobHandler) {
    this.handlers.set(jobType, handler);
  }

  static setLeaseDuration(ms: number) {
    this.leaseDurationMs = ms;
  }

  static async scheduleJob(params: {
    jobType: string;
    payload: Record<string, any>;
    entityType?: string;
    entityId?: string;
    priority?: JobPriority;
    scheduledAt?: Date;
    maxAttempts?: number;
    idempotencyKey?: string;
  }): Promise<IJob> {
    const {
      jobType,
      payload,
      entityType,
      entityId,
      priority = "normal",
      scheduledAt = new Date(),
      maxAttempts = 5,
      idempotencyKey,
    } = params;

    if (idempotencyKey) {
      const existing = await Job.findOne({ idempotencyKey });
      if (existing) {
        return existing;
      }
    }

    const jobId = `job-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const job = await Job.create({
      jobId,
      jobType,
      entityType,
      entityId,
      payload,
      priority,
      scheduledAt,
      nextAttemptAt: scheduledAt,
      maxAttempts,
      idempotencyKey,
      status: "pending",
    });

    return job;
  }

  /**
   * Claim and execute next eligible job atomically using lease expiration check.
   */
  static async processNextJob(): Promise<boolean> {
    const now = new Date();
    const leaseExpiresAt = new Date(now.getTime() + this.leaseDurationMs);

    // Atomically claim eligible job:
    // 1. Status is pending/retrying and scheduled <= now, not locked or lease expired
    // 2. OR running job whose lease has expired
    const job = await Job.findOneAndUpdate(
      {
        nextAttemptAt: { $lte: now },
        $or: [
          { status: "pending" },
          { status: "retrying" },
          { status: "running", leaseExpiresAt: { $lte: now } },
        ],
      },
      {
        $set: {
          status: "running",
          lockedAt: now,
          lockedBy: this.workerId,
          leaseExpiresAt,
          startedAt: now,
        },
        $inc: { attempts: 1 },
      },
      { sort: { priority: -1, nextAttemptAt: 1, createdAt: 1 }, returnDocument: "after" }
    );

    if (!job) return false;

    const handler = this.handlers.get(job.jobType);
    if (!handler) {
      logger.error(`[JobEngine] No handler registered for jobType: ${job.jobType}`);
      await Job.findByIdAndUpdate(job._id, {
        status: "failed",
        failureCode: "NO_HANDLER",
        lastError: `No handler registered for jobType: ${job.jobType}`,
        lockedAt: null,
        lockedBy: null,
        leaseExpiresAt: null,
      });
      return true;
    }

    try {
      await handler(job.payload, job);

      await Job.findByIdAndUpdate(job._id, {
        status: "completed",
        completedAt: new Date(),
        lockedAt: null,
        lockedBy: null,
        leaseExpiresAt: null,
        lastError: null,
      });

      logger.info(`[JobEngine] Job ${job.jobId} (${job.jobType}) completed successfully.`);
      return true;
    } catch (err: any) {
      const errorMsg = err.message || String(err);
      const isTerminal = job.attempts >= job.maxAttempts || err.isTerminal;
      const backoffSeconds = Math.min(Math.pow(2, job.attempts) * 5, 3600);
      const nextAttemptAt = new Date(now.getTime() + backoffSeconds * 1000);

      await Job.findByIdAndUpdate(job._id, {
        status: isTerminal ? "failed" : "retrying",
        failureCode: isTerminal ? "MAX_ATTEMPTS_EXCEEDED" : "EXECUTION_ERROR",
        lastError: errorMsg,
        nextAttemptAt,
        lockedAt: null,
        lockedBy: null,
        leaseExpiresAt: null,
      });

      logger.error(`[JobEngine] Job ${job.jobId} failed attempt ${job.attempts}/${job.maxAttempts}: ${errorMsg}`);
      return true;
    }
  }

  static async runBatch(maxJobs: number = 10): Promise<number> {
    let count = 0;
    while (count < maxJobs) {
      const processed = await this.processNextJob();
      if (!processed) break;
      count++;
    }
    return count;
  }

  /**
   * Reset stale leases on worker startup.
   */
  static async recoverStaleLeases(): Promise<number> {
    const now = new Date();
    const result = await Job.updateMany(
      {
        status: "running",
        leaseExpiresAt: { $lte: now },
      },
      {
        $set: {
          status: "retrying",
          lockedAt: null,
          lockedBy: null,
          leaseExpiresAt: null,
        },
      }
    );
    return result.modifiedCount;
  }

  /**
   * Cancel pending or retrying jobs matching filter (e.g. when an entity is cancelled, completed, or rescheduled).
   */
  static async cancelJobs(filter: {
    entityType?: string;
    entityId?: string;
    jobType?: string;
    idempotencyKey?: string;
    reason?: string;
  }): Promise<number> {
    const query: Record<string, any> = {
      status: { $in: ["pending", "retrying"] },
    };
    if (filter.entityType) query.entityType = filter.entityType;
    if (filter.entityId) query.entityId = filter.entityId;
    if (filter.jobType) query.jobType = filter.jobType;
    if (filter.idempotencyKey) query.idempotencyKey = filter.idempotencyKey;

    const result = await Job.updateMany(query, {
      $set: {
        status: "cancelled",
        completedAt: new Date(),
        lastError: filter.reason || "Job cancelled by lifecycle trigger",
      },
    });

    if (result.modifiedCount > 0) {
      logger.info(
        { filter, cancelledCount: result.modifiedCount },
        "[JobEngine] Cancelled pending jobs."
      );
    }

    return result.modifiedCount;
  }
}
