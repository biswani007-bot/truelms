import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export interface IReceipt extends IBaseDocument {
  receiptNumber: string;
  invoice: mongoose.Types.ObjectId;
  payment: mongoose.Types.ObjectId;
  student?: mongoose.Types.ObjectId;
  enrollment?: mongoose.Types.ObjectId;
  issueDate: Date;
  amount: number; // Stored in cents
  taxes: number;
}

const ReceiptSchema = new Schema(
  {
    receiptNumber: { type: String, required: true, unique: true, index: true },
    invoice: { type: Schema.Types.ObjectId, ref: "Invoice", required: true, index: true },
    payment: { type: Schema.Types.ObjectId, ref: "Payment", required: true, index: true },
    student: { type: Schema.Types.ObjectId, ref: "Student", index: true },
    enrollment: { type: Schema.Types.ObjectId, ref: "Enrollment", index: true },
    issueDate: { type: Date, required: true, default: Date.now, index: true },
    amount: { type: Number, required: true, default: 0 },
    taxes: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

ReceiptSchema.plugin(baseModelPlugin);

export const Receipt =
  mongoose.models.Receipt || mongoose.model<IReceipt>("Receipt", ReceiptSchema);
