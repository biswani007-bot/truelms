// @ts-nocheck
import React from "react";
import Link from "next/link";
import mongoose from "mongoose";
import { connectDB } from "../../../../config/db";
import { getAuthenticatedTeacher } from "../../../../lib/auth/teacher-session";
import { Notification } from "../../../../models/notification.model";
import { ParentTeacherMessage } from "../../../../models/parent-teacher-message.model";
import { TeacherMessageThread } from "../../../../components/teacher/teacher-message-thread";
import { Bell, MessageSquare, Plus, Clock, CheckCircle2 } from "lucide-react";

import { batchRepository } from "../../../../repositories/batch.repository";
import { BatchTeacher } from "../../../../models/batch-teacher.model";
import { batchStudentRepository } from "../../../../repositories/batch-student.repository";
import { ParentStudentLink } from "../../../../models/parent-student-link.model";
import { Parent } from "../../../../models/parent.model";

export const revalidate = 0;

export const metadata = {
  title: "Faculty Conversation | TrueLern Teacher",
  description: "Academic communication and parent inquiries.",
};

export default async function TeacherCommunicationPage() {
  await connectDB();
  const teacher = await getAuthenticatedTeacher();

  if (!teacher) {
    return (
      <div className="text-center py-16">
        <h1 className="text-xl font-bold text-slate-900">Please Sign In</h1>
        <p className="text-sm text-slate-500 mt-1">Sign in to view faculty communications.</p>
      </div>
    );
  }



  // Parent messages query for this teacher
  const teacherObjectId = new mongoose.Types.ObjectId(teacher._id);
  const rawParentMessages = await ParentTeacherMessage.find({
    teacher: teacherObjectId,
    isDeleted: { $ne: true },
  })
    .populate("student", "firstName lastName studentCode")
    .populate("parent", "firstName lastName phone email")
    .populate("batch", "batchName batchCode")
    .sort({ createdAt: 1 })
    .lean();

  const parentMessages = JSON.parse(JSON.stringify(rawParentMessages));

  // Fetch batches and students for initiating new conversations
  const [directBatches, assignedBatchTeachers] = await Promise.all([
    batchRepository.findMany({ $or: [{ primaryTeacher: teacher._id }, { assistantTeacher: teacher._id }, { mentor: teacher._id }] }),
    BatchTeacher.find({ teacher: teacher._id, status: "active" }).lean(),
  ]);

  const batchIds = [...directBatches.map((b) => b._id), ...assignedBatchTeachers.map((bt) => bt.batch)];
  const activeBatches = await batchRepository.findMany({ _id: { $in: batchIds } });
  
  const batchStudents = batchIds.length > 0 
    ? await batchStudentRepository.findMany({ batch: { $in: batchIds }, status: "active" }, { populate: ["student", "batch"] }) 
    : [];

  const studentLinks = await ParentStudentLink.find({ student: { $in: batchStudents.map(bs => (bs.student as any)?._id).filter(Boolean) } })
    .populate({ path: "parent", model: Parent })
    .lean();

  const rosterData = batchStudents.map(bs => {
    const link = studentLinks.find(l => l.student.toString() === (bs.student as any)?._id.toString());
    return {
      student: bs.student,
      batch: bs.batch,
      parent: link?.parent
    };
  });
  
  const rosters = JSON.parse(JSON.stringify(rosterData));

  return (
    <div className="flex flex-col gap-8 md:gap-10 w-full max-w-[1500px] mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200/80 p-6 rounded-3xl shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Conversation
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            Direct inquiries and messages from parents.
          </p>
        </div>
      </div>

      <TeacherMessageThread
        initialMessages={parentMessages}
        teacherId={teacher._id.toString()}
        rosters={rosters}
      />
    </div>
  );
}
