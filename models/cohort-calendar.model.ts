import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export interface ICalendarEvent {
  title: string;
  description?: string;
  eventDate: Date;
  type: "orientation" | "holiday" | "exam-window" | "special-event";
}

export interface ICohortCalendar extends IBaseDocument {
  cohort: mongoose.Types.ObjectId;
  events: ICalendarEvent[];
}

const CohortCalendarSchema = new Schema(
  {
    cohort: { type: Schema.Types.ObjectId, ref: "Cohort", required: true, unique: true, index: true },
    events: [
      {
        title: { type: String, required: true },
        description: { type: String },
        eventDate: { type: Date, required: true },
        type: { type: String, enum: ["orientation", "holiday", "exam-window", "special-event"], required: true },
      },
    ],
  },
  { timestamps: true }
);

CohortCalendarSchema.plugin(baseModelPlugin);

export const CohortCalendar =
  mongoose.models.CohortCalendar ||
  mongoose.model<ICohortCalendar>("CohortCalendar", CohortCalendarSchema);
