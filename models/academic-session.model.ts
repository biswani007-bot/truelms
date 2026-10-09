import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export interface IAcademicSession extends IBaseDocument {
  name: string; // e.g. "2026", "2026-2027", "Quarter", "Semester"
  startDate: Date;
  endDate: Date;
  status: "active" | "inactive";
}

const AcademicSessionSchema = new Schema(
  {
    name: { type: String, required: true, unique: true, index: true },
    startDate: { type: Date, required: true, index: true },
    endDate: { type: Date, required: true, index: true },
    status: { type: String, enum: ["active", "inactive"], default: "active", index: true },
  },
  { timestamps: true }
);

AcademicSessionSchema.plugin(baseModelPlugin);

export const AcademicSession =
  mongoose.models.AcademicSession ||
  mongoose.model<IAcademicSession>("AcademicSession", AcademicSessionSchema);
