import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export interface IRefund extends IBaseDocument {
  refundNumber: string;
  invoice: mongoose.Types.ObjectId;
  payment: mongoose.Types.ObjectId;
  reason: string;
  approvedBy?: mongoose.Types.ObjectId; // References User
  amount: number; // Stored in cents
  refundDate: Date;
  status: "pending" | "approved" | "rejected";
}

const RefundSchema = new Schema(
  {
    refundNumber: { type: String, required: true, unique: true, index: true },
    invoice: { type: Schema.Types.ObjectId, ref: "Invoice", required: true, index: true },
    payment: { type: Schema.Types.ObjectId, ref: "Payment", required: true, index: true },
    reason: { type: String, required: true },
    approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
    amount: { type: Number, required: true, default: 0 },
    refundDate: { type: Date, required: true, default: Date.now, index: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      required: true,
      default: "pending",
      index: true,
    },
  },
  { timestamps: true }
);

RefundSchema.plugin(baseModelPlugin);

export const Refund =
  mongoose.models.Refund || mongoose.model<IRefund>("Refund", RefundSchema);
