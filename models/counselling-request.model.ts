import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export type CounsellingStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "rescheduled"
  | "completed"
  | "cancelled";

export interface ICounsellingRequest extends IBaseDocument {
  parent: mongoose.Types.ObjectId;        // References Parent model
  counsellor: mongoose.Types.ObjectId;    // References Teacher model (isCounsellor=true)
  student?: mongoose.Types.ObjectId;      // Optional — the child the session is about
  requestedAt: Date;
  proposedStart: Date;                    // Parent's requested time
  proposedEnd: Date;
  confirmedStart?: Date;                  // Counsellor-confirmed start (may differ on reschedule)
  confirmedEnd?: Date;
  reason: string;                         // Free-text reason from parent
  notes?: string;                         // Internal counsellor notes
  status: CounsellingStatus;
  rejectionReason?: string;
  // Jitsi room — generated once accepted, keyed off this document's _id
  jitsiRoomId?: string;
  jitsiToken?: string;                    // Parent-specific token (generated on room entry)
  recordingEnabled: boolean;              // Always false for counselling
  parentUserId?: mongoose.Types.ObjectId; // References User (for Jitsi access control)
}

const CounsellingRequestSchema = new Schema(
  {
    parent: { type: Schema.Types.ObjectId, ref: "Parent", required: true, index: true },
    counsellor: { type: Schema.Types.ObjectId, ref: "Teacher", required: true, index: true },
    student: { type: Schema.Types.ObjectId, ref: "Student", index: true },
    requestedAt: { type: Date, required: true, default: Date.now },
    proposedStart: { type: Date, required: true, index: true },
    proposedEnd: { type: Date, required: true },
    confirmedStart: { type: Date },
    confirmedEnd: { type: Date },
    reason: { type: String, required: true, trim: true },
    notes: { type: String },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "rescheduled", "completed", "cancelled"],
      default: "pending",
      required: true,
      index: true,
    },
    rejectionReason: { type: String },
    jitsiRoomId: { type: String },
    recordingEnabled: { type: Boolean, default: false },
    parentUserId: { type: Schema.Types.ObjectId, ref: "User", index: true },
  },
  { timestamps: true }
);

CounsellingRequestSchema.index({ parent: 1, status: 1 });
CounsellingRequestSchema.index({ counsellor: 1, status: 1 });
CounsellingRequestSchema.index({ proposedStart: 1, counsellor: 1 });

CounsellingRequestSchema.plugin(baseModelPlugin);

export const CounsellingRequest =
  mongoose.models.CounsellingRequest ||
  mongoose.model<ICounsellingRequest>("CounsellingRequest", CounsellingRequestSchema);
