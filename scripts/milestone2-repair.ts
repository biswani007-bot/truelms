import { config } from "dotenv";
config({ path: ".env" });
import mongoose from "mongoose";
import { connectDB } from "../config/db";

async function runMilestone2Repair() {
  await connectDB();
  const db = mongoose.connection.useDb("lmsca");
  console.log("Starting Milestone 2 Database Repair...\n");

  // 1. Remap orphaned Enrollments
  const Courses = db.collection("courses");
  const Enrollments = db.collection("enrollments");
  
  const canonicalCourse = await Courses.findOne({ slug: "junior-foundation-ages-6-to-10", isDeleted: { $ne: true } });
  if (!canonicalCourse) {
    console.error("Critical: Canonical 'Junior Foundation' course not found!");
    process.exit(1);
  }

  const archivedCourseIds = (await Courses.find({ isDeleted: true }).toArray()).map(c => c._id);
  
  if (archivedCourseIds.length > 0) {
    const result = await Enrollments.updateMany(
      { course: { $in: archivedCourseIds } },
      { $set: { course: canonicalCourse._id } }
    );
    console.log(`Remapped ${result.modifiedCount} orphaned Enrollments to canonical Course (${canonicalCourse._id})`);
  }

  // 2. Fix Jitsi URLs in LiveClasses
  const LiveClasses = db.collection("liveclasses");
  const lcs = await LiveClasses.find({ isDeleted: { $ne: true } }).toArray();
  let lcFixed = 0;
  for (const lc of lcs) {
    if (lc.meetingPlatform === "jitsi" && lc.meetingLink && !lc.meetingLink.includes("livetl.visital.in")) {
      // Typically it's just a path or old domain. We want https://livetl.visital.in/ROOM
      // If the link is just a path like /teacher/live/ROOM, we'll keep it as the meetingLink is sometimes an internal path.
      // Actually, if it's an absolute URL that is incorrect, we fix it. If it's a relative path to the app, it's fine.
      // Let's force any absolute URL to use livetl.visital.in if it has a room ID.
      // Looking at the implementation plan, the URL should be consistent.
      // Wait, the app uses `/parent/demo/join` for parent demos, and Jitsi domain is configured in env JITSI_DOMAIN.
      // I'll skip modifying meetingLink if it's a relative path, but if it starts with http, fix it.
      if (lc.meetingLink.startsWith("http")) {
        const parts = lc.meetingLink.split("/");
        const room = parts[parts.length - 1];
        const newLink = `https://livetl.visital.in/${room}`;
        await LiveClasses.updateOne({ _id: lc._id }, { $set: { meetingLink: newLink } });
        lcFixed++;
      }
    }
  }
  console.log(`Fixed Jitsi Links in ${lcFixed} LiveClass records`);

  // 3. Fix Jitsi URLs in DemoSessions
  const DemoSessions = db.collection("demosessions");
  const demos = await DemoSessions.find({ isDeleted: { $ne: true } }).toArray();
  let demoFixed = 0;
  for (const demo of demos) {
    if (demo.meetingPlatform === "jitsi" && demo.meetingLink && demo.meetingLink.startsWith("http") && !demo.meetingLink.includes("livetl.visital.in")) {
      const parts = demo.meetingLink.split("/");
      const room = parts[parts.length - 1];
      const newLink = `https://livetl.visital.in/${room}`;
      await DemoSessions.updateOne({ _id: demo._id }, { $set: { meetingLink: newLink } });
      demoFixed++;
    }
  }
  console.log(`Fixed Jitsi Links in ${demoFixed} DemoSession records`);

  console.log(`\n--- Repair Complete ---`);
  process.exit(0);
}

runMilestone2Repair().catch(console.error);
