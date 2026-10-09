import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { withRoles } from "@/middleware/auth.middleware";
import { apiHandler } from "@/utils/api-handler";
import { connectDB } from "@/config/db";
import { Course } from "@/models/course.model";
import { Batch } from "@/models/batch.model";
import { BatchTeacher } from "@/models/batch-teacher.model";
import { Teacher } from "@/models/teacher.model";
import { DemoSession } from "@/models/demo-session.model";
import { LiveClass } from "@/models/live-class.model";
import { ResponseHelper } from "@/helpers/response";

/**
 * GET /api/crm/demos/smart-schedule
 *
 * Purpose: Resolve eligible teachers + available time slots for a given course.
 * Used by Admin "Schedule Demo for Child" modal.
 *
 * Query params:
 *   courseId   — required — the Course ObjectId to resolve teachers/slots for
 *   teacherId  — optional — pre-selected teacher; if provided, only compute slots for this teacher
 *   duration   — optional — demo duration in minutes (default: 45)
 *   daysAhead  — optional — how many days ahead to compute slots (default: 14)
 *
 * Response:
 *   teachers: [{teacherId, name, email, role}]
 *   slots: [{date, startISO, endISO, startLabel, endLabel, durationMin}]
 */
export const GET = withRoles(
  ["Admin", "Super Admin", "Academic Manager", "operations-manager"],
  apiHandler(async (req: NextRequest) => {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("courseId");
    const teacherIdParam = searchParams.get("teacherId");
    const durationMin = Math.max(15, parseInt(searchParams.get("duration") || "45", 10));
    const daysAhead = Math.min(60, Math.max(3, parseInt(searchParams.get("daysAhead") || "14", 10)));

    if (!courseId || !mongoose.isValidObjectId(courseId)) {
      return NextResponse.json(
        ResponseHelper.error("Valid courseId is required"),
        { status: 400 }
      );
    }

    const course = await Course.findById(courseId);
    if (!course || course.isDeleted) {
      return NextResponse.json(ResponseHelper.error("Course not found"), { status: 404 });
    }

    // ── 1. Resolve eligible teachers for this course ──────────────────────────
    // Root source of truth: Course demo faculty via DemoTeacherService
    const { DemoTeacherService } = await import("@/services/demo/demo-teacher.service");
    const { primaryTeacher, eligibleTeachers: configEligible, backupTeacher, allEligibleTeachers } =
      await DemoTeacherService.resolveEligibleTeachersForCourse(course._id);

    const teacherSet = new Map<string, { teacherId: string; name: string; email: string; role: string }>();

    if (primaryTeacher) {
      teacherSet.set(primaryTeacher._id.toString(), {
        teacherId: primaryTeacher._id.toString(),
        name: `${primaryTeacher.firstName || ""} ${primaryTeacher.lastName || ""}`.trim() || primaryTeacher.email,
        email: primaryTeacher.email || primaryTeacher.user?.email,
        role: "primary",
      });
    }
    for (const t of configEligible) {
      if (!teacherSet.has(t._id.toString())) {
        teacherSet.set(t._id.toString(), {
          teacherId: t._id.toString(),
          name: `${t.firstName || ""} ${t.lastName || ""}`.trim() || t.email,
          email: t.email || t.user?.email,
          role: "eligible",
        });
      }
    }
    if (backupTeacher && !teacherSet.has(backupTeacher._id.toString())) {
      teacherSet.set(backupTeacher._id.toString(), {
        teacherId: backupTeacher._id.toString(),
        name: `${backupTeacher.firstName || ""} ${backupTeacher.lastName || ""}`.trim() || backupTeacher.email,
        email: backupTeacher.email || backupTeacher.user?.email,
        role: "backup",
      });
    }
    for (const t of allEligibleTeachers) {
      if (!teacherSet.has(t._id.toString())) {
        teacherSet.set(t._id.toString(), {
          teacherId: t._id.toString(),
          name: `${t.firstName || ""} ${t.lastName || ""}`.trim() || t.email,
          email: t.email || t.user?.email,
          role: "eligible",
        });
      }
    }

    // 1b. Fallback to existing batch assignments if no demo faculty configured
    if (teacherSet.size === 0) {
      const batches = await Batch.find({
        course: course._id,
        isDeleted: { $ne: true },
      }).lean();

      for (const batch of batches) {
        const checkTeacherIds: Array<{ id: mongoose.Types.ObjectId | null | undefined; role: string }> = [
          { id: batch.primaryTeacher as any, role: "primary" },
          { id: batch.assistantTeacher as any, role: "assistant" },
          { id: batch.mentor as any, role: "mentor" },
        ];
        for (const { id, role } of checkTeacherIds) {
          if (id && !teacherSet.has(id.toString())) {
            const t = await Teacher.findById(id).lean() as any;
            if (t && !t.isDeleted && t.status === "active") {
              teacherSet.set(id.toString(), {
                teacherId: id.toString(),
                name: `${t.firstName || ""} ${t.lastName || ""}`.trim() || t.email,
                email: t.email,
                role,
              });
            }
          }
        }
      }
    }

    const eligibleTeachers = Array.from(teacherSet.values());

    // ── 2. Compute available time slots ───────────────────────────────────────
    // If teacherId specified, narrow to that teacher; otherwise use all eligible teachers
    const relevantTeacherIds = teacherIdParam && mongoose.isValidObjectId(teacherIdParam)
      ? [new mongoose.Types.ObjectId(teacherIdParam)]
      : eligibleTeachers.map((t) => new mongoose.Types.ObjectId(t.teacherId));

    // Compute date range: now → now + daysAhead days
    const now = new Date();
    const windowEnd = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

    // Fetch existing conflicts: DemoSessions and LiveClasses in the window for relevant teachers
    let busyIntervals: Array<{ start: Date; end: Date; teacherId: string }> = [];

    if (relevantTeacherIds.length > 0) {
      const [conflictDemos, conflictLiveClasses] = await Promise.all([
        DemoSession.find({
          teacher: { $in: relevantTeacherIds },
          status: { $in: ["scheduled", "live"] },
          scheduledStart: { $lte: windowEnd },
          scheduledEnd: { $gte: now },
          isDeleted: { $ne: true },
        }).lean(),
        LiveClass.find({
          teacher: { $in: relevantTeacherIds },
          status: { $in: ["scheduled", "live"] },
          startDate: { $lte: windowEnd },
          endDate: { $gte: now },
          isDeleted: { $ne: true },
        }).lean(),
      ]);

      for (const d of conflictDemos as any[]) {
        busyIntervals.push({
          start: new Date(d.scheduledStart),
          end: new Date(d.scheduledEnd),
          teacherId: d.teacher?.toString() || "",
        });
      }
      for (const lc of conflictLiveClasses as any[]) {
        busyIntervals.push({
          start: new Date(lc.startDate),
          end: new Date(lc.endDate),
          teacherId: lc.teacher?.toString() || "",
        });
      }
    }

    // Generate candidate slots: every hour from 8 AM to 9 PM local (UTC), starting from next full hour
    const slots: Array<{
      date: string;
      startISO: string;
      endISO: string;
      startLabel: string;
      endLabel: string;
      durationMin: number;
      teacherId: string | null;
      teacherName: string | null;
    }> = [];

    // Start at next full hour after now (minimum 30 min from now)
    const startSearch = new Date(now.getTime() + 30 * 60 * 1000);
    startSearch.setMinutes(0, 0, 0);
    startSearch.setHours(startSearch.getHours() + 1);

    const targetTeachersList = teacherIdParam && mongoose.isValidObjectId(teacherIdParam)
      ? eligibleTeachers.filter((t) => t.teacherId === teacherIdParam)
      : eligibleTeachers;

    // If no eligible teachers, generate generic slots (no teacher-specific conflict check)
    const iterateTeachers = targetTeachersList.length > 0 ? targetTeachersList : [null];

    for (const teacher of iterateTeachers) {
      const teacherBusy = teacher
        ? busyIntervals.filter((b) => b.teacherId === teacher.teacherId)
        : [];

      for (let cursor = new Date(startSearch); cursor <= windowEnd; cursor.setHours(cursor.getHours() + 1)) {
        const slotStart = new Date(cursor);
        const hour = slotStart.getUTCHours();

        // Allow 8 AM - 9 PM UTC (adjustable)
        if (hour < 8 || hour >= 21) continue;

        // Skip weekends for now (0=Sun, 6=Sat) — configurable later
        // Removed weekend restriction to be permissive

        const slotEnd = new Date(slotStart.getTime() + durationMin * 60000);
        if (slotEnd > windowEnd) break;

        // Conflict check
        const hasConflict = teacherBusy.some((b) => {
          return slotStart < b.end && slotEnd > b.start;
        });
        if (hasConflict) continue;

        // Format labels
        const fmt = (d: Date) =>
          d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "UTC" });
        const dateLabel = slotStart.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          timeZone: "UTC",
        });

        slots.push({
          date: slotStart.toISOString().split("T")[0],
          startISO: slotStart.toISOString(),
          endISO: slotEnd.toISOString(),
          startLabel: fmt(slotStart),
          endLabel: fmt(slotEnd),
          durationMin,
          teacherId: teacher ? teacher.teacherId : null,
          teacherName: teacher ? teacher.name : null,
        });

        // Cap at 60 slots per teacher to avoid response explosion
        if (slots.filter((s) => s.teacherId === (teacher?.teacherId ?? null)).length >= 60) break;
      }
    }

    // Deduplicate by ISO start (keep first teacher found per slot if no specific teacher selected)
    const seenSlots = new Set<string>();
    const dedupedSlots = slots.filter((s) => {
      const key = `${s.startISO}-${s.teacherId ?? "any"}`;
      if (seenSlots.has(key)) return false;
      seenSlots.add(key);
      return true;
    });

    return NextResponse.json(
      ResponseHelper.success("Smart schedule computed", {
        course: {
          courseId: course._id,
          courseName: (course as any).courseName,
          courseCode: (course as any).courseCode,
        },
        eligibleTeachers,
        slots: dedupedSlots,
      }),
      { status: 200 }
    );
  })
);
