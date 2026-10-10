
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
import mongoose from "mongoose";
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
  apiHandler(async (req: NextRequest, userContext: any) => {
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
    if (course) paginationInput.filters.course = course;
    if (type) paginationInput.filters.type = type;

    let customFilter: Record<string, any> | undefined = undefined;

    if (userContext?.role === "Teacher") {
      const teacherContext = await AssignmentService.getTeacherContext(userContext.userId);
      if (!teacherContext || !teacherContext.teacherDoc) {
        return NextResponse.json(
          ResponseHelper.success("Assignments fetched successfully", [], { total: 0, page: 1, limit: paginationInput.limit }),
          { status: 200 }
        );
      }

      if (batch) {
        if (!teacherContext.teacherBatchIdStrings.includes(batch)) {
          return NextResponse.json(
            ResponseHelper.success("Assignments fetched successfully", [], { total: 0, page: 1, limit: paginationInput.limit }),
            { status: 200 }
          );
        }
        paginationInput.filters.batch = batch;
      } else {
        customFilter = {
          $or: [
            { teacher: teacherContext.teacherDoc._id },
            { createdBy: new mongoose.Types.ObjectId(userContext.userId) },
            { batch: { $in: teacherContext.teacherBatchIds } },
          ],
        };
      }
    } else {
      if (teacher) paginationInput.filters.teacher = teacher;
      if (batch) paginationInput.filters.batch = batch;
    }

    const searchableFields = ["assignmentCode", "title", "type", "description"];
    const result = await assignmentRepository.paginate(paginationInput, searchableFields, {
      populate: ["course", "batch", "teacher"],
      customFilter,
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

    const trimmedTitle = (title || "").trim();
    if (!trimmedTitle) {
      throw new ApiError(400, "Assignment title is required", ERROR_CODES.VALIDATION_ERROR);
    }

    const resolvedBatchId = batchId || body.batch;
    if (!resolvedBatchId) {
      throw new ApiError(400, "Target batch is required", ERROR_CODES.VALIDATION_ERROR);
    }

    if (!mongoose.Types.ObjectId.isValid(resolvedBatchId)) {
      throw new ApiError(400, "Invalid Batch ID format", ERROR_CODES.VALIDATION_ERROR);
    }

    const batch = await Batch.findById(resolvedBatchId);
    if (!batch) {
      throw new ApiError(404, "Batch not found", ERROR_CODES.NOT_FOUND);
    }

    const resolvedCourse = batch.course || body.courseId || body.course;
    if (!resolvedCourse) {
      throw new ApiError(400, "Batch must have an associated course", ERROR_CODES.VALIDATION_ERROR);
    }

    let resolvedCohort = batch.cohort || body.cohortId || body.cohort;
    if (!resolvedCohort) {
      const { Cohort } = require("../../../models/cohort.model");
      const foundCohort = await Cohort.findOne({ course: resolvedCourse });
      resolvedCohort = foundCohort ? foundCohort._id : batch._id;
    }

    let assignmentTeacherId = body.teacherId;

    if (userContext.role === "Teacher") {
      const teacher = await Teacher.findOne({ user: userContext.userId }).lean() as any;
      if (!teacher) {
        throw new ApiError(404, "Teacher profile not found", ERROR_CODES.NOT_FOUND);
      }
      const isAuthorized = await BatchTeacher.exists({ batch: batch._id, teacher: teacher._id });
      const isDirectlyAssigned = batch.primaryTeacher?.toString() === teacher._id.toString() ||
                                 batch.assistantTeacher?.toString() === teacher._id.toString() ||
                                 batch.mentor?.toString() === teacher._id.toString();

      if (!isAuthorized && !isDirectlyAssigned) {
        throw new ApiError(403, "You are not authorized to create assignments for this batch.", ERROR_CODES.FORBIDDEN);
      }
      assignmentTeacherId = teacher._id;
    } else if (!assignmentTeacherId) {
      assignmentTeacherId = batch.primaryTeacher;
      if (!assignmentTeacherId) {
        throw new ApiError(400, "Teacher must be assigned to the batch or explicitly provided.", ERROR_CODES.VALIDATION_ERROR);
      }
    }

    // Generate guaranteed unique assignmentCode by scanning the raw collection (including soft-deleted)
    const { Assignment } = require("../../../models/assignment.model");
    const existingAssignments = await Assignment.collection
      .find({}, { projection: { assignmentCode: 1 } })
      .toArray();

    let maxNum = 0;
    for (const doc of existingAssignments) {
      if (typeof doc.assignmentCode === "string") {
        const match = doc.assignmentCode.match(/^ASM-(\d+)$/i);
        if (match) {
          const num = parseInt(match[1], 10);
          if (!isNaN(num) && num > maxNum) {
            maxNum = num;
          }
        }
      }
    }

    let nextNum = Math.max(maxNum + 1, existingAssignments.length + 1);
    let assignmentCode = `ASM-${String(nextNum).padStart(4, "0")}`;

    // Extra safety guarantee against any existing record
    while (await Assignment.collection.findOne({ assignmentCode })) {
      nextNum++;
      assignmentCode = `ASM-${String(nextNum).padStart(4, "0")}`;
    }

    const numTotalMarks = Number(totalMarks);
    const parsedTotalMarks = !isNaN(numTotalMarks) && numTotalMarks > 0 ? numTotalMarks : 100;
    const numPassingMarks = Number(passingMarks);
    const parsedPassingMarks = !isNaN(numPassingMarks) && numPassingMarks > 0 ? numPassingMarks : 40;

    let parsedDueDate: Date;
    if (dueDate) {
      parsedDueDate = new Date(dueDate);
      if (isNaN(parsedDueDate.getTime())) {
        parsedDueDate = new Date(Date.now() + 7 * 24 * 3600000);
      }
    } else {
      parsedDueDate = new Date(Date.now() + 7 * 24 * 3600000);
    }

    const sanitizedDescription = (description && description.trim().length > 0) ? description : "No description provided";

    const assignment = await AssignmentService.createAssignment(
      {
        assignmentCode,
        title: trimmedTitle,
        description: sanitizedDescription,
        course: resolvedCourse,
        cohort: resolvedCohort,
        batch: batch._id,
        teacher: assignmentTeacherId,
        type: type || "homework",
        totalMarks: parsedTotalMarks,
        passingMarks: parsedPassingMarks,
        difficultyLevel: "medium",
        releaseDate: new Date(),
        dueDate: parsedDueDate,
        lateSubmissionAllowed: true,
        maxAttempts: 1,
        visibility: visibility || "public",
        status: "published", // Creating as published per teacher UI flow requirements
      },
      userContext.userId
    );

    // Handle attachments if provided
    let savedAttachments: any[] = [];
    if (attachments && Array.isArray(attachments) && attachments.length > 0) {
      const { AssignmentAttachment } = require("../../../models/assignment-attachment.model");
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
            assignment: assignment._id,
            fileName,
            fileUrl,
            fileType,
            fileSize,
          };
        });

      if (attachmentDocs.length > 0) {
        savedAttachments = await AssignmentAttachment.insertMany(attachmentDocs);
      }
    }

    const responseData = assignment.toObject ? assignment.toObject() : { ...assignment };
    responseData.attachments = savedAttachments;

    return NextResponse.json(
      ResponseHelper.success("Assignment created successfully", responseData),
      { status: 201 }
    );
  })
);
