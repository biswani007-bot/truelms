import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedParent } from "@/lib/auth/parent-auth";
import { ParentService } from "@/services/parent/parent.service";
import { ApiResponse } from "@/utils/api-response";
import { apiHandler } from "@/utils/api-handler";
import mongoose from "mongoose";
import { AssignmentSubmission } from "@/models/assignment-submission.model";

export const PUT = apiHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string, assignmentId: string }> }) => {
  const { id, assignmentId } = await params;
  const { parent } = await getAuthenticatedParent(req);
  
  const payload = await req.json();
  
  const { student } = await ParentService.authorizeChildAccess(parent._id, id);
  const studentObjId = student._id;
  
  const assignmentObjId = new mongoose.Types.ObjectId(assignmentId);
  
  // Try to find an existing draft
  let submission = await AssignmentSubmission.findOne({
    student: studentObjId,
    assignment: assignmentObjId,
    status: "draft",
    isDeleted: { $ne: true }
  });
  
  if (!submission) {
    // Create new draft
    const count = await AssignmentSubmission.countDocuments();
    const submissionNumber = `SUB-${String(count + 1).padStart(5, "0")}`;
    
    submission = await AssignmentSubmission.create({
      assignment: assignmentObjId,
      student: studentObjId,
      submissionNumber,
      submittedAt: new Date(),
      attemptNumber: 1, // drafts don't consume attempt logic yet
      files: payload.files || [],
      links: payload.links || [],
      comments: payload.comments,
      lateSubmission: false,
      status: "draft"
    });
  } else {
    // Update existing draft
    submission.files = payload.files || submission.files;
    submission.links = payload.links || submission.links;
    submission.comments = payload.comments ?? submission.comments;
    submission.submittedAt = new Date();
    await submission.save();
  }
  
  return NextResponse.json(ApiResponse.success("Draft saved successfully", submission));
});
