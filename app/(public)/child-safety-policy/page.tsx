import type { Metadata } from "next";
import { ChildSafetyPolicyClient } from "./ChildSafetyPolicyClient";

export const metadata: Metadata = {
  title: "Child Safety Policy | TrueLern",
  description: "Online Safety & Child Protection Standards for TrueLern.",
};

export default function ChildSafetyPolicyPage() {
  return <ChildSafetyPolicyClient />;
}
