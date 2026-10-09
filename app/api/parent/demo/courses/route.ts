import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedParent } from "@/lib/auth/parent-auth";
import { Course } from "@/models/course.model";
import { ApiResponse } from "@/utils/api-response";
import { apiHandler } from "@/utils/api-handler";
import { connectDB } from "@/config/db";

/**
 * GET /api/parent/demo/courses
 *
 * Returns published courses available for demo booking.
 * Authenticated parent route — no course filtering by child's enrolled courses
 * (since demo is a pre-enrollment flow).
 */
export const GET = apiHandler(async (req: NextRequest) => {
  await getAuthenticatedParent(req);
  await connectDB();

  const courses = await Course.find({
    status: "published",
    isDeleted: { $ne: true },
  })
    .select("_id courseCode courseName slug shortDescription level deliveryMode")
    .sort({ courseName: 1 })
    .lean();

  const result = courses.map((c: any) => ({
    id: c._id.toString(),
    courseCode: c.courseCode,
    courseName: c.courseName,
    slug: c.slug,
    shortDescription: c.shortDescription,
    level: c.level,
    deliveryMode: c.deliveryMode,
  }));

  return NextResponse.json(ApiResponse.success("Courses retrieved successfully", result));
});
