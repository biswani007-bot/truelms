import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/config/db";
import { getAuthenticatedTeacher } from "@/lib/auth/teacher-session";
import { ParentTeacherMessage } from "@/models/parent-teacher-message.model";
import { Batch } from "@/models/batch.model";
import { BatchTeacher } from "@/models/batch-teacher.model";
import { Student } from "@/models/student.model";
import { Parent } from "@/models/parent.model";
import { Notification } from "@/models/notification.model";
import { User } from "@/models/user.model";
import { ApiResponse } from "@/utils/api-response";
import { apiHandler } from "@/utils/api-handler";
import { ApiError } from "@/utils/api-error";
import { ERROR_CODES } from "@/constants/error-codes";

/**
 * Helper to get active batch IDs assigned to this teacher
 */
async function getTeacherAssignedBatchIds(teacherId: mongoose.Types.ObjectId) {
  const primaryBatches = await Batch.find({
    $or: [{ primaryTeacher: teacherId }, { assistantTeacher: teacherId }],
    status: { $in: ["planning", "open", "active"] },
    isDeleted: { $ne: true },
  }).select("_id").lean();

  const assignedBatches = await BatchTeacher.find({
    teacher: teacherId,
    status: "active",
    isDeleted: { $ne: true },
  }).select("batch").lean();

  const set = new Set<string>();
  primaryBatches.forEach((b: any) => set.add(b._id.toString()));
  assignedBatches.forEach((b: any) => set.add(b.batch.toString()));

  return Array.from(set).map((id) => new mongoose.Types.ObjectId(id));
}

// GET: Retrieve inquiries and messages received by or relevant to this teacher
export const GET = apiHandler(async (req: NextRequest) => {
  await connectDB();
  const teacher = await getAuthenticatedTeacher();
  if (!teacher) {
    throw new ApiError(401, "Teacher authentication required", ERROR_CODES.AUTH_TOKEN_INVALID);
  }

  const teacherObjectId = new mongoose.Types.ObjectId(teacher._id);
  const { searchParams } = new URL(req.url);
  const studentIdStr = searchParams.get("studentId");
  const parentIdStr = searchParams.get("parentId");

  const query: any = {
    teacher: teacherObjectId,
    isDeleted: { $ne: true },
  };

  if (studentIdStr && mongoose.isValidObjectId(studentIdStr)) {
    query.student = new mongoose.Types.ObjectId(studentIdStr);
  }
  if (parentIdStr && mongoose.isValidObjectId(parentIdStr)) {
    query.parent = new mongoose.Types.ObjectId(parentIdStr);
  }

  const messages = await ParentTeacherMessage.find(query)
    .populate("student", "firstName lastName studentCode avatarUrl")
    .populate("parent", "firstName lastName phone email")
    .populate("batch", "batchName batchCode")
    .sort({ createdAt: 1 })
    .lean();

  return NextResponse.json(ApiResponse.success("Teacher messages retrieved", messages));
});

// POST: Teacher reply to a parent inquiry for a child
export const POST = apiHandler(async (req: NextRequest) => {
  await connectDB();
  const teacher = await getAuthenticatedTeacher();
  if (!teacher) {
    throw new ApiError(401, "Teacher authentication required", ERROR_CODES.AUTH_TOKEN_INVALID);
  }

  const teacherObjectId = new mongoose.Types.ObjectId(teacher._id);
  const teacherUserObjectId = new mongoose.Types.ObjectId(teacher.user);

  const body = await req.json();
  const { studentId, parentId, batchId, message, subject } = body;

  if (!studentId || !parentId || !message?.trim()) {
    throw new ApiError(400, "studentId, parentId, and message are required", ERROR_CODES.VALIDATION_ERROR);
  }

  // Security: Verify teacher is authorized for this student & batch
  const studentObjectId = new mongoose.Types.ObjectId(studentId);
  const parentObjectId = new mongoose.Types.ObjectId(parentId);

  // Check if there is an existing message in this thread or if teacher teaches a batch for this student
  const existingThreadMsg = await ParentTeacherMessage.findOne({
    teacher: teacherObjectId,
    student: studentObjectId,
    parent: parentObjectId,
    isDeleted: { $ne: true },
  });

  const effectiveBatchId = batchId
    ? new mongoose.Types.ObjectId(batchId)
    : existingThreadMsg?.batch;

  if (!effectiveBatchId) {
    throw new ApiError(403, "No active enrolled batch found for this parent-teacher conversation", ERROR_CODES.FORBIDDEN);
  }

  const assignedBatchIds = await getTeacherAssignedBatchIds(teacherObjectId);
  if (!assignedBatchIds.some(id => id.toString() === effectiveBatchId.toString())) {
    throw new ApiError(403, "Teacher is not authorized to communicate for this batch", ERROR_CODES.FORBIDDEN);
  }

  const reply = await ParentTeacherMessage.create({
    parent: parentObjectId,
    teacher: teacherObjectId,
    student: studentObjectId,
    batch: effectiveBatchId,
    senderRole: "teacher",
    senderUser: teacherUserObjectId,
    subject: subject?.trim() || `Re: Update from Instructor`,
    message: message.trim(),
    isRead: false,
    status: "sent",
  });

  // Notify Parent via in-app Notification
  const parentDoc: any = await Parent.findById(parentObjectId).lean();
  if (parentDoc && parentDoc.user) {
    const studentDoc: any = await Student.findById(studentObjectId).lean();
    const studentName = studentDoc ? `${studentDoc.firstName} ${studentDoc.lastName}` : "your child";
    const teacherName = `${teacher.firstName} ${teacher.lastName}`;

    await Notification.create({
      recipient: parentDoc.user,
      sender: teacherUserObjectId,
      title: `Message from Instructor ${teacherName}`,
      content: `Instructor ${teacherName} replied regarding ${studentName}: "${message.trim().substring(0, 100)}"`,
      eventSource: "reports",
      status: "active",
    });
  }

  return NextResponse.json(ApiResponse.success("Reply sent successfully", reply), { status: 201 });
});
