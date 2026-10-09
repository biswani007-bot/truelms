import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export interface IApiUsage extends IBaseDocument {
  apiClient: mongoose.Types.ObjectId; // References ApiClient
  apiKey: mongoose.Types.ObjectId; // References ApiKey
  path: string;
  method: string;
  statusCode: number;
  durationMs: number;
  version: string;
}

const ApiUsageSchema = new Schema(
  {
    apiClient: { type: Schema.Types.ObjectId, ref: "ApiClient", required: true, index: true },
    apiKey: { type: Schema.Types.ObjectId, ref: "ApiKey", required: true, index: true },
    path: { type: String, required: true, index: true },
    method: { type: String, required: true, index: true },
    statusCode: { type: Number, required: true, index: true },
    durationMs: { type: Number, required: true },
    version: { type: String, required: true, default: "v1", index: true },
  },
  { timestamps: true }
);

ApiUsageSchema.plugin(baseModelPlugin);

export const ApiUsage =
  mongoose.models.ApiUsage ||
  mongoose.model<IApiUsage>("ApiUsage", ApiUsageSchema);
