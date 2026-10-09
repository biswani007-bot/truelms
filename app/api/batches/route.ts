
/**
 * @swagger
 * /api/batches:
 *   post:
 *     summary: Auto-generated summary for POST /api/batches
 *     tags: [batches]
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
 * /api/batches:
 *   get:
 *     summary: Auto-generated summary for GET /api/batches
 *     tags: [batches]
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
import { batchRepository } from "../../../repositories/batch.repository";
import { ResponseHelper } from "../../../helpers/response";
import { apiHandler } from "../../../utils/api-handler";
import { PaginationSchema } from "../../../dtos/pagination.dto";
import { connectDB } from "../../../config/db";
import { AcademicResolver } from "../../../services/academic/academic.service";
import { BatchService } from "../../../services/batch/batch.service";
import { Course } from "../../../models/course.model";
import { Cohort } from "../../../models/cohort.model";
import { Batch } from "../../../models/batch.model";
import { Teacher } from "../../../models/teacher.model";

// GET Paginated Batches
export const GET = withRoles(
  ["Admin", "Super Admin", "Academic Manager", "Teacher"],
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

    // Custom filters
    const status = url.searchParams.get("status");
    const cohort = url.searchParams.get("cohort");
    const course = url.searchParams.get("course");
    const teacher = url.searchParams.get("teacher");
    const language = url.searchParams.get("language");

    if (status) paginationInput.filters.status = status;
    if (cohort) paginationInput.filters.cohort = cohort;
    if (course) paginationInput.filters.course = course;
    if (teacher) paginationInput.filters.primaryTeacher = teacher;
    if (language) paginationInput.filters.language = language;

    const searchableFields = ["batchCode", "batchName", "language", "timezone", "description"];
    const result = await batchRepository.paginate(paginationInput, searchableFields, {
      populate: ["cohort", "course", "primaryTeacher"],
    });

    return NextResponse.json(
      ResponseHelper.success("Fetched batches successfully", result.data.map((b: any) => AcademicResolver.resolveBatch(b)), result.meta),
      { status: 200 }
    );
  })
);

// POST Create Batch for specific course and cohort
export const POST = withRoles(
  ["Admin", "Super Admin", "Academic Manager"],
  apiHandler(async (req: NextRequest, userContext: any) => {
    await connectDB();
    const body = await req.json().catch(() => ({}));

    // 1. Authoritative Course Validation
    const courseId = body.courseId || body.course;
    if (!courseId || !mongoose.isValidObjectId(courseId)) {
      return NextResponse.json(
        ResponseHelper.error("Valid course ID is required"),
        { status: 400 }
      );
    }
    const course = await Course.findById(courseId);
    if (!course) {
      return NextResponse.json(
        ResponseHelper.error("Course not found"),
        { status: 404 }
      );
    }

    // 2. Authoritative Cohort Validation
    const cohortId = body.cohortId || body.cohort;
    if (!cohortId || !mongoose.isValidObjectId(cohortId)) {
      return NextResponse.json(
        ResponseHelper.error("Valid cohort ID is required"),
        { status: 400 }
      );
    }
    const cohort = await Cohort.findById(cohortId);
    if (!cohort) {
      return NextResponse.json(
        ResponseHelper.error("Cohort not found"),
        { status: 404 }
      );
    }

    // 3. Authoritative Course-Cohort Relationship Validation
    if (cohort.course.toString() !== course._id.toString()) {
      return NextResponse.json(
        ResponseHelper.error("Selected cohort does not belong to the selected course"),
        { status: 400 }
      );
    }

    // 4. Batch Name Validation
    const batchName = typeof body.batchName === "string" ? body.batchName.trim() : "";
    if (!batchName) {
      return NextResponse.json(
        ResponseHelper.error("Batch name is required"),
        { status: 400 }
      );
    }

    // 5. Batch Code Validation & Collision-free Generation
    let finalBatchCode = "";
    if (body.batchCode && typeof body.batchCode === "string" && body.batchCode.trim()) {
      const customCode = body.batchCode.trim();
      const existing = await Batch.findOne({
        batchCode: customCode,
        isDeleted: { $in: [true, false] },
      });
      if (existing) {
        return NextResponse.json(
          ResponseHelper.error(`Batch code "${customCode}" already exists. Please choose a unique batch code.`, "DUPLICATE_CODE"),
          { status: 400 }
        );
      }
      finalBatchCode = customCode;
    } else {
      const count = await Batch.countDocuments();
      let index = count + 1;
      let candidate = `BTH-${String(index).padStart(4, "0")}`;
      while (await Batch.findOne({ batchCode: candidate, isDeleted: { $in: [true, false] } })) {
        index++;
        candidate = `BTH-${String(index).padStart(4, "0")}`;
      }
      finalBatchCode = candidate;
    }

    // 6. Capacity Validation
    let capacityNum: number | undefined;
    if (body.capacity !== undefined || body.maxCapacity !== undefined || body.defaultCapacity !== undefined) {
      const rawCap = body.capacity ?? body.maxCapacity ?? body.defaultCapacity;
      capacityNum = Number(rawCap);
      if (!Number.isInteger(capacityNum) || capacityNum <= 0) {
        return NextResponse.json(
          ResponseHelper.error("Capacity must be a positive integer"),
          { status: 400 }
        );
      }
    }

    // 7. Start Date & End Date Validation
    const rawStartDate = body.startDate || body.batchStart || cohort.startDate;
    const batchStart = new Date(rawStartDate);
    if (isNaN(batchStart.getTime())) {
      return NextResponse.json(
        ResponseHelper.error("Invalid start date"),
        { status: 400 }
      );
    }

    const rawEndDate = body.endDate || body.batchEnd || cohort.endDate;
    let batchEnd = rawEndDate ? new Date(rawEndDate) : new Date(batchStart.getTime() + 90 * 24 * 60 * 60 * 1000);
    if (isNaN(batchEnd.getTime()) || batchEnd <= batchStart) {
      batchEnd = new Date(batchStart.getTime() + 90 * 24 * 60 * 60 * 1000);
    }

    // 8. Teacher Validation (Optional)
    let teacherObjectId: mongoose.Types.ObjectId | undefined;
    const teacherId = body.teacherId || body.primaryTeacher;
    if (teacherId) {
      if (!mongoose.isValidObjectId(teacherId)) {
        return NextResponse.json(
          ResponseHelper.error("Invalid teacher ID format"),
          { status: 400 }
        );
      }
      const teacher = await Teacher.findById(teacherId);
      if (!teacher) {
        return NextResponse.json(
          ResponseHelper.error("Teacher not found"),
          { status: 404 }
        );
      }
      teacherObjectId = teacher._id;
    }

    // 9. Batch Creation via Core Service
    const batch = await BatchService.create(
      {
        batchCode: finalBatchCode,
        batchName,
        course: course._id,
        cohort: cohort._id,
        primaryTeacher: teacherObjectId,
        defaultCapacity: capacityNum,
        maxCapacity: capacityNum,
        batchStart,
        batchEnd,
        language: cohort.language || "en",
        timezone: cohort.timezone || "UTC",
        status: body.status || "planning",
        description: body.description || undefined,
      },
      userContext.userId
    );

    // 10. Populate Authoritative Details for Response
    const populated = await Batch.findById(batch._id).populate([
      "cohort",
      "course",
      "primaryTeacher",
    ]);

    const resolved = AcademicResolver.resolveBatch(populated);

    return NextResponse.json(
      ResponseHelper.success("Batch created successfully", resolved),
      { status: 201 }
    );
  })
);
