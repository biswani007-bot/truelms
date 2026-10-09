import type { Metadata } from "next";
import { ParentProgressClient } from "./ParentProgressClient";

export const metadata: Metadata = {
  title: "Parent Progress Updates | TrueLern",
  description:
    "See how TrueLern keeps parents informed through progress reports, feedback, milestones and child development scorecards.",
};

export default function ParentProgressPage() {
  return <ParentProgressClient />;
}
