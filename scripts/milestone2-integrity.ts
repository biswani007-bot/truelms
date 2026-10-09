import { config } from "dotenv";
config({ path: ".env" });
import mongoose from "mongoose";

async function runMilestone2Integrity() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  const db = mongoose.connection.useDb("lmsca");
  console.log("Starting Milestone 2 Integrity Check...\n");

  const issues: string[] = [];

  const check = (condition: boolean, message: string) => {
    if (!condition) issues.push(message);
  };

  // 1. orphan ParentStudentLink
  const PSL = db.collection("parentstudentlinks");
  const pLinks = await PSL.find({ isDeleted: { $ne: true } }).toArray();
  for (const l of pLinks) {
    const p = await db.collection("parents").findOne({ _id: l.parent, isDeleted: { $ne: true } });
    const s = await db.collection("students").findOne({ _id: l.student, isDeleted: { $ne: true } });
    check(!!p, `[ParentStudentLink ${l._id}] Orphaned Parent: ${l.parent}`);
    check(!!s, `[ParentStudentLink ${l._id}] Orphaned Student: ${l.student}`);
  }

  // 2. orphan BatchStudent
  const BS = db.collection("batchstudents");
  const bLinks = await BS.find({ isDeleted: { $ne: true }, status: "active" }).toArray();
  for (const l of bLinks) {
    const b = await db.collection("batches").findOne({ _id: l.batch, isDeleted: { $ne: true } });
    const s = await db.collection("students").findOne({ _id: l.student, isDeleted: { $ne: true } });
    check(!!b, `[BatchStudent ${l._id}] Orphaned Batch: ${l.batch}`);
    check(!!s, `[BatchStudent ${l._id}] Orphaned Student: ${l.student}`);
  }

  // 3. orphan Enrollment
  const Enrolls = db.collection("enrollments");
  const enrolls = await Enrolls.find({ isDeleted: { $ne: true } }).toArray();
  for (const e of enrolls) {
    const s = await db.collection("students").findOne({ _id: e.student, isDeleted: { $ne: true } });
    const c = await db.collection("courses").findOne({ _id: e.course, isDeleted: { $ne: true } });
    check(!!s, `[Enrollment ${e._id}] Orphaned Student: ${e.student}`);
    check(!!c, `[Enrollment ${e._id}] Orphaned Course: ${e.course}`);
  }

  // 4. orphan AssignmentSubmission
  const Subs = db.collection("assignmentsubmissions");
  const subs = await Subs.find({ isDeleted: { $ne: true } }).toArray();
  for (const sub of subs) {
    const a = await db.collection("assignments").findOne({ _id: sub.assignment, isDeleted: { $ne: true } });
    const s = await db.collection("students").findOne({ _id: sub.student, isDeleted: { $ne: true } });
    check(!!a, `[AssignmentSubmission ${sub._id}] Orphaned Assignment: ${sub.assignment}`);
    check(!!s, `[AssignmentSubmission ${sub._id}] Orphaned Student: ${sub.student}`);
  }

  // 5. orphan LiveClass
  const LCs = db.collection("liveclasses");
  const lcs = await LCs.find({ isDeleted: { $ne: true } }).toArray();
  for (const lc of lcs) {
    if (lc.batch) {
      const b = await db.collection("batches").findOne({ _id: lc.batch, isDeleted: { $ne: true } });
      check(!!b, `[LiveClass ${lc._id}] Orphaned Batch: ${lc.batch}`);
    }
  }

  // 6. orphan Assessment results
  const ARs = db.collection("assessmentresults");
  const ars = await ARs.find({ isDeleted: { $ne: true } }).toArray();
  for (const ar of ars) {
    const a = await db.collection("assessments").findOne({ _id: ar.assessment, isDeleted: { $ne: true } });
    const s = await db.collection("students").findOne({ _id: ar.student, isDeleted: { $ne: true } });
    check(!!a, `[AssessmentResult ${ar._id}] Orphaned Assessment: ${ar.assessment}`);
    check(!!s, `[AssessmentResult ${ar._id}] Orphaned Student: ${ar.student}`);
  }

  // 7. active batch referencing archived course
  const Batches = db.collection("batches");
  const batches = await Batches.find({ isDeleted: { $ne: true }, status: { $ne: "archived" } }).toArray();
  for (const b of batches) {
    const c = await db.collection("courses").findOne({ _id: b.course });
    check(!!c && !c.isDeleted, `[Batch ${b._id}] References archived/deleted Course: ${b.course}`);
  }

  // 8. active student referencing invalid batch
  for (const l of bLinks) {
    const b = await db.collection("batches").findOne({ _id: l.batch, isDeleted: { $ne: true }, status: { $ne: "archived" } });
    check(!!b, `[BatchStudent ${l._id}] Student ${l.student} references invalid/archived Batch: ${l.batch}`);
  }

  console.log(`\n--- Integrity Check Results ---`);
  if (issues.length === 0) {
    console.log(`PASS: No integrity issues found.`);
  } else {
    console.log(`FAIL: Found ${issues.length} integrity issues:`);
    issues.forEach(i => console.log(" - " + i));
  }

  process.exit(issues.length > 0 ? 1 : 0);
}

runMilestone2Integrity().catch(console.error);
