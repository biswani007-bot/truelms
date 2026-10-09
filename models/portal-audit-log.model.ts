import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export interface IPortalAuditLog extends IBaseDocument {
  portalId: string;
  adminUser: mongoose.Types.ObjectId; // User ID of admin who made the change
  adminEmail: string;
  module: "directory" | "auth" | "feature-flags" | "notifications" | "branding" | "consent" | "mobile" | "security";
  fieldName: string;
  oldValue: any;
  newValue: any;
  ipAddress?: string;
  userAgent?: string;
}

const PortalAuditLogSchema = new Schema(
  {
    portalId: { type: String, required: true, index: true },
    adminUser: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    adminEmail: { type: String, required: true },
    module: {
      type: String,
      enum: ["directory", "auth", "feature-flags", "notifications", "branding", "consent", "mobile", "security"],
      required: true,
      index: true,
    },
    fieldName: { type: String, required: true },
    oldValue: { type: Schema.Types.Mixed },
    newValue: { type: Schema.Types.Mixed },
    ipAddress: { type: String },
    userAgent: { type: String },
  },
  { timestamps: true }
);

PortalAuditLogSchema.plugin(baseModelPlugin);

export const PortalAuditLog =
  mongoose.models.PortalAuditLog || mongoose.model<IPortalAuditLog>("PortalAuditLog", PortalAuditLogSchema);
