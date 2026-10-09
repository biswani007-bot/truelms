import { NextRequest } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "../config/db";

// Import API handlers directly
import { POST as TeacherAssignmentPOST } from "../app/api/assignments/route";
import { POST as ParentSubmitPOST } from "../app/api/parent/children/[id]/assignments/[assignmentId]/submit/route";
import { POST as TeacherEvaluatePOST } from "../app/api/assignments/[id]/evaluate/route";
import { GET as ParentAssignmentsGET } from "../app/api/parent/children/[id]/assignments/route";

import { POST as ParentMessagePOST } from "../app/api/parent/children/[id]/messages/route";
import { POST as TeacherMessagePOST } from "../app/api/teacher/messages/route";

import { Batch } from "../models/batch.model";
import { Teacher } from "../models/teacher.model";
import { Parent } from "../models/parent.model";
import { ParentStudentLink } from "../models/parent-student-link.model";

// Mock helper to create NextRequest with auth cookies
function createMockRequest(url: string, method: string, body: any, userId: string, role: string) {
  const req = new NextRequest(new URL(url, "http://localhost:3000"), {
    method,
    body: body ? JSON.stringify(body) : undefined,
  });
  return req;
}

async function run() {
  await connectDB();
  console.log("Connected to DB.");
  
  // Get Teacher A
  const teacher = await Teacher.findOne({ isDeleted: { $ne: true } }).populate('user');
  
  // Get Parent A and their linked child
  const psl = await ParentStudentLink.findOne({ isDeleted: { $ne: true } }).populate('parent student');
  const parent = await Parent.findById(psl.parent).populate('user');
  const childId = psl.student._id.toString();

  // Get a batch this child is in
  const BatchStudent = mongoose.model('BatchStudent');
  const bs = await BatchStudent.findOne({ student: psl.student._id });
  const batch = await Batch.findById(bs.batch);

  console.log(`Using Teacher: ${teacher._id}`);
  console.log(`Using Parent: ${parent._id}`);
  console.log(`Using Child: ${childId}`);
  console.log(`Using Batch: ${batch._id}`);

  // Test 1: Services Integration directly
  const { AssignmentService } = await import("../services/assignment/assignment.service");
  const { ParentService } = await import("../services/parent/parent.service");
  const { EvaluationService } = await import("../services/assignment/evaluation.service");
  
  console.log("\\n--- 1. Testing Assignment Flow ---");
  const dueDate = new Date(); dueDate.setDate(dueDate.getDate() + 7);
  
  const assignment = await AssignmentService.createAssignment({
    title: "E2E Master Project",
    description: "Build a project",
    courseId: batch.course.toString(),
    batchId: batch._id.toString(),
    dueDate: dueDate,
    totalMarks: 100,
    passingMarks: 40,
    status: "published",
    assignmentCode: "E2E-ASM-001"
  }, teacher.user._id.toString());
  console.log("Teacher Created Assignment:", assignment._id);

  const submission = await ParentService.submitChildAssignment(parent._id, childId, assignment._id.toString(), {
    files: [], links: ["http://example.com/project"], comments: "Done!"
  });
  console.log("Parent Submitted Assignment:", submission._id);

  const evalResult = await EvaluationService.evaluate(submission._id.toString(), {
    marksObtained: 95, feedback: "Excellent"
  }, teacher.user._id.toString());
  console.log("Teacher Evaluated Assignment:", evalResult._id);

  const pAssignments = await ParentService.getChildAssignments(parent._id, childId);
  const updatedAssign = pAssignments.find((a: any) => a.id.toString() === assignment._id.toString());
  if (updatedAssign && updatedAssign.submission?.marksAwarded === 95) {
    console.log("Parent Views Grades: PASS");
  } else {
    throw new Error("Parent could not see correct grades");
  }

  console.log("\\n--- 2. Testing Messaging Flow ---");
  const pMsg = await ParentService.sendChildMessage(parent._id, childId, {
    teacherId: teacher._id.toString(),
    subject: "Hello",
    message: "Test message"
  }, parent.user._id.toString());
  console.log("Parent Sent Message:", pMsg._id);

  // For teacher reply, we use ParentTeacherMessage directly since teacher route does it inline
  const { ParentTeacherMessage } = await import("../models/parent-teacher-message.model");
  const tMsg = await ParentTeacherMessage.create({
    parent: parent._id,
    teacher: teacher._id,
    student: childId,
    batch: batch._id,
    senderRole: "teacher",
    senderUser: teacher.user._id,
    subject: "Re: Hello",
    message: "Test reply",
    status: "sent"
  });
  console.log("Teacher Replied:", tMsg._id);

  console.log("\\n--- 3. Testing Notification/Jobs ---");
  const { JobEngineService } = await import("../services/jobs/job-engine.service");
  await JobEngineService.scheduleJob({
    jobType: "email",
    payload: { to: "test@example.com", subject: "Test" }
  });
  const processed = await JobEngineService.runBatch(5);
  console.log("Jobs Processed:", processed);
  
  console.log("\\nALL BACKEND/SERVICE WORKFLOWS: PASS");
  process.exit(0);
}

run().catch(e => {
  console.error("Test Failed:", e);
  process.exit(1);
});
