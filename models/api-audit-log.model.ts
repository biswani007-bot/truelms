import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export interface IApiAuditLog extends IBaseDocument {
  apiKey?: mongoose.Types.ObjectId; // References ApiKey (null if auth failed)
  ipAddress: string;
  userAgent?: string;
  action: string; // e.g. "GET /api/v1/public/students"
  status: string; // e.g. "success", "unauthorized", "rate-limited"
}

const ApiAuditLogSchema = new Schema(
  {
    apiKey: { type: Schema.Types.ObjectId, ref: "ApiKey", index: true },
    ipAddress: { type: String, required: true, index: true },
    userAgent: { type: String },
    action: { type: String, required: true, index: true },
    status: { type: String, required: true, index: true },
  },
  { timestamps: true }
);

ApiAuditLogSchema.plugin(baseModelPlugin);

export const ApiAuditLog =
  mongoose.models.ApiAuditLog ||
  mongoose.model<IApiAuditLog>("ApiAuditLog", ApiAuditLogSchema);
