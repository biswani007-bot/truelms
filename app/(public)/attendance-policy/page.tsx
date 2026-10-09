import type { Metadata } from "next";
import { AttendancePolicyClient } from "./AttendancePolicyClient";

export const metadata: Metadata = {
  title: "Attendance & Class Policy | TrueLern",
  description: "Attendance expectations, class rules, and makeup policies for TrueLern live cohorts.",
};

export default function AttendancePolicyPage() {
  return <AttendancePolicyClient />;
}
