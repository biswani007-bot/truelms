
/**
 * @swagger
 * /api/public/courses:
 *   get:
 *     summary: Auto-generated summary for GET /api/public/courses
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
import { connectDB } from "@/config/db";
import { ResponseHelper } from "@/helpers/response";
import { apiHandler } from "@/utils/api-handler";
import { Course } from "@/models/course.model";
import { CourseCategory } from "@/models/course-category.model";
import { Cohort } from "@/models/cohort.model";
import { FeePlan } from "@/models/fee-plan.model";

/**
 * GET /api/public/courses
 *
 * Public unauthenticated endpoint returning all published courses available for enrollment.
 * Supports category filtering, search keyword query, and populates category metadata,
 * active cohort availability summary, and authoritative fee plan details.
 */
export const GET = apiHandler(async (req: NextRequest) => {
  await connectDB();

  const url = new URL(req.url);
  const categorySlug = url.searchParams.get("category");
  const search = url.searchParams.get("search")?.trim();
  const featuredOnly = url.searchParams.get("featured") === "true";

  // Build query filter
  const filter: any = {
    status: "published",
    isDeleted: { $ne: true },
  };

  if (featuredOnly) {
    filter.featured = true;
  }

  // Filter by category slug if provided
  if (categorySlug && categorySlug !== "all") {
    const categoryDoc = await CourseCategory.findOne({ slug: categorySlug, status: "ACTIVE" });
    if (categoryDoc) {
      filter.category = categoryDoc._id;
    } else {
      // Category not found, return empty results
      return NextResponse.json(
        ResponseHelper.success("Fetched published courses successfully", []),
        { status: 200 }
      );
    }
  }

  // Filter by search query if provided
  if (search) {
    const regex = new RegExp(search, "i");
    filter.$or = [
      { courseName: regex },
      { courseCode: regex },
      { shortDescription: regex },
    ];
  }

  // Query published courses populated with category
  const courses = await Course.find(filter)
    .populate("category", "name slug description")
    .sort({ featured: -1, createdAt: -1 })
    .lean();

  // Enhance each course with active cohort count and fee plan details
  const courseIds = courses.map((c) => c._id);

  const [activeCohorts, activeFeePlans] = await Promise.all([
    Cohort.find({
      course: { $in: courseIds },
      status: { $in: ["enrollment-open", "confirmed", "planning"] },
      isDeleted: { $ne: true },
    }).lean(),
    FeePlan.find({
      course: { $in: courseIds },
      status: "active",
      isDeleted: { $ne: true },
    }).lean(),
  ]);

  const cohortsByCourse = new Map<string, any[]>();
  for (const cohort of activeCohorts) {
    const cId = cohort.course.toString();
    if (!cohortsByCourse.has(cId)) cohortsByCourse.set(cId, []);
    cohortsByCourse.get(cId)!.push(cohort);
  }

  const feePlanByCourse = new Map<string, any>();
  for (const plan of activeFeePlans) {
    const cId = plan.course.toString();
    if (!feePlanByCourse.has(cId)) feePlanByCourse.set(cId, plan);
  }

  const enrichedCourses = courses.map((course: any) => {
    const cId = course._id.toString();
    const cohorts = cohortsByCourse.get(cId) || [];
    const feePlan = feePlanByCourse.get(cId);

    // Compute display fee
    let displayPrice = course.pricing?.discountPrice || course.pricing?.price || 0;
    const currency = course.pricing?.currency || "USD";

    if (feePlan) {
      const gross = (feePlan.baseFee || 0) + (feePlan.registrationFee || 0) + (feePlan.materialFee || 0);
      const taxAmount = Math.round((gross * (feePlan.tax || 0)) / 100);
      displayPrice = (gross + taxAmount) / 100; // in dollar units
    }

    const openCohortsCount = cohorts.filter((c) => c.status === "enrollment-open").length;

    return {
      _id: course._id,
      courseCode: course.courseCode,
      courseName: course.courseName,
      slug: course.slug,
      shortDescription: course.shortDescription,
      category: course.category
        ? {
            _id: course.category._id,
            name: course.category.name,
            slug: course.category.slug,
          }
        : null,
      level: course.level,
      duration: course.duration,
      durationUnit: course.durationUnit,
      deliveryMode: course.deliveryMode,
      certificateAvailable: course.certificateAvailable,
      featured: course.featured,
      pricing: {
        price: course.pricing?.price || displayPrice,
        discountPrice: course.pricing?.discountPrice || displayPrice,
        currency,
        displayPrice,
      },
      hasActiveFeePlan: !!feePlan,
      cohortsCount: cohorts.length,
      openCohortsCount,
      isEnrollmentOpen: openCohortsCount > 0 || cohorts.length > 0 || true,
    };
  });

  return NextResponse.json(
    ResponseHelper.success("Fetched published courses successfully", enrichedCourses),
    { status: 200 }
  );
});
