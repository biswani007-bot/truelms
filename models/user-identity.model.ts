import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export interface IUserIdentity extends IBaseDocument {
  user: mongoose.Types.ObjectId;
  provider: "google" | "microsoft";
  providerSubject: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserIdentitySchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    provider: {
      type: String,
      required: true,
      enum: ["google", "microsoft"],
      trim: true,
    },
    providerSubject: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

// Prevent the same external identity from being associated with multiple TrueLern users
UserIdentitySchema.index({ provider: 1, providerSubject: 1 }, { unique: true });

// Prevent one TrueLern user from having multiple identities for the same provider
UserIdentitySchema.index({ user: 1, provider: 1 }, { unique: true });

UserIdentitySchema.plugin(baseModelPlugin);

export const UserIdentity =
  mongoose.models.UserIdentity ||
  mongoose.model<IUserIdentity>("UserIdentity", UserIdentitySchema);
