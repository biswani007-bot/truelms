/**
 * @swagger
 * /api/courses/{id}/curriculum:
 *   get:
 *     summary: Auto-generated summary for GET /api/courses/{id}/curriculum
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
 * /api/courses/{id}/curriculum:
 *   post:
 *     summary: Auto-generated summary for POST /api/courses/{id}/curriculum
 *     tags: [courses]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       201:
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
import { withRoles } from "../../../../../middleware/auth.middleware";
import { courseModuleRepository } from "../../../../../repositories/course-module.repository";
import { courseLessonRepository } from "../../../../../repositories/course-lesson.repository";
import { courseTopicRepository } from "../../../../../repositories/course-topic.repository";
import { ResponseHelper } from "../../../../../helpers/response";
import { apiHandler } from "../../../../../utils/api-handler";
import { connectDB } from "../../../../../config/db";

export const dynamic = "force-dynamic";

// GET Course Curriculum (nested tree)
export const GET = withRoles(
  ["Admin", "Super Admin", "Academic Manager", "Course Manager", "Teacher", "Student", "Parent"],
  apiHandler(async (req: NextRequest, authUser: any, segmentData: any) => {
    await connectDB();
    const params = await segmentData.params;
    const { id } = params;

    // Fetch all modules for course
    const modules = await courseModuleRepository.findMany({ course: id }, { sort: "order", order: "asc" } as any);
    const curriculum = [];

    for (const mod of modules) {
      const lessons = await courseLessonRepository.findMany({ module: mod._id }, { sort: "order", order: "asc" } as any);
      const lessonTree = [];

      for (const les of lessons) {
        const topics = await courseTopicRepository.findMany({ lesson: les._id }, { sort: "order", order: "asc" } as any);
        const lesObj = typeof (les as any).toJSON === "function" ? (les as any).toJSON() : les;
        lessonTree.push({
          ...lesObj,
          topics,
        });
      }

      const modObj = typeof (mod as any).toJSON === "function" ? (mod as any).toJSON() : mod;
      curriculum.push({
        ...modObj,
        lessons: lessonTree,
      });
    }

    return NextResponse.json(ResponseHelper.success("Fetched course curriculum", curriculum), { status: 200 });
  })
);

// POST Save module/lesson/topic tree
export const POST = withRoles(
  ["Admin", "Super Admin", "Academic Manager", "Course Manager"],
  apiHandler(async (req: NextRequest, authUser: any, segmentData: any) => {
    await connectDB();
    const params = await segmentData.params;
    const { id } = params;
    const body = await req.json();

    const { modules } = body;
    if (!modules || !Array.isArray(modules)) {
      return NextResponse.json(ResponseHelper.error("Modules array is required"), { status: 400 });
    }

    const mongoose = require("mongoose");
    const CourseModule = mongoose.models.CourseModule;
    const CourseLesson = mongoose.models.CourseLesson;
    
    const existingCourseModules = await CourseModule.find({ course: id });
    const existingModuleIds = existingCourseModules.map((m: any) => m._id);
    await CourseLesson.deleteMany({ module: { $in: existingModuleIds } });
    await CourseModule.deleteMany({ course: id });

    const createdModules = [];
    for (let i = 0; i < modules.length; i++) {
      const mod = modules[i];
      const newModule = await CourseModule.create({
        course: id,
        name: mod.name,
        description: mod.description || "",
        order: mod.order || i + 1,
        status: "PUBLISHED"
      });
      createdModules.push(newModule);

      if (mod.lessons && Array.isArray(mod.lessons)) {
        for (let j = 0; j < mod.lessons.length; j++) {
          const les = mod.lessons[j];
          await CourseLesson.create({
            module: newModule._id,
            name: les.name,
            description: les.description || "",
            durationMinutes: les.durationMinutes || 15,
            order: les.order || j + 1,
            status: "PUBLISHED",
            contentType: les.contentType || "text",
            resourceUrl: les.resourceUrl || "",
            content: les.content || ""
          });
        }
      }
    }

    return NextResponse.json(ResponseHelper.success("Curriculum synced successfully", createdModules), { status: 201 });
  })
);
