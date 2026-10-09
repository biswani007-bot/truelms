import mongoose from "mongoose";
import { connectDB } from "../config/db";
import { Student } from "../models/student.model";
import { Parent } from "../models/parent.model";
import { Enrollment } from "../models/enrollment.model";
import { Batch } from "../models/batch.model";
import { Course } from "../models/course.model";
import { BatchTeacher } from "../models/batch-teacher.model";
import { Teacher } from "../models/teacher.model";

async function diagnose() {
  await connectDB();

  const students: any = await Student.find({}).lean();
  for (const s of students) {
    if (s.parent) {
      const p: any = await Parent.findById(s.parent).lean();
      if (p) {
        const enr: any = await Enrollment.findOne({ student: s._id }).lean();
        if (enr) {
           console.log(`\n=== POTENTIAL STUDENT: ${s.firstName} ${s.lastName} ===`);
           console.log(`Student ID: ${s.studentId}, Status: ${s.status}`);
           console.log(`Parent: ${p.email}`);
           
           const course: any = await Course.findById(enr.course).lean();
           console.log(`Course: ${course ? course.name : "MISSING"}`);
           
           const batch: any = await Batch.findById(enr.batch).lean();
           console.log(`Batch: ${batch ? batch.batchName : "MISSING"}`);
           
           if (batch) {
             const t: any = await Teacher.findById(batch.primaryTeacher).lean();
             console.log(`Primary Teacher: ${t ? t.email : "MISSING"}`);
           }
        }
      }
    }
  }
  process.exit(0);
}

diagnose().catch(console.error);
