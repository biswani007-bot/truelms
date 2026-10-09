import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedParent } from "@/lib/auth/parent-auth";
import { DemoAvailability } from "@/models/demo-availability.model";
import { ApiResponse } from "@/utils/api-response";
import { apiHandler } from "@/utils/api-handler";
import { Course } from "@/models/course.model";
import mongoose from "mongoose";

/**
 * GET /api/parent/demo/availability
 * Returns available demo slots for the parent to book.
 *
 * Query params (at least one):
 *   courseId — Course ObjectId (preferred, new flow)
 *   program  — course slug or name (legacy fallback)
 */
export const GET = apiHandler(async (req: NextRequest) => {
  await getAuthenticatedParent(req);

  const searchParams = req.nextUrl.searchParams;
  const courseIdParam = searchParams.get("courseId");
  const program = searchParams.get("program");

  const now = new Date();

  const query: any = {
    status: "available",
    scheduledStart: { $gt: now },
    bookedCount: { $lt: 1 },
    isDeleted: { $ne: true },
  };

  // Prefer courseId lookup (new flow), fall back to slug/name
  if (courseIdParam && mongoose.isValidObjectId(courseIdParam)) {
    const courseDoc = await Course.findById(courseIdParam);
    if (courseDoc) {
      query.$or = [{ course: { $exists: false } }, { course: null }, { course: courseDoc._id }];
    }
  } else if (program) {
    const courseDoc = await Course.findOne({
      $or: [
        { slug: program.toLowerCase() },
        { courseName: new RegExp(`^${program}$`, "i") },
      ],
      status: "published",
      isDeleted: { $ne: true },
    });
    if (courseDoc) {
      query.$or = [{ course: { $exists: false } }, { course: null }, { course: courseDoc._id }];
    }
  }

  const slots = await DemoAvailability.find(query).sort({ scheduledStart: 1 });

  // Group by date
  const grouped: Record<string, any[]> = {};
  slots.forEach((slot: any) => {
    const dateStr = slot.scheduledStart.toISOString().split("T")[0];
    if (!grouped[dateStr]) {
      grouped[dateStr] = [];
    }
    grouped[dateStr].push({
      id: slot._id,
      scheduledStart: slot.scheduledStart,
      timeString:
        slot.startTime ||
        slot.scheduledStart.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      duration: slot.duration,
    });
  });

  const availableDates = Object.keys(grouped).sort();

  return NextResponse.json(
    ApiResponse.success("Available slots retrieved successfully", {
      dates: availableDates,
      slotsByDate: grouped,
    })
  );
});

