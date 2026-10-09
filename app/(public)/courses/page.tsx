import React from "react";
import { ProgramsClient } from "../programs/ProgramsClient";

export const revalidate = 60;

export const metadata = {
  title: "Live Cohort Courses",
  description:
    "Browse high-impact interactive live cohorts in engineering, product, and technology. Real faculty, real projects, real results.",
  openGraph: {
    title: "Live Cohort Courses | TrueLern",
    description:
      "Browse high-impact interactive live cohorts led by industry experts.",
  },
};

export default function CoursesPage() {
  return <ProgramsClient />;
}
