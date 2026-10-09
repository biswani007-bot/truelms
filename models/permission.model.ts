import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export interface IPermission extends IBaseDocument {
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

const PermissionSchema = new Schema(
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
  },
  { timestamps: true }
);

PermissionSchema.plugin(baseModelPlugin);

export const Permission =
  mongoose.models.Permission ||
  mongoose.model<IPermission>("Permission", PermissionSchema);
