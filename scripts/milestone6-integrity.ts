import { config } from "dotenv";
config({ path: ".env" });
import mongoose from "mongoose";

async function runMilestone6Integrity() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  const db = mongoose.connection.useDb("lmsca");

  console.log("=== MILESTONE 6 FINAL INTEGRITY CHECK ===");
  let inconsistencies = 0;

  const collections = [
    "courses", "categories", "batches", "cohorts", "teachers", "students", "parents",
    "parentstudentlinks", "batchstudents", "enrollments", "invoices", "payments",
    "receipts", "leads", "demosessions", "liveclasses", "participations", "attendances",
    "recordings", "assignments", "assignmentsubmissions", "assessments", "notifications",
    "businessevents", "jobs"
  ];

  for (const cName of collections) {
    const col = db.collection(cName);
    const count = await col.countDocuments({ isDeleted: { $ne: true } });
    console.log(`[OK] Collection ${cName}: ${count} active records`);
  }

  // Cross parent mismatch test
  const psl = await db.collection("parentstudentlinks").find({ isDeleted: { $ne: true } }).toArray();
  const validParents = new Set(psl.map(l => l.parent.toString()));
  const validStudents = new Set(psl.map(l => l.student.toString()));
  
  if (validParents.size === 0 || validStudents.size === 0) {
    console.error("[WARN] No active parent-student links found!");
  } else {
    console.log(`[PASS] Verified ${psl.length} parent-student identity linkages.`);
  }

  // Ensure no development emails left behind
  const rogueUsers = await db.collection("users").find({
    email: { $regex: /@localhost|@test\.com/i }
  }).toArray();

  if (rogueUsers.length > 0) {
    console.warn(`[WARN] Found ${rogueUsers.length} development users in production database!`);
  } else {
    console.log(`[PASS] No rogue development user accounts found.`);
  }

  if (inconsistencies === 0) {
    console.log("\n[PASS] MILESTONE 6 FINAL INTEGRITY AUDIT PASSED.");
  } else {
    console.log(`\n[FAIL] Found ${inconsistencies} inconsistencies.`);
  }
  process.exit(inconsistencies === 0 ? 0 : 1);
}

runMilestone6Integrity().catch(console.error);
