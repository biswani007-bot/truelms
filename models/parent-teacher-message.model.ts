import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export interface IParentTeacherMessage extends IBaseDocument {
  parent: mongoose.Types.ObjectId; // References Parent
  teacher: mongoose.Types.ObjectId; // References Teacher
  student: mongoose.Types.ObjectId; // References Student (child-scoped)
  batch: mongoose.Types.ObjectId; // References Batch (academic relationship)
  senderRole: "parent" | "teacher";
  senderUser: mongoose.Types.ObjectId; // References User account of sender
  subject?: string;
  message: string;
  isRead: boolean;
  readAt?: Date;
  status: "sent" | "delivered" | "read";
}

const ParentTeacherMessageSchema = new Schema(
  {
    parent: { type: Schema.Types.ObjectId, ref: "Parent", required: true, index: true },
    teacher: { type: Schema.Types.ObjectId, ref: "Teacher", required: true, index: true },
    student: { type: Schema.Types.ObjectId, ref: "Student", required: true, index: true },
    batch: { type: Schema.Types.ObjectId, ref: "Batch", required: true, index: true },
    senderRole: {
      type: String,
      enum: ["parent", "teacher"],
      required: true,
      index: true,
    },
    senderUser: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    subject: { type: String, trim: true, default: "" },
    message: { type: String, required: true, trim: true },
    isRead: { type: Boolean, default: false, index: true },
    readAt: { type: Date },
    status: {
      type: String,
      enum: ["sent", "delivered", "read"],
      default: "sent",
      index: true,
    },
  },
  { timestamps: true }
);

// Compound indexes for efficient thread retrieval and child-isolation
ParentTeacherMessageSchema.index({ student: 1, teacher: 1, createdAt: 1 });
ParentTeacherMessageSchema.index({ parent: 1, student: 1, createdAt: 1 });
ParentTeacherMessageSchema.index({ teacher: 1, isRead: 1 });

ParentTeacherMessageSchema.plugin(baseModelPlugin);

export const ParentTeacherMessage =
  mongoose.models.ParentTeacherMessage ||
  mongoose.model<IParentTeacherMessage>("ParentTeacherMessage", ParentTeacherMessageSchema);
