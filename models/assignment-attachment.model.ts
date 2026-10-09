import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export interface IAssignmentAttachment extends IBaseDocument {
  assignment: mongoose.Types.ObjectId;
  fileName: string;
  fileUrl: string;
  fileSize?: number;
  fileType: string;
}

const AssignmentAttachmentSchema = new Schema(
  {
    assignment: { type: Schema.Types.ObjectId, ref: "Assignment", required: true, index: true },
    fileName: { type: String, required: true },
    fileUrl: { type: String, required: true },
    fileSize: { type: Number },
    fileType: { type: String, required: true, index: true },
  },
  { timestamps: true }
);

AssignmentAttachmentSchema.plugin(baseModelPlugin);

export const AssignmentAttachment =
  mongoose.models.AssignmentAttachment ||
  mongoose.model<IAssignmentAttachment>("AssignmentAttachment", AssignmentAttachmentSchema);
