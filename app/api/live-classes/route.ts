/**
 * @swagger
 * /api/live-classes:
 *   post:
 *     summary: Auto-generated summary for POST /api/live-classes
 *     tags: [live-classes]
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
 * /api/live-classes:
 *   get:
 *     summary: Auto-generated summary for GET /api/live-classes
 *     tags: [live-classes]
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
import { liveClassRepository } from "../../../repositories/live-class.repository";
import { ResponseHelper } from "../../../helpers/response";
import { apiHandler } from "../../../utils/api-handler";
import { PaginationSchema } from "../../../dtos/pagination.dto";
import { connectDB } from "../../../config/db";
import { LiveClassService } from "../../../services/live-class/live-class.service";
import { AcademicResolver } from "../../../services/academic/academic.service";
import { BatchTeacher } from "../../../models/batch-teacher.model";
import { batchRepository } from "../../../repositories/batch.repository";

// GET Paginated Live Classes
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
    const platform = url.searchParams.get("platform");

    if (status) paginationInput.filters.status = status;
    if (teacher) paginationInput.filters.teacher = teacher;
    if (batch) paginationInput.filters.batch = batch;
    if (course) paginationInput.filters.course = course;
    if (platform) paginationInput.filters.meetingPlatform = platform;

    const searchableFields = ["classCode", "classTitle", "meetingPlatform", "description"];
    const result = await liveClassRepository.paginate(paginationInput, searchableFields, {
      populate: ["batch", "course", "teacher"],
    });

    const resolvedData = result.data.map((lc: any) => AcademicResolver.resolveLiveClass(lc));

    return NextResponse.json(
      ResponseHelper.success("Live classes fetched successfully", resolvedData, result.meta),
      { status: 200 }
    );
  })
);

import { LiveClass } from "../../../models/live-class.model";

// POST Schedule Live Class (with Conflict Check)
export const POST = withRoles(
  ["Admin", "Super Admin", "Academic Manager", "Teacher"],
  apiHandler(async (req: NextRequest, userContext: any) => {
    await connectDB();
    const body = await req.json();

    const batch = await batchRepository.findById(body.batch);
    if (!batch) {
      return NextResponse.json({ error: "Batch not found." }, { status: 404 });
    }

    if (userContext.role === "Teacher") {
      const { teacherRepository } = await import("../../../repositories/teacher.repository");
      const teacherDoc = await teacherRepository.findOne({ user: userContext.userId });
      const teacherId = teacherDoc?._id?.toString() || userContext.userId;

      const isDirectlyAssigned = 
        batch.primaryTeacher?.toString() === teacherId ||
        batch.assistantTeacher?.toString() === teacherId ||
        batch.mentor?.toString() === teacherId;

      if (!isDirectlyAssigned) {
        const batchTeacher = await BatchTeacher.findOne({ batch: body.batch, teacher: teacherId, status: "active" });
        if (!batchTeacher) {
          return NextResponse.json({ error: "Access Denied: You are not authorized to schedule classes for this batch." }, { status: 403 });
        }
      }
      body.teacher = teacherId;
    }

    // Generate collision-resistant unique classCode
    let classCode = "";
    let codeIndex = (await LiveClass.countDocuments({})) + 1;
    while (!classCode) {
      const candidate = `LVC-${String(codeIndex).padStart(4, "0")}`;
      const exists = await LiveClass.findOne({ classCode: candidate });
      if (!exists) {
        classCode = candidate;
      } else {
        codeIndex++;
      }
    }

    const liveClass = await LiveClassService.scheduleClass(
      {
        ...body,
        classCode,
        status: "scheduled",
      },
      userContext?.userId
    );

    return NextResponse.json(
      ResponseHelper.success("Live class scheduled successfully", liveClass),
      { status: 201 }
    );
  })
);
