
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
import { withRoles } from "../../../middleware/auth.middleware";
import { assessmentRepository } from "../../../repositories/assessment.repository";
import { ResponseHelper } from "../../../helpers/response";
import { apiHandler } from "../../../utils/api-handler";
import { PaginationSchema } from "../../../dtos/pagination.dto";
import { connectDB } from "../../../config/db";
import { AssessmentService } from "../../../services/assessment/assessment.service";
import { AcademicResolver } from "../../../services/academic/academic.service";
import { Batch } from "../../../models/batch.model";
import { BatchTeacher } from "../../../models/batch-teacher.model";
import { Teacher } from "../../../models/teacher.model";
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
    if (userContext?.role === 'Teacher') {
      const bts = await BatchTeacher.find({ teacher: userContext.userId }).lean();
      const teacherBatches = await Batch.find({
        $or: [
          { primaryTeacher: userContext.userId },
          { assistantTeacher: userContext.userId },
          { mentor: userContext.userId }
        ]
      }).lean();
      const authBatchIds = [...bts.map(b => b.batch), ...teacherBatches.map(b => b._id)];
      if (batch) {
        if (!authBatchIds.some(id => id.toString() === batch)) {
          return NextResponse.json(ResponseHelper.success('Assessments fetched successfully', [], { total: 0, page: 1, limit: 100 }), { status: 200 });
        }
      } else {
        paginationInput.filters.batch = { $in: authBatchIds };
      }
    }
    if (batch && !paginationInput.filters.batch) paginationInput.filters.batch = batch;

    const searchableFields = ["assessmentCode", "title", "type", "description"];
    const result = await assessmentRepository.paginate(paginationInput, searchableFields, {
      populate: ["course", "batch", "teacher"],
    });

    return NextResponse.json(
      ResponseHelper.success("Assessments fetched successfully", result.data.map((a: any) => AcademicResolver.resolveAssessment(a)), result.meta),
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

    const count = await assessmentRepository.findMany({}).then((res) => res.length);
    const assessmentCode = `ASM-EX-${String(count + 1).padStart(4, "0")}`;

    const batchId = body.batch || body.batchId;
    const batchDoc = await Batch.findById(batchId).lean();
    let teacherId = userContext.userId || userContext.id || userContext._id;
    if (userContext.role === 'Teacher' || userContext.role === 'Instructor') {
      const teacherDoc = await Teacher.findOne({ user: teacherId }).lean();
      if (teacherDoc && !Array.isArray(teacherDoc)) teacherId = teacherDoc._id;
    }

    const assessment = await AssessmentService.createAssessment(
      {
        ...body,
        title: body.title,
        description: body.description || body.instructions || body.title,
        course: body.course || body.courseId,
        batch: batchId,
        cohort: !Array.isArray(batchDoc) ? batchDoc?.cohort : null,
        teacher: body.teacher || teacherId,
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
        status: 'draft',
      },
      userContext.userId
    );

    return NextResponse.json(ResponseHelper.success("Assessment created as draft", assessment), { status: 201 });
  })
);
