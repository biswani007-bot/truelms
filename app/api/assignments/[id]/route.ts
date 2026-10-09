
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

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET Assignment Detail
export const GET = withRoles(
  ["Admin", "Super Admin", "Academic Manager", "Teacher", "Student"],
  apiHandler(async (_req: NextRequest, _ctx: any, routeCtx: RouteParams) => {
    await connectDB();
    const { id } = await routeCtx.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(ResponseHelper.error("Assignment profile not found", "NOT_FOUND"), { status: 404 });
    }

    const assignment = await assignmentRepository.findById(id, {
      populate: ["course", "batch", "teacher", "liveClass"],
    });

    if (!assignment) {
      return NextResponse.json(ResponseHelper.error("Assignment profile not found"), { status: 404 });
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
  apiHandler(async (req: NextRequest, _userContext: any, routeCtx: RouteParams) => {
    await connectDB();
    const { id } = await routeCtx.params;
    const body = await req.json();

    const { attachments, ...updateData } = body;
    const updated = await assignmentRepository.update(id, updateData);
    if (!updated) {
      return NextResponse.json(ResponseHelper.error("Assignment not found"), { status: 404 });
    }

    if (attachments && Array.isArray(attachments) && attachments.length > 0) {
      const { AssignmentAttachment } = require("../../../../models/assignment-attachment.model");
      const attachmentDocs = attachments.map((att: any) => ({
        assignment: id,
        fileName: att.fileName,
        fileUrl: att.fileUrl,
        fileType: att.fileType,
        fileSize: att.fileSize,
      }));
      await AssignmentAttachment.insertMany(attachmentDocs);
    }

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
  apiHandler(async (_req: NextRequest, _ctx: any, routeCtx: RouteParams) => {
    await connectDB();
    const { id } = await routeCtx.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(ResponseHelper.error("Assignment not found", "NOT_FOUND"), { status: 404 });
    }

    const deleted = await assignmentRepository.softDelete(id);
    if (!deleted) {
      return NextResponse.json(ResponseHelper.error("Assignment not found"), { status: 404 });
    }

    return NextResponse.json(ResponseHelper.success("Assignment deleted", deleted), { status: 200 });
  })
);
