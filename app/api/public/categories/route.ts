
/**
 * @swagger
 * /api/public/categories:
 *   get:
 *     summary: Auto-generated summary for GET /api/public/categories
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
import { NextResponse } from "next/server";
import { connectDB } from "@/config/db";
import { ResponseHelper } from "@/helpers/response";
import { apiHandler } from "@/utils/api-handler";
import { CourseCategory } from "@/models/course-category.model";
import { Course } from "@/models/course.model";

/**
 * GET /api/public/categories
 *
 * Public unauthenticated endpoint returning all active course categories
 * with count of published courses in each.
 */
export const GET = apiHandler(async () => {
  await connectDB();

  const categories = await CourseCategory.find({ status: "ACTIVE" })
    .sort({ name: 1 })
    .lean();

  const counts = await Course.aggregate([
    { $match: { status: "published", isDeleted: { $ne: true } } },
    { $group: { _id: "$category", count: { $sum: 1 } } },
  ]);

  const countMap = new Map<string, number>();
  counts.forEach((c) => {
    if (c._id) countMap.set(c._id.toString(), c.count);
  });

  const formatted = categories.map((cat: any) => ({
    _id: cat._id,
    name: cat.name,
    slug: cat.slug,
    description: cat.description,
    courseCount: countMap.get(cat._id.toString()) || 0,
  }));

  return NextResponse.json(
    ResponseHelper.success("Fetched course categories successfully", formatted),
    { status: 200 }
  );
});
