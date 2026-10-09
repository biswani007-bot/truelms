import mongoose, { Schema } from "mongoose";
import { IPermission } from "./permission.model";
import "./permission.model";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export interface IRole extends IBaseDocument {
  name: string;
  description: string;
  permissions: mongoose.Types.ObjectId[] | IPermission[];
  createdAt: Date;
  updatedAt: Date;
}

const RoleSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    permissions: [
      {
        type: Schema.Types.ObjectId,
        ref: "Permission",
      },
    ],
  },
  { timestamps: true }
);

RoleSchema.plugin(baseModelPlugin);

export const Role =
  mongoose.models.Role || mongoose.model<IRole>("Role", RoleSchema);
