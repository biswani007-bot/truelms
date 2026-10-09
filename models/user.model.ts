import mongoose, { Schema } from "mongoose";
import { IRole } from "./role.model";
import "./role.model";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export interface IUser extends IBaseDocument {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  role: mongoose.Types.ObjectId | IRole;
  isActive: boolean;
  refreshToken?: string;
  resetPasswordToken?: string;
  resetPasswordExpire?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: [
        /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/,
        "Please add a valid email",
      ],
    },
    password: {
      type: String,
      select: false,
    },
    role: {
      type: Schema.Types.ObjectId,
      ref: "Role",
      required: true,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    refreshToken: {
      type: String,
      select: false,
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  { timestamps: true }
);

// Indexes
UserSchema.index({ email: 1, isDeleted: 1 }, { unique: true });
UserSchema.index({ createdAt: 1 });

UserSchema.plugin(baseModelPlugin);

export const User =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
