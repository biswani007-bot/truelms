import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export interface IApiKey extends IBaseDocument {
  apiClient: mongoose.Types.ObjectId; // References ApiClient
  keyId: string; // Public key identifier prefix
  hashedSecret: string; // Hashed secret
  scopes: string[]; // Scopes array (e.g. ["read:students", "write:enrollments"])
  allowedIps: string[]; // IP constraints
  expiresAt: Date;
  status: "active" | "revoked" | "expired";
  lastUsedAt?: Date;
}

const ApiKeySchema = new Schema(
  {
    apiClient: { type: Schema.Types.ObjectId, ref: "ApiClient", required: true, index: true },
    keyId: { type: String, required: true, unique: true, index: true },
    hashedSecret: { type: String, required: true },
    scopes: [{ type: String }],
    allowedIps: [{ type: String }],
    expiresAt: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: ["active", "revoked", "expired"],
      required: true,
      default: "active",
      index: true,
    },
    lastUsedAt: { type: Date },
  },
  { timestamps: true }
);

ApiKeySchema.plugin(baseModelPlugin);

export const ApiKey =
  mongoose.models.ApiKey ||
  mongoose.model<IApiKey>("ApiKey", ApiKeySchema);
