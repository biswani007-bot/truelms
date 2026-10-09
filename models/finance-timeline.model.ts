import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export interface IFinanceTimeline extends IBaseDocument {
  referenceId: mongoose.Types.ObjectId; // References Invoice, Payment, or Refund
  event:
    | "invoice-generated"
    | "payment-recorded"
    | "receipt-issued"
    | "refund-requested"
    | "refund-approved"
    | "invoice-closed";
  description: string;
  performedBy?: mongoose.Types.ObjectId; // References User
  timestamp: Date;
}

const FinanceTimelineSchema = new Schema(
  {
    referenceId: { type: Schema.Types.ObjectId, required: true, index: true },
    event: {
      type: String,
      enum: [
        "invoice-generated",
        "payment-recorded",
        "receipt-issued",
        "refund-requested",
        "refund-approved",
        "invoice-closed",
      ],
      required: true,
      index: true,
    },
    description: { type: String, required: true },
    performedBy: { type: Schema.Types.ObjectId, ref: "User", index: true },
    timestamp: { type: Date, required: true, default: Date.now, index: true },
  },
  { timestamps: true }
);

FinanceTimelineSchema.plugin(baseModelPlugin);

export const FinanceTimeline =
  mongoose.models.FinanceTimeline ||
  mongoose.model<IFinanceTimeline>("FinanceTimeline", FinanceTimelineSchema);
