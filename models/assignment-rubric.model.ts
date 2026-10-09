import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export interface IAssignmentRubric extends IBaseDocument {
  assignment: mongoose.Types.ObjectId;
  criterion: string;
  maxMarks: number;
  description?: string;
}

const AssignmentRubricSchema = new Schema(
  {
    assignment: { type: Schema.Types.ObjectId, ref: "Assignment", required: true, index: true },
    criterion: { type: String, required: true },
    maxMarks: { type: Number, required: true, default: 20 },
    description: { type: String },
  },
  { timestamps: true }
);

AssignmentRubricSchema.plugin(baseModelPlugin);

export const AssignmentRubric =
  mongoose.models.AssignmentRubric ||
  mongoose.model<IAssignmentRubric>("AssignmentRubric", AssignmentRubricSchema);
