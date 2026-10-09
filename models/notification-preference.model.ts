import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export interface INotificationPreference extends IBaseDocument {
  user: mongoose.Types.ObjectId; // References User
  channelPreferences: Map<string, boolean>; // e.g. "email" -> true, "sms" -> false
  eventPreferences: Map<string, boolean>; // e.g. "finance" -> true, "attendance" -> false
  muteAll: boolean;
  digestEnabled: boolean;
  language: string;
  timezone: string;
}

const NotificationPreferenceSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    channelPreferences: {
      type: Map,
      of: Boolean,
      required: true,
      default: { email: true, sms: true, whatsapp: true, push: true, "in-app": true },
    },
    eventPreferences: {
      type: Map,
      of: Boolean,
      required: true,
      default: {
        admissions: true,
        enrollment: true,
        attendance: true,
        assignment: true,
        assessment: true,
        certificate: true,
        finance: true,
        reports: true,
      },
    },
    muteAll: { type: Boolean, required: true, default: false },
    digestEnabled: { type: Boolean, required: true, default: false },
    language: { type: String, required: true, default: "en" },
    timezone: { type: String, required: true, default: "UTC" },
  },
  { timestamps: true }
);

NotificationPreferenceSchema.plugin(baseModelPlugin);

export const NotificationPreference =
  mongoose.models.NotificationPreference ||
  mongoose.model<INotificationPreference>("NotificationPreference", NotificationPreferenceSchema);
