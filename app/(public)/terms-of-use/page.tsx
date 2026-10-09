import type { Metadata } from "next";
import { TermsOfUseClient } from "./TermsOfUseClient";

export const metadata: Metadata = {
  title: "Terms of Use | TrueLern",
  description: "Website & Academy Service Terms for TrueLern.",
};

export default function TermsOfUsePage() {
  return <TermsOfUseClient />;
}
