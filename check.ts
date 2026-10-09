import mongoose from 'mongoose';
import { Parent } from './models/parent.model';
import { Student } from './models/student.model';
import { ParentStudentLink } from './models/parent-student-link.model';
import { BatchStudent } from './models/batch-student.model';
import { Batch } from './models/batch.model';
import { Teacher } from './models/teacher.model';

async function checkData() {
  await mongoose.connect('mongodb://localhost:27017/lmsca');
  
  const link = await ParentStudentLink.findOne({ isDeleted: { $ne: true } });
  if (!link) {
    console.log("No valid Parent-Student link found");
    return;
  }
  
  const parent = await Parent.findById(link.parent);
  const student = await Student.findById(link.student);
  
  const enrollment = await BatchStudent.findOne({ student: student._id, status: 'active', isDeleted: { $ne: true } });
  
  console.log("Parent:", parent._id.toString());
  console.log("Student:", student._id.toString());
  console.log("Enrollment:", enrollment ? enrollment.batch.toString() : "No active enrollment");

  if (enrollment) {
    const batch = await Batch.findById(enrollment.batch);
    console.log("Batch:", batch._id.toString());
    console.log("Course:", batch.course.toString());
    const teacher = await Teacher.findOne({ isDeleted: { $ne: true } });
    console.log("Teacher:", teacher ? teacher._id.toString() : "No teacher");
  }

  process.exit(0);
}

checkData().catch(console.error);
