import mongoose from "mongoose";
import { connectDB } from "../config/db";
import { Student } from "../models/student.model";
import { Parent } from "../models/parent.model";
import { Enrollment } from "../models/enrollment.model";
import { Batch } from "../models/batch.model";
import { Course } from "../models/course.model";
import { BatchTeacher } from "../models/batch-teacher.model";
import { Teacher } from "../models/teacher.model";

async function findPerfectStudent() {
  await connectDB();
  console.log("Database connected.");

  const enrollments = await Enrollment.find({ status: "active" }).lean();
  let found = false;

  for (const enr of enrollments) {
    const student: any = await Student.findById(enr.student).lean();
    if (!student) continue;
    if (!student.parent) continue;

    const parent: any = await Parent.findById(student.parent).lean();
    if (!parent) continue;

    const batch: any = await Batch.findById(enr.batch).lean();
    if (!batch) continue;
    
    if (!batch.primaryTeacher) continue;
    const teacher: any = await Teacher.findById(batch.primaryTeacher).lean();
    if (!teacher) continue;

    console.log(`\n=== CANDIDATE FOUND ===`);
    console.log(`Student: ${student.firstName} ${student.lastName} (${student.email})`);
    console.log(`Parent: ${parent.firstName} ${parent.lastName} (${parent.email})`);
    console.log(`Teacher: ${teacher.firstName} ${teacher.lastName} (${teacher.email})`);
    const course: any = await Course.findById(batch.course).lean();
    console.log(`Course: ${course ? course.courseName || course.name : "MISSING"}`);
    console.log(`Batch: ${batch.batchName}`);
    process.exit(0);
  }

  if (!found) {
    console.log("\nNo perfect student found with full active linkages across all roles.");
  }
  process.exit(0);
}

findPerfectStudent().catch(console.error);
