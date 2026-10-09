import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Newsletter",
  description: "Subscribe to TrueLern newsletter for new cohorts, tech insights, and career resources.",
};

export default function NewsletterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
