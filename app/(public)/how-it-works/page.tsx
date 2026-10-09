import type { Metadata } from "next";
import { HowItWorksClient } from "./HowItWorksClient";

export const metadata: Metadata = {
  title: "How TrueLern Works — The Learning Journey | TrueLern",
  description:
    "Discover how TrueLern's structured 9-step learning journey works — from your first free demo class to level graduation, with live cohort sessions of maximum 5 children.",
};

export default function HowItWorksPage() {
  return <HowItWorksClient />;
}
