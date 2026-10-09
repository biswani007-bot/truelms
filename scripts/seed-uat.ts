import mongoose from "mongoose";
import { connectDB } from "../config/db";
import { Student } from "../models/student.model";
import { Parent } from "../models/parent.model";
import { Enrollment } from "../models/enrollment.model";
import { Batch } from "../models/batch.model";
import { Course } from "../models/course.model";
import { BatchTeacher } from "../models/batch-teacher.model";
import { Teacher } from "../models/teacher.model";
import { Cohort } from "../models/cohort.model";
import { User } from "../models/user.model";

async function seedUAT() {
  await connectDB();
  console.log("Database connected. Creating UAT data trace...");

  // Get or Create Course
  let course: any = await Course.findOne({}).lean();
  if (!course) {
    console.log("Creating default Course");
    course = await Course.create({
      name: "UAT Full Stack Web Development",
      slug: "uat-full-stack",
      description: "A comprehensive UAT test course",
      category: new mongoose.Types.ObjectId(),
      status: "published",
      duration: "12 Weeks",
      level: "beginner",
    });
  }

  // Get or Create Cohort
  let cohort: any = await Cohort.findOne({}).lean();
  if (!cohort) {
    console.log("Creating default Cohort");
    cohort = await Cohort.create({
      name: "UAT Autumn 2026",
      status: "active",
      startDate: new Date(),
      endDate: new Date(Date.now() + 90 * 24 * 3600000),
    });
  }

  // Get Teacher Account
  let teacherUser: any = await User.findOne({ email: "teacher@truelern.com" }).lean();
  let teacher: any = await Teacher.findOne({ user: teacherUser?._id }).lean();
  if (!teacher) {
    console.log("ERROR: test teacher@truelern.com not found!");
    process.exit(1);
  }

  // Create Batch
  let batch: any = await Batch.findOne({ batchCode: "UAT-B1" }).lean();
  if (!batch) {
    console.log("Creating UAT Batch");
    batch = await Batch.create({
      batchCode: "UAT-B1",
      batchName: "UAT Master Batch",
      cohort: cohort._id,
      course: course._id,
      primaryTeacher: teacher._id,
      batchStart: new Date(),
      batchEnd: new Date(Date.now() + 90 * 24 * 3600000),
      status: "active",
    });
  }

  // Link Batch to Teacher explicitly in BatchTeacher just in case
  await BatchTeacher.findOneAndUpdate(
    { batch: batch._id, teacher: teacher._id },
    { status: "active", role: "primary" },
    { upsert: true }
  );

  // Get Parent Account
  let parentUser: any = await User.findOne({ email: "parent@truelern.com" }).lean();
  let parent: any = await Parent.findOne({ user: parentUser?._id });
  if (!parent) {
    console.log("ERROR: test parent@truelern.com not found!");
    process.exit(1);
  }

  // Create Student
  let student: any = await Student.findOne({ studentId: "UAT-STU-001" });
  if (!student) {
    console.log("Creating UAT Student");
    student = await Student.create({
      studentId: "UAT-STU-001",
      firstName: "Bobby",
      lastName: "Tables",
      email: "bobby@student.truelern.com",
      parent: parent._id,
      status: "active",
      timezone: "UTC",
    });
  } else {
    // ensure parent link
    student.parent = parent._id;
    await student.save();
  }

  // Add child to parent
  if (!parent.children.includes(student._id)) {
    parent.children.push(student._id);
    await parent.save();
  }

  // Create Enrollment
  let enrollment: any = await Enrollment.findOne({ student: student._id, batch: batch._id });
  if (!enrollment) {
    console.log("Creating UAT Enrollment");
    enrollment = await Enrollment.create({
      student: student._id,
      course: course._id,
      cohort: cohort._id,
      batch: batch._id,
      status: "confirmed",
      enrollmentDate: new Date(),
    });
  } else {
    enrollment.status = "confirmed";
    await enrollment.save();
  }

  console.log("\n=== UAT DATA SUCCESSFULLY SEEDED ===");
  console.log(`Student: Bobby Tables (UAT-STU-001)`);
  console.log(`Parent: ${parent.email}`);
  console.log(`Teacher: ${teacher.email || teacherUser.email}`);
  console.log(`Course: ${course.name}`);
  console.log(`Batch: ${batch.batchName} (${batch.batchCode})`);
  console.log("\nThe UAT matrix can now be executed across these entities.");
  process.exit(0);
}

seedUAT().catch(console.error);
