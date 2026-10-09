import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export interface IAdmissionOffer extends IBaseDocument {
  enrollment: mongoose.Types.ObjectId;
  offerNumber: string;
  offerDate: Date;
  expiryDate: Date;
  discountValue: number;
  scholarshipValue: number;
  status: "pending" | "accepted" | "expired" | "rejected";
}

const AdmissionOfferSchema = new Schema(
  {
    enrollment: { type: Schema.Types.ObjectId, ref: "Enrollment", required: true, unique: true, index: true },
    offerNumber: { type: String, required: true, unique: true, index: true },
    offerDate: { type: Date, required: true, default: Date.now, index: true },
    expiryDate: { type: Date, required: true, index: true },
    discountValue: { type: Number, default: 0 },
    scholarshipValue: { type: Number, default: 0 },
    status: { type: String, enum: ["pending", "accepted", "expired", "rejected"], default: "pending", index: true },
  },
  { timestamps: true }
);

AdmissionOfferSchema.plugin(baseModelPlugin);

export const AdmissionOffer =
  mongoose.models.AdmissionOffer || mongoose.model<IAdmissionOffer>("AdmissionOffer", AdmissionOfferSchema);
