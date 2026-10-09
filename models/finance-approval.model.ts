import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export interface IFinanceApproval extends IBaseDocument {
  referenceId: mongoose.Types.ObjectId; // References Refund
  status: "pending" | "approved" | "rejected";
  remarks?: string;
  requestedBy: mongoose.Types.ObjectId; // References User
  approvedBy?: mongoose.Types.ObjectId; // References User
  actionedAt?: Date;
}

const FinanceApprovalSchema = new Schema(
  {
    referenceId: { type: Schema.Types.ObjectId, required: true, unique: true, index: true },
    status: { type: String, enum: ["pending", "approved", "rejected"], required: true, default: "pending", index: true },
    remarks: { type: String },
    requestedBy: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    approvedBy: { type: Schema.Types.ObjectId, ref: "User", index: true },
    actionedAt: { type: Date, index: true },
  },
  { timestamps: true }
);

FinanceApprovalSchema.plugin(baseModelPlugin);

export const FinanceApproval =
  mongoose.models.FinanceApproval ||
  mongoose.model<IFinanceApproval>("FinanceApproval", FinanceApprovalSchema);
