
/**
 * @swagger
 * /api/assignments:
 *   post:
 *     summary: Auto-generated summary for POST /api/assignments
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
 * /api/assignments:
 *   get:
 *     summary: Auto-generated summary for GET /api/assignments
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
import { withRoles } from "../../../middleware/auth.middleware";
import { assignmentRepository } from "../../../repositories/assignment.repository";
import { ResponseHelper } from "../../../helpers/response";
import { apiHandler } from "../../../utils/api-handler";
import { PaginationSchema } from "../../../dtos/pagination.dto";
import { connectDB } from "../../../config/db";
import { AssignmentService } from "../../../services/assignment/assignment.service";
import { AcademicResolver } from "../../../services/academic/academic.service";
import { Batch } from "../../../models/batch.model";
import { BatchTeacher } from "../../../models/batch-teacher.model";
import { Teacher } from "../../../models/teacher.model";
import { ApiError } from "../../../utils/api-error";
import { ERROR_CODES } from "../../../constants/error-codes";

// GET Paginated Assignments
export const GET = withRoles(
  ["Admin", "Super Admin", "Academic Manager", "Teacher", "Student"],
  apiHandler(async (req: NextRequest) => {
    await connectDB();

    const url = new URL(req.url);
    const paginationInput = PaginationSchema.parse({
      page: url.searchParams.get("page"),
      limit: url.searchParams.get("limit"),
      search: url.searchParams.get("search") || undefined,
      sort: url.searchParams.get("sort") || undefined,
      order: url.searchParams.get("order") || undefined,
    });

    const status = url.searchParams.get("status");
    const teacher = url.searchParams.get("teacher");
    const batch = url.searchParams.get("batch");
    const course = url.searchParams.get("course");
    const type = url.searchParams.get("type");

    if (status) paginationInput.filters.status = status;
    if (teacher) paginationInput.filters.teacher = teacher;
    if (batch) paginationInput.filters.batch = batch;
    if (course) paginationInput.filters.course = course;
    if (type) paginationInput.filters.type = type;

    const searchableFields = ["assignmentCode", "title", "type", "description"];
    const result = await assignmentRepository.paginate(paginationInput, searchableFields, {
      populate: ["course", "batch", "teacher"],
    });

    const resolvedData = result.data.map((a: any) => AcademicResolver.resolveAssignment(a));

    return NextResponse.json(
      ResponseHelper.success("Assignments fetched successfully", resolvedData, result.meta),
      { status: 200 }
    );
  })
);

// POST Create Assignment Draft
export const POST = withRoles(
  ["Admin", "Super Admin", "Academic Manager", "Teacher"],
  apiHandler(async (req: NextRequest, userContext: any) => {
    await connectDB();
    const body = await req.json();

    const { title, description, batchId, totalMarks, passingMarks, dueDate, type, visibility, attachments } = body;

    if (!title || !batchId) {
      throw new ApiError(400, "Title and batchId are required", ERROR_CODES.VALIDATION_ERROR);
    }

    const batch = await Batch.findById(batchId);
    if (!batch) {
      throw new ApiError(404, "Batch not found", ERROR_CODES.NOT_FOUND);
    }

    let assignmentTeacherId = body.teacherId;

    if (userContext.role === "Teacher") {
      const teacher = await Teacher.findOne({ user: userContext.userId }).lean() as any;
      if (!teacher) {
        throw new ApiError(404, "Teacher profile not found", ERROR_CODES.NOT_FOUND);
      }
      const isAuthorized = await BatchTeacher.exists({ batch: batchId, teacher: teacher._id });
      const isDirectlyAssigned = batch.primaryTeacher?.toString() === teacher._id.toString() ||
                                 batch.assistantTeacher?.toString() === teacher._id.toString() ||
                                 batch.mentor?.toString() === teacher._id.toString();

      if (!isAuthorized && !isDirectlyAssigned) {
        throw new ApiError(403, "You are not authorized to create assignments for this batch.", ERROR_CODES.FORBIDDEN);
      }
      assignmentTeacherId = teacher._id;
    } else if (!assignmentTeacherId) {
      // If Admin creates it, they might pass teacherId or fallback to the batch's primary teacher
      assignmentTeacherId = batch.primaryTeacher;
      if (!assignmentTeacherId) {
        throw new ApiError(400, "Teacher must be assigned to the batch or explicitly provided.", ERROR_CODES.VALIDATION_ERROR);
      }
    }

    const count = await assignmentRepository.findMany({}).then((res) => res.length);
    const assignmentCode = `ASM-${String(count + 1).padStart(4, "0")}`;

    const assignment = await AssignmentService.createAssignment(
      {
        assignmentCode,
        title,
        description: description || "No description provided",
        course: batch.course,
        cohort: batch.cohort,
        batch: batch._id,
        teacher: assignmentTeacherId,
        type: type || "homework",
        totalMarks: totalMarks || 100,
        passingMarks: passingMarks || 40,
        difficultyLevel: "medium",
        releaseDate: new Date(),
        dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 7 * 24 * 3600000),
        lateSubmissionAllowed: true,
        maxAttempts: 1,
        visibility: visibility || "public",
        status: "published", // Creating as published per teacher UI flow requirements
      },
      userContext.userId
    );

    // Handle attachments if provided
    if (attachments && Array.isArray(attachments) && attachments.length > 0) {
      const { AssignmentAttachment } = require("../../../models/assignment-attachment.model");
      const attachmentDocs = attachments.map((att: any) => ({
        assignment: assignment._id,
        fileName: att.fileName,
        fileUrl: att.fileUrl,
        fileType: att.fileType,
        fileSize: att.fileSize,
      }));
      await AssignmentAttachment.insertMany(attachmentDocs);
    }

    return NextResponse.json(
      ResponseHelper.success("Assignment created successfully", assignment),
      { status: 201 }
    );
  })
);
