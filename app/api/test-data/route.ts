import { NextResponse } from 'next/server';
import { connectDB } from '@/config/db';
import { Parent } from '@/models/parent.model';
import { Student } from '@/models/student.model';
import { ParentStudentLink } from '@/models/parent-student-link.model';
import { BatchStudent } from '@/models/batch-student.model';
import { Batch } from '@/models/batch.model';
import { Teacher } from '@/models/teacher.model';

export async function GET() {
  await connectDB();
  const link = await ParentStudentLink.findOne({ isDeleted: { $ne: true } });
  if (!link) return NextResponse.json({ error: 'No link found' });

  const parent = await Parent.findById(link.parent);
  const student = await Student.findById(link.student);
  const enrollment = await BatchStudent.findOne({ student: student._id, status: 'active', isDeleted: { $ne: true } });
  
  let batch = null;
  if (enrollment) {
    batch = await Batch.findById(enrollment.batch);
  }
  const teacher = await Teacher.findOne({ isDeleted: { $ne: true } });
  
  return NextResponse.json({
    parentId: parent?._id,
    studentId: student?._id,
    batchId: batch?._id,
    courseId: batch?.course,
    teacherId: teacher?._id,
  });
}
