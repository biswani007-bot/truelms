import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export interface IInvoice extends IBaseDocument {
  invoiceNumber: string;
  enrollment: mongoose.Types.ObjectId;
  student: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  issueDate: Date;
  dueDate: Date;
  baseAmount: number; // Stored in cents
  taxAmount: number;
  discountAmount: number;
  scholarshipAmount: number;
  totalAmount: number;
  outstandingAmount: number;
  status: "draft" | "issued" | "partially-paid" | "paid" | "overdue" | "cancelled" | "refunded";
}

const InvoiceSchema = new Schema(
  {
    invoiceNumber: { type: String, required: true, unique: true, index: true },
    enrollment: { type: Schema.Types.ObjectId, ref: "Enrollment", required: true, index: true },
    student: { type: Schema.Types.ObjectId, ref: "Student", required: true, index: true },
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    issueDate: { type: Date, required: true, default: Date.now, index: true },
    dueDate: { type: Date, required: true, index: true },
    baseAmount: { type: Number, required: true, default: 0 },
    taxAmount: { type: Number, required: true, default: 0 },
    discountAmount: { type: Number, required: true, default: 0 },
    scholarshipAmount: { type: Number, required: true, default: 0 },
    totalAmount: { type: Number, required: true, default: 0 },
    outstandingAmount: { type: Number, required: true, default: 0 },
    status: {
      type: String,
      enum: ["draft", "issued", "partially-paid", "paid", "overdue", "cancelled", "refunded"],
      required: true,
      default: "draft",
      index: true,
    },
  },
  { timestamps: true }
);

InvoiceSchema.plugin(baseModelPlugin);

export const Invoice =
  mongoose.models.Invoice || mongoose.model<IInvoice>("Invoice", InvoiceSchema);
