
/**
 * @swagger
 * /api/public/search:
 *   get:
 *     summary: Auto-generated summary for GET /api/public/search
 *     tags: [public]
 *     
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
import { connectDB } from "../../../../config/db";
import { courseRepository } from "../../../../repositories/course.repository";
import { cohortRepository } from "../../../../repositories/cohort.repository";
import { teacherRepository } from "../../../../repositories/teacher.repository";
import { eventRepository } from "../../../../repositories/event.repository";
import { faqRepository } from "../../../../repositories/faq.repository";
import { ResponseHelper } from "../../../../helpers/response";
import { apiHandler } from "../../../../utils/api-handler";

/**
 * Unified Public Search API
 * GET /api/public/search?q=...
 */
export const GET = apiHandler(async (req: NextRequest) => {
  await connectDB();

  const q = req.nextUrl.searchParams.get("q") || "";
  if (!q.trim()) {
    return NextResponse.json(
      ResponseHelper.success("Empty query", {
        courses: [],
        programs: [],
        teachers: [],
        events: [],
        faqs: [],
      })
    );
  }

  const regex = new RegExp(q, "i");

  const [courses, programs, teachers, events, faqs] = await Promise.all([
    courseRepository.findMany({ status: "published", $or: [{ title: regex }, { code: regex }, { tags: regex }] }, { limit: 5 } as any),
    cohortRepository.findMany({ name: regex }, { limit: 5 } as any),
    teacherRepository.findMany({ status: "active", $or: [{ designation: regex }, { department: regex }] }, { limit: 5 } as any),
    eventRepository.findMany({ status: "published", title: regex }, { limit: 5 } as any),
    faqRepository.findMany({ $or: [{ question: regex }, { category: regex }] }, { limit: 5 } as any),
  ]);

  return NextResponse.json(
    ResponseHelper.success("Search completed successfully", {
      courses: courses.slice(0, 5),
      programs: programs.slice(0, 5),
      teachers: teachers.slice(0, 5),
      events: events.slice(0, 5),
      faqs: faqs.slice(0, 5),
    })
  );
});
