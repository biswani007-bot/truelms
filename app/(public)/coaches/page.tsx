import type { Metadata } from "next";
import { CoachesClient } from "./CoachesClient";

export const metadata: Metadata = {
  title: "Our Coaches & Teaching Standards | TrueLern",
  description:
    "Learn about TrueLern's rigorous coach selection criteria, teaching standards, and the trained mentors who guide our live cohort sessions.",
};

export default function CoachesPage() {
  return <CoachesClient />;
}
