import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Contact the TrueLern admissions team. Ask about our programs, fees, scholarships, or schedule a demo.",
  openGraph: {
    title: "Contact Us | TrueLern",
    description: "Reach out to our admissions team. We respond within 24 hours.",
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
