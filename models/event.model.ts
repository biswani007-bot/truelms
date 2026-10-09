import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export interface IEventSpeaker {
  name: string;
  designation?: string;
  company?: string;
  photo?: string;
  bio?: string;
  linkedin?: string;
}

export interface IEvent extends IBaseDocument {
  title: string;
  slug: string;
  description: string;
  shortDescription?: string;
  eventDate: Date;
  endDate?: Date;
  venue?: string;
  venueAddress?: string;
  city?: string;
  country?: string;
  mode: "online" | "offline" | "hybrid";
  meetingLink?: string;
  thumbnail?: string;
  banner?: string;
  speakers: IEventSpeaker[];
  capacity?: number;
  registeredCount: number;
  registrationOpen: boolean;
  registrationDeadline?: Date;
  tags?: string[];
  status: "draft" | "published" | "cancelled" | "completed";
  seoTitle?: string;
  seoDescription?: string;
  featured: boolean;
}

const EventSpeakerSchema = new Schema(
  {
    name: { type: String, required: true },
    designation: { type: String },
    company: { type: String },
    photo: { type: String },
    bio: { type: String },
    linkedin: { type: String },
  },
  { _id: false }
);

const EventSchema = new Schema(
  {
    title: { type: String, required: true, index: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String, required: true },
    shortDescription: { type: String },
    eventDate: { type: Date, required: true, index: true },
    endDate: { type: Date },
    venue: { type: String },
    venueAddress: { type: String },
    city: { type: String },
    country: { type: String },
    mode: {
      type: String,
      enum: ["online", "offline", "hybrid"],
      required: true,
      default: "online",
      index: true,
    },
    meetingLink: { type: String },
    thumbnail: { type: String },
    banner: { type: String },
    speakers: [EventSpeakerSchema],
    capacity: { type: Number },
    registeredCount: { type: Number, default: 0 },
    registrationOpen: { type: Boolean, default: true, index: true },
    registrationDeadline: { type: Date },
    tags: [{ type: String }],
    status: {
      type: String,
      enum: ["draft", "published", "cancelled", "completed"],
      default: "draft",
      index: true,
    },
    seoTitle: { type: String },
    seoDescription: { type: String },
    featured: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

EventSchema.plugin(baseModelPlugin);

export const Event =
  mongoose.models.Event || mongoose.model<IEvent>("Event", EventSchema);
