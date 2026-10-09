import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export interface ICertificateTimeline extends IBaseDocument {
  certificate: mongoose.Types.ObjectId;
  event:
    | "eligibility-calculated"
    | "generated"
    | "draft-edited"
    | "approved"
    | "issued"
    | "downloaded"
    | "verified"
    | "revoked"
    | "archived"
    | "revised"
    | "reissued"
    | "updated";
  description: string;
  performedBy?: mongoose.Types.ObjectId; // References User
  timestamp: Date;
}

const CertificateTimelineSchema = new Schema(
  {
    certificate: { type: Schema.Types.ObjectId, ref: "Certificate", required: true, index: true },
    event: {
      type: String,
      enum: [
        "eligibility-calculated",
        "generated",
        "draft-edited",
        "approved",
        "issued",
        "downloaded",
        "verified",
        "revoked",
        "archived",
        "revised",
        "reissued",
        "updated",
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

CertificateTimelineSchema.plugin(baseModelPlugin);

export const CertificateTimeline =
  mongoose.models.CertificateTimeline ||
  mongoose.model<ICertificateTimeline>("CertificateTimeline", CertificateTimelineSchema);
