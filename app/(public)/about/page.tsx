import React from "react";
import { AboutClient } from "./AboutClient";
import { connectDB } from "../../../config/db";

export const metadata = {
  title: "About Us | TrueLern",
  description: "Learn about the mission, values, and leadership behind the global live cohort learning platform.",
};

export default async function AboutPage() {
  await connectDB();

  return <AboutClient />;
}
