import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const CANONICAL_SLUGS = [
  "junior-foundation-ages-6-to-10",
  "future-ready-builders-ages-9-to-14",
  "communication-and-confidence",
  "money-skills",
  "emotional-intelligence",
  "ai-readiness",
  "time-management-and-habits",
  "practical-real-world-thinking",
];

async function runCleanup() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI missing");

  await mongoose.connect(uri);
  console.log("[M1 Cleanup] Connected to DB");

  const db = mongoose.connection;
  
  // 1. Identify canonical target (Junior Foundation is a safe fallback)
  const fallbackCourse = await db.collection("courses").findOne({ slug: "junior-foundation-ages-6-to-10" });
  if (!fallbackCourse) {
    console.error("Missing canonical fallback course. Please run seed-curriculum.js first.");
    process.exit(1);
  }
  const fallbackCourseId = fallbackCourse._id;
  const canonicalCategoryId = fallbackCourse.category;

  // 2. Identify Non-Canonical Courses
  const nonCanonicalCourses = await db.collection("courses").find({
    slug: { $nin: CANONICAL_SLUGS },
    isDeleted: { $ne: true }
  }).toArray();

  const nonCanonicalIds = nonCanonicalCourses.map(c => c._id);
  console.log(`[M1 Cleanup] Found ${nonCanonicalIds.length} non-canonical courses to archive.`);

  if (nonCanonicalIds.length > 0) {
    // 3. Re-map Batches pointing to wrong courses
    const batchRes = await db.collection("batches").updateMany(
      { course: { $in: nonCanonicalIds } },
      { $set: { course: fallbackCourseId } }
    );
    console.log(`[M1 Cleanup] Re-mapped ${batchRes.modifiedCount} batches to canonical fallback.`);

    // 4. Re-map Cohorts pointing to wrong courses
    const cohortRes = await db.collection("cohorts").updateMany(
      { course: { $in: nonCanonicalIds } },
      { $set: { course: fallbackCourseId } }
    );
    console.log(`[M1 Cleanup] Re-mapped ${cohortRes.modifiedCount} cohorts to canonical fallback.`);

    // 5. Re-map LiveClasses
    const lcRes = await db.collection("liveclasses").updateMany(
      { course: { $in: nonCanonicalIds } },
      { $set: { course: fallbackCourseId } }
    );
    console.log(`[M1 Cleanup] Re-mapped ${lcRes.modifiedCount} LiveClasses to canonical fallback.`);

    // 6. Archive wrong courses
    const courseArch = await db.collection("courses").updateMany(
      { _id: { $in: nonCanonicalIds } },
      { $set: { isDeleted: true, status: "archived" } }
    );
    console.log(`[M1 Cleanup] Archived ${courseArch.modifiedCount} invalid courses.`);
  }

  // 7. Archive invalid categories
  const catArch = await db.collection("coursecategories").updateMany(
    { _id: { $ne: canonicalCategoryId } },
    { $set: { isDeleted: true, status: "INACTIVE" } }
  );
  console.log(`[M1 Cleanup] Archived ${catArch.modifiedCount} non-canonical categories.`);

  console.log("[M1 Cleanup] Success!");
  await mongoose.disconnect();
}

runCleanup().catch(err => {
  console.error(err);
  process.exit(1);
});
