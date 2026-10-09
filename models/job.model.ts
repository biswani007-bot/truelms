import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export type JobStatus = "pending" | "running" | "completed" | "failed" | "retrying" | "cancelled";
export type JobPriority = "low" | "normal" | "high" | "critical";

export interface IJob extends IBaseDocument {
  jobId: string;
  jobType: string;
  entityType?: string;
  entityId?: string;
  payload: Record<string, any>;
  status: JobStatus;
  priority: JobPriority;
  scheduledAt: Date;
  attempts: number;
  maxAttempts: number;
  nextAttemptAt: Date;
  lockedAt?: Date | null;
  lockedBy?: string | null;
  leaseExpiresAt?: Date | null;
  failureCode?: string | null;
  lastError?: string | null;
  idempotencyKey?: string | null;
  startedAt?: Date | null;
  completedAt?: Date | null;
}

const JobSchema = new Schema(
  {
    jobId: { type: String, required: true, unique: true, index: true },
    jobType: { type: String, required: true, index: true },
    entityType: { type: String, index: true },
    entityId: { type: String, index: true },
    payload: { type: Schema.Types.Mixed, default: {} },
    status: {
      type: String,
      enum: ["pending", "running", "completed", "failed", "retrying", "cancelled"],
      default: "pending",
      index: true,
    },
    priority: {
      type: String,
      enum: ["low", "normal", "high", "critical"],
      default: "normal",
      index: true,
    },
    scheduledAt: { type: Date, required: true, default: Date.now, index: true },
    attempts: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 5 },
    nextAttemptAt: { type: Date, required: true, default: Date.now, index: true },
    lockedAt: { type: Date, default: null, index: true },
    lockedBy: { type: String, default: null },
    leaseExpiresAt: { type: Date, default: null, index: true },
    failureCode: { type: String, default: null },
    lastError: { type: String, default: null },
    idempotencyKey: { type: String, index: true, sparse: true },
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Compound index for atomic job claiming and lease timeout recovery
JobSchema.index({ status: 1, nextAttemptAt: 1, priority: 1, leaseExpiresAt: 1 });

JobSchema.plugin(baseModelPlugin);

export const Job = mongoose.models.Job || mongoose.model<IJob>("Job", JobSchema);
