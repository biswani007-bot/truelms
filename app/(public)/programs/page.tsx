import type { Metadata } from "next";
import { ProgramsClient } from "./ProgramsClient";

export const metadata: Metadata = {
  title: "Programs — Life Skills Tracks for Children | TrueLern",
  description:
    "Explore TrueLern's 8 structured live cohort programs for children aged 6–18: Junior Foundation, Future-Ready Builders, Communication, Money Skills, AI Readiness, Emotional Intelligence, Time Management, and Practical Thinking.",
};

export default function ProgramsPage() {
  return <ProgramsClient />;
}
