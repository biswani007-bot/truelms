import mongoose, { Schema, Document, Query } from "mongoose";

export interface IBaseFields {
  status: string;
  createdBy?: string;
  updatedBy?: string;
  deletedAt?: Date;
  isDeleted: boolean;
}

export interface IBaseDocument extends Document<mongoose.Types.ObjectId>, IBaseFields {
  softDelete(userId?: string): Promise<this>;
  restore(): Promise<this>;
}

export function baseModelPlugin(schema: Schema) {
  // Add base fields
  schema.add({
    status: {
      type: String,
      required: true,
      default: "ACTIVE",
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    deletedAt: {
      type: Date,
      required: false,
    },
    isDeleted: {
      type: Boolean,
      required: true,
      default: false,
      index: true,
    },
  });

  // Filter out deleted records on find hooks
  const filterNonDeleted = function (this: Query<any, any>) {
    const filter = this.getFilter();
    if (filter.isDeleted === undefined) {
      this.where({ isDeleted: false });
    }
  };

  schema.pre("find", filterNonDeleted);
  schema.pre("findOne", filterNonDeleted);
  schema.pre("findOneAndUpdate", filterNonDeleted);
  schema.pre("updateMany", filterNonDeleted);
  schema.pre("updateOne", filterNonDeleted);
  schema.pre("countDocuments", filterNonDeleted);

  // Soft delete method on document
  schema.methods.softDelete = async function (this: IBaseDocument, userId?: string) {
    this.isDeleted = true;
    this.deletedAt = new Date();
    this.status = "ARCHIVED";
    if (userId) {
      this.updatedBy = userId as any;
    }
    return this.save();
  };

  // Restore method on document
  schema.methods.restore = async function (this: IBaseDocument) {
    this.isDeleted = false;
    this.deletedAt = undefined;
    this.status = "ACTIVE";
    return this.save();
  };
}
