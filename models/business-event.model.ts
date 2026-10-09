import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export type EventStatus = "pending" | "processing" | "processed" | "failed";

export interface IBusinessEvent extends IBaseDocument {
  eventId: string;
  eventType: string;
  entityType: string;
  entityId: string;
  occurredAt: Date;
  payload: Record<string, any>;
  idempotencyKey: string;
  status: EventStatus;
  attempts: number;
  maxAttempts: number;
  nextAttemptAt: Date;
  lastError?: string | null;
  processedAt?: Date | null;
}

const BusinessEventSchema = new Schema(
  {
    eventId: { type: String, required: true, unique: true, index: true },
    eventType: { type: String, required: true, index: true },
    entityType: { type: String, required: true, index: true },
    entityId: { type: String, required: true, index: true },
    occurredAt: { type: Date, required: true, default: Date.now },
    payload: { type: Schema.Types.Mixed, default: {} },
    idempotencyKey: { type: String, required: true, unique: true, index: true },
    status: {
      type: String,
      enum: ["pending", "processing", "processed", "failed"],
      default: "pending",
      index: true,
    },
    attempts: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 5 },
    nextAttemptAt: { type: Date, required: true, default: Date.now, index: true },
    lastError: { type: String, default: null },
    processedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

BusinessEventSchema.plugin(baseModelPlugin);

export const BusinessEvent =
  mongoose.models.BusinessEvent || mongoose.model<IBusinessEvent>("BusinessEvent", BusinessEventSchema);
