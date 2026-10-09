import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export interface IAttendanceSession extends IBaseDocument {
  liveClass: mongoose.Types.ObjectId;
  batch: mongoose.Types.ObjectId;
  status: "open" | "closed" | "frozen";
  openedAt: Date;
  closedAt?: Date;
  frozenAt?: Date;
  markedCount: number;
}

const AttendanceSessionSchema = new Schema(
  {
    liveClass: { type: Schema.Types.ObjectId, ref: "LiveClass", required: true, unique: true, index: true },
    batch: { type: Schema.Types.ObjectId, ref: "Batch", required: true, index: true },
    status: {
      type: String,
      enum: ["open", "closed", "frozen"],
      required: true,
      default: "open",
      index: true,
    },
    openedAt: { type: Date, required: true, default: Date.now },
    closedAt: { type: Date },
    frozenAt: { type: Date },
    markedCount: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

AttendanceSessionSchema.plugin(baseModelPlugin);

export const AttendanceSession =
  mongoose.models.AttendanceSession ||
  mongoose.model<IAttendanceSession>("AttendanceSession", AttendanceSessionSchema);
