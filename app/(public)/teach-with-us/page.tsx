import type { Metadata } from "next";
import { TeachWithUsClient } from "./TeachWithUsClient";

export const metadata: Metadata = {
  title: "Teach With Us — Faculty Careers | TrueLern",
  description:
    "Join TrueLern's global faculty. We are looking for child-friendly online coaches to teach confidence, communication, emotional intelligence, and money skills.",
};

export default function TeachWithUsPage() {
  return <TeachWithUsClient />;
}
