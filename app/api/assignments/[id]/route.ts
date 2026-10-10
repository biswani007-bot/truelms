
/**
 * @swagger
 * /api/assignments/{id}:
 *   delete:
 *     summary: Auto-generated summary for DELETE /api/assignments/{id}
 *     tags: [assignments]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 */

/**
 * @swagger
 * /api/assignments/{id}:
 *   put:
 *     summary: Auto-generated summary for PUT /api/assignments/{id}
 *     tags: [assignments]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 */

/**
 * @swagger
 * /api/assignments/{id}:
 *   get:
 *     summary: Auto-generated summary for GET /api/assignments/{id}
 *     tags: [assignments]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { withRoles } from "../../../../middleware/auth.middleware";
import { assignmentRepository } from "../../../../repositories/assignment.repository";
import { ResponseHelper } from "../../../../helpers/response";
import { apiHandler } from "../../../../utils/api-handler";
import { connectDB } from "../../../../config/db";
import { Assignment } from "../../../../models/assignment.model";
import { AssignmentSubmission } from "../../../../models/assignment-submission.model";
import { AssignmentService } from "../../../../services/assignment/assignment.service";
import { TimelineService } from "../../../../services/assignment/timeline.service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET Assignment Detail
export const GET = withRoles(
  ["Admin", "Super Admin", "Academic Manager", "Teacher", "Student"],
  apiHandler(async (_req: NextRequest, userContext: any, routeCtx: RouteParams) => {
    await connectDB();
    const { id } = await routeCtx.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(ResponseHelper.error("Assignment profile not found", "NOT_FOUND"), { status: 404 });
    }

    const assignment = await assignmentRepository.findById(id, {
      populate: ["course", "batch", "teacher", "liveClass"],
    });

    if (!assignment) {
      return NextResponse.json(ResponseHelper.error("Assignment profile not found", "NOT_FOUND"), { status: 404 });
    }

    // Teacher authorization check
    if (userContext?.role === "Teacher") {
      const teacherContext = await AssignmentService.getTeacherContext(userContext.userId);
      const isAuthorized = AssignmentService.isTeacherAuthorized(
        assignment,
        teacherContext?.teacherDoc?._id,
        userContext.userId,
        teacherContext?.teacherBatchIdStrings || []
      );
      if (!isAuthorized) {
        return NextResponse.json(ResponseHelper.error("Not authorized to access this assignment", "FORBIDDEN"), { status: 403 });
      }
    }

    const { AssignmentAttachment } = require("../../../../models/assignment-attachment.model");
    const attachments = await AssignmentAttachment.find({ assignment: id }).lean();
    
    const assignmentData = assignment.toObject ? assignment.toObject() : assignment;
    assignmentData.attachments = attachments;

    return NextResponse.json(ResponseHelper.success("Assignment profile fetched", assignmentData), { status: 200 });
  })
);

// PUT Update Assignment Details
export const PUT = withRoles(
  ["Admin", "Super Admin", "Academic Manager", "Teacher"],
  apiHandler(async (req: NextRequest, userContext: any, routeCtx: RouteParams) => {
    await connectDB();
    const { id } = await routeCtx.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(ResponseHelper.error("Assignment not found", "NOT_FOUND"), { status: 404 });
    }

    const body = await req.json();

    const assignment: any = await Assignment.findById(id);
    if (!assignment) {
      return NextResponse.json(ResponseHelper.error("Assignment not found", "NOT_FOUND"), { status: 404 });
    }

    // Teacher authorization check
    if (userContext?.role === "Teacher") {
      const teacherContext = await AssignmentService.getTeacherContext(userContext.userId);
      const isAuthorized = AssignmentService.isTeacherAuthorized(
        assignment,
        teacherContext?.teacherDoc?._id,
        userContext.userId,
        teacherContext?.teacherBatchIdStrings || []
      );
      if (!isAuthorized) {
        return NextResponse.json(ResponseHelper.error("Not authorized to modify this assignment", "FORBIDDEN"), { status: 403 });
      }

      const newBatch = body.batch || body.batchId;
      if (newBatch && newBatch.toString() !== assignment.batch.toString()) {
        if (!teacherContext?.teacherBatchIdStrings.includes(newBatch.toString())) {
          return NextResponse.json(ResponseHelper.error("You are not authorized for the selected batch", "FORBIDDEN"), { status: 403 });
        }
      }

      // Teachers cannot change assignment creator or teacher ownership arbitrarily
      delete body.teacher;
      delete body.teacherId;
      delete body.createdBy;
    }

    // Check submission lifecycle restrictions
    const submissionCount = await AssignmentSubmission.countDocuments({ assignment: id, isDeleted: { $ne: true } });
    if (submissionCount > 0) {
      const newBatch = body.batch || body.batchId;
      if (newBatch && newBatch.toString() !== assignment.batch.toString()) {
        return NextResponse.json(ResponseHelper.error("Cannot modify batch after student submissions exist", "VALIDATION_ERROR"), { status: 400 });
      }
      const newCourse = body.course || body.courseId;
      if (newCourse && newCourse.toString() !== assignment.course.toString()) {
        return NextResponse.json(ResponseHelper.error("Cannot modify course after student submissions exist", "VALIDATION_ERROR"), { status: 400 });
      }
      if (body.totalMarks !== undefined && Number(body.totalMarks) !== assignment.totalMarks) {
        return NextResponse.json(ResponseHelper.error("Cannot modify total marks after student submissions exist", "VALIDATION_ERROR"), { status: 400 });
      }
    }

    const { attachments, ...updateData } = body;
    updateData.updatedBy = userContext.userId;

    const updated = await assignmentRepository.update(id, updateData);
    if (!updated) {
      return NextResponse.json(ResponseHelper.error("Assignment not found", "NOT_FOUND"), { status: 404 });
    }

    if (attachments && Array.isArray(attachments) && attachments.length > 0) {
      const { AssignmentAttachment } = require("../../../../models/assignment-attachment.model");
      const attachmentDocs = attachments
        .filter((att: any) => att && (att.fileName || att.name || att.fileUrl || att.url))
        .map((att: any) => {
          const fileName = att.fileName || att.name || "attachment";
          const fileUrl = att.fileUrl || att.url || "";
          let fileType = att.fileType || att.type;
          if (!fileType || fileType.trim() === "") {
            const ext = fileName.includes(".") ? fileName.split(".").pop() : "";
            fileType = ext ? `application/${ext}` : "application/octet-stream";
          }
          const fileSize = typeof att.fileSize === "number" ? att.fileSize : (typeof att.size === "number" ? att.size : 0);
          return {
            assignment: id,
            fileName,
            fileUrl,
            fileType,
            fileSize,
          };
        });
      if (attachmentDocs.length > 0) {
        await AssignmentAttachment.insertMany(attachmentDocs);
      }
    }

    await TimelineService.logEvent(id, "updated", "Assignment details updated", userContext.userId);

    const { AssignmentAttachment } = require("../../../../models/assignment-attachment.model");
    const allAttachments = await AssignmentAttachment.find({ assignment: id }).lean();
    const updatedData = updated.toObject ? updated.toObject() : updated;
    updatedData.attachments = allAttachments;

    return NextResponse.json(ResponseHelper.success("Assignment updated", updatedData), { status: 200 });
  })
);

// DELETE Soft-delete Assignment
export const DELETE = withRoles(
  ["Admin", "Super Admin", "Teacher"],
  apiHandler(async (_req: NextRequest, userContext: any, routeCtx: RouteParams) => {
    await connectDB();
    const { id } = await routeCtx.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(ResponseHelper.error("Assignment not found", "NOT_FOUND"), { status: 404 });
    }

    const assignment: any = await Assignment.findById(id);
    if (!assignment) {
      return NextResponse.json(ResponseHelper.error("Assignment not found", "NOT_FOUND"), { status: 404 });
    }

    // Teacher authorization check
    if (userContext?.role === "Teacher") {
      const teacherContext = await AssignmentService.getTeacherContext(userContext.userId);
      const isAuthorized = AssignmentService.isTeacherAuthorized(
        assignment,
        teacherContext?.teacherDoc?._id,
        userContext.userId,
        teacherContext?.teacherBatchIdStrings || []
      );
      if (!isAuthorized) {
        return NextResponse.json(ResponseHelper.error("Not authorized to delete this assignment", "FORBIDDEN"), { status: 403 });
      }
    }

    // Check submission lifecycle restrictions: cannot delete if submissions exist
    const submissionCount = await AssignmentSubmission.countDocuments({ assignment: id, isDeleted: { $ne: true } });
    if (submissionCount > 0) {
      return NextResponse.json(
        ResponseHelper.error("Cannot delete assignment with existing student submissions or grades", "VALIDATION_ERROR"),
        { status: 400 }
      );
    }

    const deleted = await assignmentRepository.softDelete(id);
    if (!deleted) {
      return NextResponse.json(ResponseHelper.error("Assignment not found", "NOT_FOUND"), { status: 404 });
    }

    await TimelineService.logEvent(id, "archived", "Assignment soft-deleted", userContext.userId);

    return NextResponse.json(ResponseHelper.success("Assignment deleted", deleted), { status: 200 });
  })
);
