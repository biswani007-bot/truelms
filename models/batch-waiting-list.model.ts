import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export interface IBatchWaitingList extends IBaseDocument {
  batch: mongoose.Types.ObjectId;
  student: mongoose.Types.ObjectId;
  enrollment: mongoose.Types.ObjectId;
  position: number;
  priority: "normal" | "high" | "urgent";
  enrollmentDate: Date;
  autoPromotionEnabled: boolean;
  promotedAt?: Date;
  promotedBy?: mongoose.Types.ObjectId;
  cancelledAt?: Date;
  cancelledBy?: mongoose.Types.ObjectId;
  notes?: string;
  status: "waiting" | "promoted" | "cancelled" | "expired";
}

const BatchWaitingListSchema = new Schema(
  {
    batch: { type: Schema.Types.ObjectId, ref: "Batch", required: true, index: true },
    student: { type: Schema.Types.ObjectId, ref: "Student", required: true, index: true },
    enrollment: { type: Schema.Types.ObjectId, ref: "Enrollment", required: true, index: true },
    position: { type: Number, required: true, index: true },
    priority: {
      type: String,
      enum: ["normal", "high", "urgent"],
      required: true,
      default: "normal",
      index: true,
    },
    enrollmentDate: { type: Date, required: true, default: Date.now },
    autoPromotionEnabled: { type: Boolean, required: true, default: true },
    promotedAt: { type: Date },
    promotedBy: { type: Schema.Types.ObjectId, ref: "User" },
    cancelledAt: { type: Date },
    cancelledBy: { type: Schema.Types.ObjectId, ref: "User" },
    notes: { type: String },
    status: {
      type: String,
      enum: ["waiting", "promoted", "cancelled", "expired"],
      default: "waiting",
      index: true,
    },
  },
  { timestamps: true }
);

BatchWaitingListSchema.index({ batch: 1, student: 1 }, { unique: true });
BatchWaitingListSchema.plugin(baseModelPlugin);

export const BatchWaitingList =
  mongoose.models.BatchWaitingList || mongoose.model<IBatchWaitingList>("BatchWaitingList", BatchWaitingListSchema);
