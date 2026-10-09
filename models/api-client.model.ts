import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export interface IApiClient extends IBaseDocument {
  name: string;
  contactEmail: string;
  status: "active" | "inactive";
}

const ApiClientSchema = new Schema(
  {
    name: { type: String, required: true, unique: true, index: true },
    contactEmail: { type: String, required: true },
    status: { type: String, enum: ["active", "inactive"], required: true, default: "active", index: true },
  },
  { timestamps: true }
);

ApiClientSchema.plugin(baseModelPlugin);

export const ApiClient =
  mongoose.models.ApiClient ||
  mongoose.model<IApiClient>("ApiClient", ApiClientSchema);
