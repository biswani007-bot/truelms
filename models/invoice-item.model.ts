import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export interface IInvoiceItem extends IBaseDocument {
  invoice: mongoose.Types.ObjectId;
  description: string;
  quantity: number;
  unitPrice: number; // Stored in cents
  totalPrice: number; // Stored in cents (quantity * unitPrice)
}

const InvoiceItemSchema = new Schema(
  {
    invoice: { type: Schema.Types.ObjectId, ref: "Invoice", required: true, index: true },
    description: { type: String, required: true },
    quantity: { type: Number, required: true, default: 1, min: 1 },
    unitPrice: { type: Number, required: true, default: 0 },
    totalPrice: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

InvoiceItemSchema.plugin(baseModelPlugin);

export const InvoiceItem =
  mongoose.models.InvoiceItem || mongoose.model<IInvoiceItem>("InvoiceItem", InvoiceItemSchema);
