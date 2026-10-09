/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose from "mongoose";
import { assignmentRepository } from "../../repositories/assignment.repository";
import { studentRepository } from "../../repositories/student.repository";
import { TimelineService } from "./timeline.service";
import { AssignmentSubmission } from "../../models/assignment-submission.model";

export class SubmissionService {
  static async submit(
    studentId: string,
    assignmentId: string,
    files: string[],
    links: string[],
    comments?: string
  ) {
    const assignment = await assignmentRepository.findById(assignmentId);
    if (!assignment) throw new Error("Assignment not found");

    if (assignment.status !== "published") {
      throw new Error("Assignment is not open for submissions");
    }

    // Resolve real Student ID if user ID was passed
    let resolvedStudentId = studentId;
    const studentDoc = await studentRepository.findOne({ user: studentId });
    if (studentDoc) {
      resolvedStudentId = studentDoc._id.toString();
    } else {
      const studentById = await studentRepository.findById(studentId);
      if (studentById) {
        resolvedStudentId = studentById._id.toString();
      }
    }

    const studentObjId = new (mongoose.Types.ObjectId as any)(resolvedStudentId);
    const assignmentObjId = new (mongoose.Types.ObjectId as any)(assignmentId);

    // Check attempts
    const attempts = await AssignmentSubmission.find({
      student: studentObjId,
      assignment: assignmentObjId,
      isDeleted: { $ne: true },
    });
    if (attempts.length >= assignment.maxAttempts) {
      throw new Error("Maximum submission attempts reached");
    }

    const count = await AssignmentSubmission.countDocuments();
    const submissionNumber = `SUB-${String(count + 1).padStart(5, "0")}`;

    const lateSubmission = new Date() > new Date(assignment.dueDate);
    if (lateSubmission && !assignment.lateSubmissionAllowed) {
      throw new Error("Late submissions are not allowed for this assignment");
    }

    const sub = await AssignmentSubmission.create({
      assignment: assignmentObjId,
      student: studentObjId,
      submissionNumber,
      submittedAt: new Date(),
      attemptNumber: attempts.length + 1,
      files,
      links,
      comments,
      lateSubmission,
      status: lateSubmission ? "late" : "submitted",
    });

    await TimelineService.logEvent(
      assignmentId,
      attempts.length > 0 ? "resubmitted" : "submitted",
      `Student submission #${attempts.length + 1} received`,
      resolvedStudentId
    );

    return sub;
  }
}

