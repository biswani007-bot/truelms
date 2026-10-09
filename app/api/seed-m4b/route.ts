import { NextResponse } from 'next/server';
import { connectDB } from '@/config/db';
import { Assignment } from '@/models/assignment.model';
import { AssignmentSubmission } from '@/models/assignment-submission.model';
import { AssignmentEvaluation } from '@/models/assignment-evaluation.model';
import { AssessmentResult } from '@/models/assessment-result.model';
import { AssessmentAttempt } from '@/models/assessment-attempt.model';
import { Assessment } from '@/models/assessment.model';
import { LiveClass } from '@/models/live-class.model';
import mongoose from 'mongoose';

export async function GET() {
  await connectDB();
  
  const studentId = new mongoose.Types.ObjectId('6a87011efae35df7c876b0ab');
  const batchId = new mongoose.Types.ObjectId('6a890dbac480cc8f5fff12fc');
  const courseId = new mongoose.Types.ObjectId('6a890db0c480cc8f5fff12f7');
  const teacherId = new mongoose.Types.ObjectId('6a87011efae35df7c876b0a1');

  const batch = await mongoose.connection.db?.collection('batches').findOne({ _id: batchId });
  const cohortId = batch ? batch.cohort : new mongoose.Types.ObjectId();

  // Clear existing M4B seeding data
  await Assignment.deleteMany({ assignmentCode: "M4B-PROJ-01" });
  await AssignmentSubmission.deleteMany({ submissionNumber: "SUB-1001" });
  await AssignmentEvaluation.deleteMany({ feedback: "Excellent work on the final project. The methodology was very clear." });
  await AssignmentEvaluation.deleteMany({ feedback: "Excellent work on the final project. The methodology was very clear." });
  await Assessment.deleteMany({ title: "M4B Milestone Assessment" });
  await AssessmentAttempt.deleteMany({ status: "submitted" });
  await AssessmentResult.deleteMany({ feedback: "Great performance overall." });
  await LiveClass.deleteMany({ platformMeetingId: "m4b-revision-session" });

  // 1. Assignment Chain
  const assignment = await Assignment.create({
    batch: batchId,
    course: courseId,
    cohort: cohortId,
    teacher: teacherId,
    assignmentCode: "M4B-PROJ-01",
    type: "project",
    releaseDate: new Date(),
    title: "M4B Sample Assignment: Final Project",
    description: "Submit your final project deliverables here.",
    instructions: "Please attach the required document and ensure it follows the guidelines.",
    totalMarks: 100,
    passingMarks: 60,
    dueDate: new Date(Date.now() + 86400000), // tomorrow
    status: "published",
    createdBy: teacherId,
    maxAttempts: 2
  });

  const submission = await AssignmentSubmission.create({
    assignment: assignment._id,
    student: studentId,
    batch: batchId,
    submissionNumber: "SUB-1001",
    status: "submitted",
    attemptNumber: 1,
    files: ["https://example.com/project.pdf"],
    links: [],
    comments: "Here is my final project.",
    submittedAt: new Date()
  });

  const evaluation = await AssignmentEvaluation.create({
    submission: submission._id,
    assignment: assignment._id,
    student: studentId,
    teacher: teacherId,
    evaluatedBy: teacherId,
    marksObtained: 95,
    percentage: 95,
    grade: "A",
    feedback: "Excellent work on the final project. The methodology was very clear.",
    status: "published"
  });

  // 2. Assessment Chain
  const assessment = await Assessment.create({
    assessmentCode: "M4B-ASSESS-01",
    batch: batchId,
    cohort: cohortId,
    teacher: teacherId,
    title: "M4B Milestone Assessment",
    description: "End of module test.",
    type: "final-exam",
    course: courseId,
    status: "published",
    maximumMarks: 100,
    passingMarks: 50,
    duration: 60,
    assessmentDate: new Date(),
    startTime: new Date(),
    endTime: new Date(Date.now() + 3600000),
    createdBy: teacherId
  });

  const attempt = await AssessmentAttempt.create({
    assessment: assessment._id,
    student: studentId,
    batch: batchId,
    startedAt: new Date(Date.now() - 3600000),
    submittedAt: new Date(),
    status: "submitted",
    timeTaken: 50
  });

  const assessmentResult = await AssessmentResult.create({
    assessment: assessment._id,
    attempt: attempt._id,
    student: studentId,
    score: 88,
    totalMarksObtained: 88,
    percentage: 88,
    isPassed: true,
    feedback: "Great performance overall.",
    createdAt: new Date(),
    updatedAt: new Date()
  });

  // 3. Revision (Live Class with Recording)
  const liveClass = await LiveClass.create({
    classCode: "M4B-LC-01",
    classTitle: "Module 3: Core Concepts Revision",
    classNumber: 1,
    course: courseId,
    cohort: cohortId,
    batch: batchId,
    teacher: teacherId,
    description: "Review of the core concepts taught in module 3.",
    startDate: new Date(Date.now() - 86400000 * 2),
    endDate: new Date(Date.now() - 86400000 * 2 + 3600000),
    status: "completed",
    meetingPlatform: "jitsi",
    platformMeetingId: "m4b-revision-session",
    meetingLink: "https://meet.jit.si/m4b-revision-session",
    recordingUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    streamUrl: "https://www.w3schools.com/html/mov_bbb.mp4"
  });

  return NextResponse.json({ success: true, message: "Seeding complete!" });
}
