import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export interface IPayment extends IBaseDocument {
  paymentNumber: string;
  invoice: mongoose.Types.ObjectId;
  student: mongoose.Types.ObjectId;
  amount: number; // Stored in cents
  paymentDate: Date;
  currency: string;
  gateway?: string;
  transactionReference: string;
  paymentMethod: "cash" | "bank-transfer" | "upi" | "credit-card" | "debit-card" | "cheque" | "online-gateway" | "wallet" | "custom";
  status: "pending" | "success" | "failed" | "cancelled" | "refunded";
}

const PaymentSchema = new Schema(
  {
    paymentNumber: { type: String, required: true, unique: true, index: true },
    invoice: { type: Schema.Types.ObjectId, ref: "Invoice", required: true, index: true },
    student: { type: Schema.Types.ObjectId, ref: "Student", required: true, index: true },
    amount: { type: Number, required: true, default: 0 },
    paymentDate: { type: Date, required: true, default: Date.now, index: true },
    currency: { type: String, required: true, default: "USD" },
    gateway: { type: String },
    transactionReference: { type: String, required: true, unique: true, index: true },
    paymentMethod: {
      type: String,
      enum: ["cash", "bank-transfer", "upi", "credit-card", "debit-card", "cheque", "online-gateway", "wallet", "custom"],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "success", "failed", "cancelled", "refunded"],
      required: true,
      default: "pending",
      index: true,
    },
  },
  { timestamps: true }
);

PaymentSchema.plugin(baseModelPlugin);

export const Payment =
  mongoose.models.Payment || mongoose.model<IPayment>("Payment", PaymentSchema);
