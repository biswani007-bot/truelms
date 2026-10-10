
/**
 * @swagger
 * /api/assessments:
 *   post:
 *     summary: Auto-generated summary for POST /api/assessments
 *     tags: [assessments]
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
 * /api/assessments:
 *   get:
 *     summary: Auto-generated summary for GET /api/assessments
 *     tags: [assessments]
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
import { withRoles } from "../../../middleware/auth.middleware";
import { assessmentRepository } from "../../../repositories/assessment.repository";
import { ResponseHelper } from "../../../helpers/response";
import { apiHandler } from "../../../utils/api-handler";
import { PaginationSchema } from "../../../dtos/pagination.dto";
import { connectDB } from "../../../config/db";
import { AssessmentService } from "../../../services/assessment/assessment.service";
import { AcademicResolver } from "../../../services/academic/academic.service";
import { Batch } from "../../../models/batch.model";
import { Teacher } from "../../../models/teacher.model";
import { AssessmentQuestion } from "../../../models/assessment-question.model";
import { ApiError } from "../../../utils/api-error";
import { ERROR_CODES } from "../../../constants/error-codes";

// GET Paginated Assessments
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
    const type = url.searchParams.get("type");
    const teacher = url.searchParams.get("teacher");
    const course = url.searchParams.get("course");
    const batch = url.searchParams.get("batch");

    if (status) paginationInput.filters.status = status;
    if (type) paginationInput.filters.type = type;
    if (teacher) paginationInput.filters.teacher = teacher;
    if (course) paginationInput.filters.course = course;

    let customFilter: Record<string, any> | undefined = undefined;

    if (userContext?.role === 'Teacher') {
      const teacherContext = await AssessmentService.getTeacherContext(userContext.userId);
      if (!teacherContext || !teacherContext.teacherDoc) {
        return NextResponse.json(
          ResponseHelper.success('Assessments fetched successfully', [], { total: 0, page: 1, limit: paginationInput.limit }),
          { status: 200 }
        );
      }

      if (batch) {
        if (!teacherContext.teacherBatchIdStrings.includes(batch)) {
          return NextResponse.json(
            ResponseHelper.success('Assessments fetched successfully', [], { total: 0, page: 1, limit: paginationInput.limit }),
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
      if (batch) paginationInput.filters.batch = batch;
    }

    const searchableFields = ["assessmentCode", "title", "type", "description"];
    const result = await assessmentRepository.paginate(paginationInput, searchableFields, {
      populate: ["course", "batch", "teacher"],
      customFilter,
    });

    const assessmentIds = result.data.map((a: any) => a._id);
    let countMap = new Map<string, number>();
    if (assessmentIds.length > 0) {
      const counts = await AssessmentQuestion.aggregate([
        { $match: { assessment: { $in: assessmentIds }, isDeleted: { $ne: true } } },
        { $group: { _id: "$assessment", count: { $sum: 1 } } },
      ]);
      countMap = new Map(counts.map((c: any) => [c._id.toString(), c.count]));
    }

    const resolvedData = result.data.map((a: any) => {
      const resolved = AcademicResolver.resolveAssessment(a);
      resolved.questionCount = countMap.get(a._id?.toString() || a.id?.toString()) || 0;
      return resolved;
    });

    return NextResponse.json(
      ResponseHelper.success("Assessments fetched successfully", resolvedData, result.meta),
      { status: 200 }
    );
  })
);

// POST Create Assessment
export const POST = withRoles(
  ["Admin", "Super Admin", "Academic Manager", "Teacher"],
  apiHandler(async (req: NextRequest, userContext: any) => {
    await connectDB();
    const body = await req.json();

    const batchId = body.batch || body.batchId;
    if (!batchId) {
      throw new ApiError(400, "Batch is required", ERROR_CODES.VALIDATION_ERROR);
    }
    const batchDoc: any = await Batch.findById(batchId).lean();
    if (!batchDoc) {
      throw new ApiError(404, "Batch not found", ERROR_CODES.NOT_FOUND);
    }

    let teacherId = body.teacher;
    if (userContext.role === "Teacher") {
      const teacherContext = await AssessmentService.getTeacherContext(userContext.userId);
      if (!teacherContext || !teacherContext.teacherDoc) {
        throw new ApiError(403, "Teacher profile not found", ERROR_CODES.FORBIDDEN);
      }
      if (!teacherContext.teacherBatchIdStrings.includes(batchId.toString())) {
        throw new ApiError(403, "You are not authorized to create assessments for this batch", ERROR_CODES.FORBIDDEN);
      }
      teacherId = teacherContext.teacherDoc._id;
    } else {
      if (!teacherId) {
        teacherId = batchDoc.primaryTeacher || batchDoc.assistantTeacher;
      }
    }

    const courseId = body.course || body.courseId || batchDoc.course;
    if (body.course && batchDoc.course && body.course.toString() !== batchDoc.course.toString()) {
      throw new ApiError(400, "Selected course does not match batch course", ERROR_CODES.VALIDATION_ERROR);
    }

    const count = await assessmentRepository.findMany({}).then((res) => res.length);
    const assessmentCode = `ASM-EX-${String(count + 1).padStart(4, "0")}`;

    const assessment = await AssessmentService.createAssessment(
      {
        ...body,
        title: body.title,
        description: body.description || body.instructions || body.title,
        course: courseId,
        batch: batchId,
        cohort: !Array.isArray(batchDoc) ? batchDoc?.cohort : null,
        teacher: teacherId,
        type: body.type || 'quiz',
        instructions: body.instructions || '',
        duration: Number(body.duration) || 60,
        maximumMarks: Number(body.maximumMarks) || 100,
        passingMarks: Number(body.passingMarks) || 40,
        assessmentDate: body.assessmentDate ? new Date(body.assessmentDate) : new Date(),
        startTime: body.startTime ? new Date(body.startTime) : new Date(),
        endTime: body.endTime ? new Date(body.endTime) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        timezone: body.timezone || 'UTC',
        attemptLimit: Number(body.attemptLimit) || 1,
        negativeMarking: Boolean(body.negativeMarking),
        randomizationEnabled: Boolean(body.randomizationEnabled),
        visibility: body.visibility || 'public',
        assessmentCode,
        status: body.status === 'scheduled' ? 'scheduled' : 'draft',
        createdBy: userContext.userId,
      },
      userContext.userId
    );

    return NextResponse.json(ResponseHelper.success("Assessment created as draft", assessment), { status: 201 });
  })
);
