
/**
 * @swagger
 * /api/courses/{id}:
 *   delete:
 *     summary: Auto-generated summary for DELETE /api/courses/{id}
 *     tags: [courses]
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
 * /api/courses/{id}:
 *   put:
 *     summary: Auto-generated summary for PUT /api/courses/{id}
 *     tags: [courses]
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
 * /api/courses/{id}:
 *   get:
 *     summary: Auto-generated summary for GET /api/courses/{id}
 *     tags: [courses]
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
import { withRoles } from "../../../../middleware/auth.middleware";
import { courseRepository } from "../../../../repositories/course.repository";
import { ResponseHelper } from "../../../../helpers/response";
import { apiHandler } from "../../../../utils/api-handler";
import { connectDB } from "../../../../config/db";

// GET Detail
export const GET = withRoles(
  ["Admin", "Super Admin", "Academic Manager", "Course Manager"],
  apiHandler(async (req: NextRequest, authUser: any, segmentData: any) => {
    await connectDB();
    const params = await segmentData.params;
    const { id } = params;
    const populateOptions = [
      { path: "category" },
      { path: "instructors" },
      { path: "demoFaculty.primaryTeacher", select: "firstName lastName employeeId teacherCode status user", populate: { path: "user", select: "email" } },
      { path: "demoFaculty.eligibleTeachers", select: "firstName lastName employeeId teacherCode status user", populate: { path: "user", select: "email" } },
      { path: "demoFaculty.backupTeacher", select: "firstName lastName employeeId teacherCode status user", populate: { path: "user", select: "email" } },
    ];
    const course = await courseRepository.findById(id, { populate: populateOptions as any });
    if (!course) {
      console.log("Course not found for id:", id);
      return NextResponse.json(ResponseHelper.error("Course not found", "NOT_FOUND"), { status: 404 });
    }

    return NextResponse.json(ResponseHelper.success("Fetched course details", course), { status: 200 });
  })
);

// PUT Update
export const PUT = withRoles(
  ["Admin", "Super Admin", "Academic Manager", "Course Manager"],
  apiHandler(async (req: NextRequest, authUser: any, segmentData: any) => {
    await connectDB();
    const params = await segmentData.params;
    const { id } = params;
    const body = await req.json();

    await courseRepository.update(id, body);
    const populateOptions = [
      { path: "category" },
      { path: "instructors" },
      { path: "demoFaculty.primaryTeacher", select: "firstName lastName employeeId teacherCode status user", populate: { path: "user", select: "email" } },
      { path: "demoFaculty.eligibleTeachers", select: "firstName lastName employeeId teacherCode status user", populate: { path: "user", select: "email" } },
      { path: "demoFaculty.backupTeacher", select: "firstName lastName employeeId teacherCode status user", populate: { path: "user", select: "email" } },
    ];
    const updated = await courseRepository.findById(id, { populate: populateOptions as any });
    return NextResponse.json(ResponseHelper.success("Course details updated", updated), { status: 200 });
  })
);

// DELETE Safe Delete
export const DELETE = withRoles(
  ["Admin", "Super Admin"],
  apiHandler(async (req: NextRequest, authUser: any, segmentData: any) => {
    await connectDB();
    const params = await segmentData.params;
    const { id } = params;

    const mongoose = require("mongoose");
    const Batch = mongoose.models.Batch;
    const Enrollment = mongoose.models.Enrollment;
    const Course = mongoose.models.Course;

    let courseOid;
    try {
      courseOid = new mongoose.Types.ObjectId(id);
    } catch {
      courseOid = id;
    }

    const batches = await Batch.countDocuments({ course: courseOid, isDeleted: { $ne: true } });
    const enrollments = await Enrollment.countDocuments({
      $or: [{ course: courseOid }, { "program.course": courseOid }],
      isDeleted: { $ne: true }
    });

    console.log(`[Course DELETE ${id}] batches: ${batches}, enrollments: ${enrollments}`);

    if (batches > 0 || enrollments > 0) {
      // Safe Archive due to dependencies
      const result = await courseRepository.softDelete(id);
      await Course.findByIdAndUpdate(id, { status: "ARCHIVED" });
      return NextResponse.json(ResponseHelper.success("Course archived due to existing dependencies.", result), { status: 200 });
    }

    // Hard delete since safe
    const result = await Course.findByIdAndDelete(id);
    return NextResponse.json(ResponseHelper.success("Course hard deleted successfully", result), { status: 200 });
  })
);
