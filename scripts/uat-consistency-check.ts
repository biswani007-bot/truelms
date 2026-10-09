import mongoose from "mongoose";
import { connectDB } from "../config/db";
import { Student } from "../models/student.model";
import { Parent } from "../models/parent.model";
import { Enrollment } from "../models/enrollment.model";
import { Batch } from "../models/batch.model";
import { Course } from "../models/course.model";
import { BatchTeacher } from "../models/batch-teacher.model";
import { Teacher } from "../models/teacher.model";

async function verifyConsistency() {
  await connectDB();
  console.log("Database connected.");

  // Check counts
  const sc = await Student.countDocuments();
  const pc = await Parent.countDocuments();
  const ec = await Enrollment.countDocuments();
  const bc = await Batch.countDocuments();
  
  console.log(`\n=== DATABASE COUNTS ===`);
  console.log(`Students: ${sc}`);
  console.log(`Parents: ${pc}`);
  console.log(`Enrollments: ${ec}`);
  console.log(`Batches: ${bc}`);

  const enrollments = await Enrollment.find({}).lean();
  if (enrollments.length === 0) {
    console.log("\nNo enrollments exist at all.");
  }

  for (const enr of enrollments) {
    const student: any = await Student.findById(enr.student).lean();
    if (student) {
      console.log(`\n=== FOUND TRACEABLE ENROLLMENT ===`);
      console.log(`Student: ${student.firstName} ${student.lastName} (${student.studentId}) - Status: ${student.status}`);
      console.log(`Enrollment ID: ${enr._id} - Status: ${enr.status}`);
      
      if (student.parent) {
        const parent: any = await Parent.findById(student.parent).lean();
        console.log(`Parent: ${parent ? parent.firstName + ' ' + parent.lastName : "NOT FOUND"}`);
      } else {
        console.log("Parent: NO REFERENCE IN STUDENT");
      }

      const course: any = await Course.findById(enr.course).lean();
      console.log(`Course: ${course ? course.courseName || course.name : "NOT FOUND"}`);
      const batch: any = await Batch.findById(enr.batch).lean();
      console.log(`Batch: ${batch ? batch.batchName : "NOT FOUND"}`);
      if (batch) {
        if (batch.primaryTeacher) {
          const pt: any = await Teacher.findById(batch.primaryTeacher).lean();
          console.log(`Primary Teacher: ${pt ? pt.firstName + ' ' + pt.lastName : "NOT FOUND"}`);
        } else {
          console.log(`Primary Teacher: NONE`);
        }
      }
      return process.exit(0);
    }
  }

  console.log("\nCould not find any student with an enrollment.");
  process.exit(1);
}

verifyConsistency().catch(console.error);
