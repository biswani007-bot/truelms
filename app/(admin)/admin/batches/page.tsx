import React from "react";
import { connectDB } from "../../../../config/db";
import { batchRepository } from "../../../../repositories/batch.repository";
import { AcademicResolver } from "../../../../services/academic/academic.service";
import { BatchManagementView } from "../../../../components/admin/BatchManagementView";

export const revalidate = 0;

export default async function BatchListPage() {
  await connectDB();
  const rawBatches = await batchRepository.findMany({}, { populate: ["cohort", "course", "primaryTeacher"] });
  const batches = JSON.parse(JSON.stringify(rawBatches.map((b: any) => AcademicResolver.resolveBatch(b))));

  return <BatchManagementView initialBatches={batches} />;
}
