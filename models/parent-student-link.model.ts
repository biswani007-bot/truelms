import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export interface IParentStudentLink extends IBaseDocument {
  parent: mongoose.Types.ObjectId;
  student: mongoose.Types.ObjectId;
  relationshipType: "father" | "mother" | "guardian" | "foster" | "other";
  priority: number; // 1 = Primary Guardian, 2 = Secondary, etc.
  isEmergencyContact: boolean;
  isCustodial: boolean;
  isPickupAuthorized: boolean;
  canAccessPortal: boolean;
  canReceiveNotifications: boolean;
  notificationChannels: {
    email: boolean;
    sms: boolean;
    whatsapp: boolean;
    push: boolean;
  };
}

const ParentStudentLinkSchema = new Schema(
  {
    parent: { type: Schema.Types.ObjectId, ref: "Parent", required: true, index: true },
    student: { type: Schema.Types.ObjectId, ref: "Student", required: true, index: true },
    relationshipType: {
      type: String,
      enum: ["father", "mother", "guardian", "foster", "other"],
      required: true,
      default: "guardian",
    },
    priority: { type: Number, default: 1, required: true },
    isEmergencyContact: { type: Boolean, default: true },
    isCustodial: { type: Boolean, default: true },
    isPickupAuthorized: { type: Boolean, default: true },
    canAccessPortal: { type: Boolean, default: true },
    canReceiveNotifications: { type: Boolean, default: true },
    notificationChannels: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      whatsapp: { type: Boolean, default: false },
      push: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

ParentStudentLinkSchema.index({ parent: 1, student: 1 }, { unique: true });
ParentStudentLinkSchema.plugin(baseModelPlugin);

export const ParentStudentLink =
  mongoose.models.ParentStudentLink ||
  mongoose.model<IParentStudentLink>("ParentStudentLink", ParentStudentLinkSchema);
