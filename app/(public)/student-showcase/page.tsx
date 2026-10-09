import type { Metadata } from "next";
import { StudentShowcaseClient } from "./StudentShowcaseClient";

export const metadata: Metadata = {
  title: "Student Showcase | TrueLern",
  description:
    "See the projects, speeches, and milestones TrueLern students complete to build confidence and practical skills.",
};

export default function StudentShowcasePage() {
  return <StudentShowcaseClient />;
}
