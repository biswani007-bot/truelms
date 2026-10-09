import mongoose, { Schema } from "mongoose";
import { baseModelPlugin, IBaseDocument } from "../lib/db/base.plugin";

export interface INavigationItem {
  label: string;
  url: string;
  icon?: string;
  order: number;
  visibility: boolean;
  children?: INavigationItem[];
}

export interface INavigation extends IBaseDocument {
  name: string; // e.g. "header", "footer"
  items: INavigationItem[];
}

const NavigationItemSchema = new Schema({
  label: { type: String, required: true },
  url: { type: String, required: true },
  icon: { type: String },
  order: { type: Number, default: 0 },
  visibility: { type: Boolean, default: true },
});

// For deep nesting, recurse schema
NavigationItemSchema.add({
  children: [NavigationItemSchema],
});

const NavigationSchema = new Schema(
  {
    name: { type: String, required: true, unique: true, index: true },
    items: [NavigationItemSchema],
  },
  { timestamps: true }
);

NavigationSchema.plugin(baseModelPlugin);

export const Navigation =
  mongoose.models.Navigation || mongoose.model<INavigation>("Navigation", NavigationSchema);
