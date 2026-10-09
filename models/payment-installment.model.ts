import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export interface IPaymentInstallment extends IBaseDocument {
  invoice: mongoose.Types.ObjectId;
  installmentNumber: number;
  dueDate: Date;
  amount: number; // Total amount due in cents
  paidAmount: number; // Amount paid so far in cents
  status: "pending" | "paid" | "overdue" | "waived";
  notes?: string;
}

const PaymentInstallmentSchema = new Schema(
  {
    invoice: { type: Schema.Types.ObjectId, ref: "Invoice", required: true, index: true },
    installmentNumber: { type: Number, required: true, min: 1 },
    dueDate: { type: Date, required: true, index: true },
    amount: { type: Number, required: true, default: 0 },
    paidAmount: { type: Number, required: true, default: 0 },
    status: {
      type: String,
      enum: ["pending", "paid", "overdue", "waived"],
      required: true,
      default: "pending",
      index: true,
    },
    notes: { type: String },
  },
  { timestamps: true }
);

PaymentInstallmentSchema.plugin(baseModelPlugin);

export const PaymentInstallment =
  mongoose.models.PaymentInstallment ||
  mongoose.model<IPaymentInstallment>("PaymentInstallment", PaymentInstallmentSchema);
