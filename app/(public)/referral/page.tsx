import type { Metadata } from "next";
import { ReferralClient } from "./ReferralClient";

export const metadata: Metadata = {
  title: "Refer a Family | TrueLern",
  description:
    "Know a family whose child could benefit from TrueLern? Refer them to us and help another child build practical skills beyond school.",
};

export default function ReferralPage() {
  return <ReferralClient />;
}
