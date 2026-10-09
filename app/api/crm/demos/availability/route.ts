import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/config/db";
import { DemoAvailability } from "@/models/demo-availability.model";
import { DemoSession } from "@/models/demo-session.model";
import { verifyAuth } from "@/middleware/auth.middleware";

function parseTimeString(timeStr: string): { hours: number; minutes: number; formatted: string } | null {
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return null;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3]?.toUpperCase();

  if (minutes < 0 || minutes > 59) return null;

  if (period) {
    if (hours < 1 || hours > 12) return null;
    if (period === "PM" && hours < 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;
  } else {
    if (hours < 0 || hours > 23) return null;
  }

  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  const displayPeriod = hours >= 12 ? "PM" : "AM";
  const formattedMinutes = minutes.toString().padStart(2, "0");
  const formatted = `${displayHours}:${formattedMinutes} ${displayPeriod}`;

  return { hours, minutes, formatted };
}

// GET all demo availability slots for admin
export async function GET(req: Request) {
  try {
    await connectDB();
    const user = verifyAuth(req);
    const userRoles = [
      (user?.role || "").toLowerCase().replace(/[-_ ]/g, ""),
      ...(((user as any)?.roles || []).map((r: string) => (r || "").toLowerCase().replace(/[-_ ]/g, ""))),
    ];
    const allowed = ["admin", "superadmin", "academicmanager", "operationsmanager"];
    if (!user || !userRoles.some((r) => allowed.includes(r))) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const slots = await DemoAvailability.find({ isDeleted: { $ne: true } })
      .populate("course", "courseName courseCode slug")
      .populate("teacher", "firstName lastName email")
      .sort({ scheduledStart: 1 });

    return NextResponse.json({ success: true, data: slots }, { status: 200 });
  } catch (error: any) {
    console.error("Failed to fetch demo availability:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 });
  }
}

// POST generate demo availability slots
export async function POST(req: Request) {
  try {
    await connectDB();
    const user = verifyAuth(req);
    const userRoles = [
      (user?.role || "").toLowerCase().replace(/[-_ ]/g, ""),
      ...(((user as any)?.roles || []).map((r: string) => (r || "").toLowerCase().replace(/[-_ ]/g, ""))),
    ];
    const allowed = ["admin", "superadmin", "academicmanager", "operationsmanager"];
    if (!user || !userRoles.some((r) => allowed.includes(r))) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { startDate, endDate, daysOfWeek, times, duration, teacher, course, timezone } = await req.json();

    if (!startDate || !endDate || !daysOfWeek || !times || !duration) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json({ success: false, error: "Invalid date range" }, { status: 400 });
    }

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    const durationNum = Number(duration);
    if (!Number.isInteger(durationNum) || durationNum <= 0) {
      return NextResponse.json(
        { success: false, error: "Duration must be a positive whole number of minutes" },
        { status: 400 }
      );
    }

    const slotDuration = durationNum;
    const newSlots = [];
    const revivedSlots: any[] = [];
    const now = new Date();

    const teacherFilter = teacher ? new mongoose.Types.ObjectId(teacher) : { $in: [null, undefined] };
    const courseFilter = course ? new mongoose.Types.ObjectId(course) : { $in: [null, undefined] };

    // Iterate day by day
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dayIndex = d.getDay();

      if (daysOfWeek.includes(dayIndex)) {
        for (const timeStr of times) {
          const parsed = parseTimeString(timeStr);
          if (!parsed) continue;

          const slotStart = new Date(d);
          slotStart.setHours(parsed.hours, parsed.minutes, 0, 0);

          // Only future slots
          if (slotStart <= now) continue;

          const slotEnd = new Date(slotStart.getTime() + slotDuration * 60000);
          const endHours = slotEnd.getHours() % 12 === 0 ? 12 : slotEnd.getHours() % 12;
          const endPeriod = slotEnd.getHours() >= 12 ? "PM" : "AM";
          const endMinutes = slotEnd.getMinutes().toString().padStart(2, "0");
          const formattedEndTime = `${endHours}:${endMinutes} ${endPeriod}`;

          const slotDate = new Date(slotStart);
          slotDate.setHours(0, 0, 0, 0);

          // Duplicate generation protection: check if active slot already exists
          const existingActiveSlot = await DemoAvailability.findOne({
            scheduledStart: slotStart,
            teacher: teacherFilter,
            course: courseFilter,
            isDeleted: { $ne: true },
          });

          if (existingActiveSlot) {
            // Already actively scheduled -> skip to avoid duplicate
            continue;
          }

          // Check if a soft-deleted slot already exists for this slot key
          const existingDeletedSlot = await DemoAvailability.findOne({
            scheduledStart: slotStart,
            teacher: teacherFilter,
            course: courseFilter,
            isDeleted: true,
          });

          if (
            existingDeletedSlot &&
            (!existingDeletedSlot.bookedCount || existingDeletedSlot.bookedCount === 0) &&
            !existingDeletedSlot.bookedDemoSession
          ) {
            // Revive the existing unbooked soft-deleted slot instead of inserting a duplicate document
            await DemoAvailability.updateOne(
              { _id: existingDeletedSlot._id },
              {
                $set: {
                  slotDate,
                  startTime: parsed.formatted,
                  endTime: formattedEndTime,
                  scheduledStart: slotStart,
                  scheduledEnd: slotEnd,
                  duration: slotDuration,
                  timezone: timezone || "UTC",
                  teacher: teacher ? new mongoose.Types.ObjectId(teacher) : undefined,
                  course: course ? new mongoose.Types.ObjectId(course) : undefined,
                  status: "available",
                  capacity: 1,
                  bookedCount: 0,
                  isDeleted: false,
                  deletedAt: null,
                },
              }
            );
            revivedSlots.push(existingDeletedSlot);
          } else {
            newSlots.push({
              slotDate,
              startTime: parsed.formatted,
              endTime: formattedEndTime,
              scheduledStart: slotStart,
              scheduledEnd: slotEnd,
              duration: slotDuration,
              timezone: timezone || "UTC",
              teacher: teacher ? new mongoose.Types.ObjectId(teacher) : undefined,
              course: course ? new mongoose.Types.ObjectId(course) : undefined,
              status: "available",
              capacity: 1,
              bookedCount: 0,
            });
          }
        }
      }
    }

    if (newSlots.length > 0) {
      try {
        await DemoAvailability.insertMany(newSlots, { ordered: false });
      } catch (insertError: any) {
        if (
          insertError.code === 11000 ||
          insertError.writeErrors?.some((e: any) => e.code === 11000)
        ) {
          console.warn("Handled duplicate key race during slot creation:", insertError.message);
        } else {
          throw insertError;
        }
      }
    }

    const totalCreatedOrRestored = newSlots.length + revivedSlots.length;

    return NextResponse.json(
      {
        success: true,
        message: totalCreatedOrRestored > 0
          ? `${totalCreatedOrRestored} demo times created`
          : "No new demo times created (all slots already exist or are in the past)",
        count: totalCreatedOrRestored,
        data: [...newSlots, ...revivedSlots],
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Failed to generate demo availability:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper for safe slot deletion respecting soft-delete convention and MongoDB index constraints
async function safelyDeleteSlot(slot: any): Promise<boolean> {
  const teacherFilter = slot.teacher
    ? slot.teacher
    : { $in: [null, undefined] };
  const courseFilter = slot.course
    ? slot.course
    : { $in: [null, undefined] };

  const existingDeleted = await DemoAvailability.findOne({
    _id: { $ne: slot._id },
    scheduledStart: slot.scheduledStart,
    teacher: teacherFilter,
    course: courseFilter,
    isDeleted: true,
  });

  try {
    if (existingDeleted) {
      // If an older soft-deleted record exists without bookings, remove the stale duplicate
      if (!existingDeleted.bookedCount && !existingDeleted.bookedDemoSession) {
        await DemoAvailability.deleteOne({ _id: existingDeleted._id });
        await DemoAvailability.findByIdAndUpdate(slot._id, {
          isDeleted: true,
          status: "cancelled",
          deletedAt: new Date(),
        });
      } else {
        // If the older soft-deleted record has booking history, preserve it and remove this unbooked slot
        await DemoAvailability.deleteOne({ _id: slot._id });
      }
    } else {
      await DemoAvailability.findByIdAndUpdate(slot._id, {
        isDeleted: true,
        status: "cancelled",
        deletedAt: new Date(),
      });
    }
    return true;
  } catch (updateError: any) {
    if (updateError.code === 11000 || updateError.message?.includes("E11000")) {
      // Fallback for race condition: remove the unbooked slot to guarantee E11000 is never returned
      console.warn("Caught E11000 on soft-delete; safely removing duplicate unbooked slot:", updateError.message);
      await DemoAvailability.deleteOne({ _id: slot._id });
      return true;
    } else {
      throw updateError;
    }
  }
}

// DELETE a single demo availability slot or all available slots (all=true)
export async function DELETE(req: Request) {
  try {
    await connectDB();
    const user = verifyAuth(req);
    const userRoles = [
      (user?.role || "").toLowerCase().replace(/[-_ ]/g, ""),
      ...(((user as any)?.roles || []).map((r: string) => (r || "").toLowerCase().replace(/[-_ ]/g, ""))),
    ];
    const allowed = ["admin", "superadmin", "academicmanager", "operationsmanager"];
    if (!user || !userRoles.some((r) => allowed.includes(r))) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const isAll = searchParams.get("all") === "true";

    // ── Bulk Delete: Delete All Eligible Available Slots ────────────────────
    if (isAll) {
      // 1. Authoritative query: target only unbooked, non-deleted available slots
      const candidates = await DemoAvailability.find({
        isDeleted: { $ne: true },
        status: "available",
        $or: [
          { bookedCount: { $exists: false } },
          { bookedCount: 0 },
          { bookedCount: null },
        ],
        bookedDemoSession: { $in: [null, undefined] },
      });

      if (!candidates.length) {
        return NextResponse.json(
          { success: true, message: "No available demo slots to delete", deletedCount: 0 },
          { status: 200 }
        );
      }

      // 2. Cross-reference with active DemoSessions to exclude referenced/booked time slots
      const activeSessions = await DemoSession.find({
        isDeleted: { $ne: true },
        status: { $in: ["scheduled", "live", "completed"] },
      }).select("scheduledStart teacher");

      const activeTimeTeacherKeys = new Set<string>();
      const activeTimesOnly = new Set<number>();
      for (const sess of activeSessions) {
        if (sess.scheduledStart) {
          const t = new Date(sess.scheduledStart).getTime();
          activeTimesOnly.add(t);
          if (sess.teacher) {
            activeTimeTeacherKeys.add(`${t}_${sess.teacher.toString()}`);
          }
        }
      }

      // 3. Filter candidates strictly excluding any that conflict with active DemoSessions
      const safeSlotsToDelete = candidates.filter((slot) => {
        const slotTime = new Date(slot.scheduledStart).getTime();
        if (slot.teacher) {
          if (activeTimeTeacherKeys.has(`${slotTime}_${slot.teacher.toString()}`)) {
            return false;
          }
        } else {
          if (activeTimesOnly.has(slotTime)) {
            return false;
          }
        }
        return true;
      });

      if (!safeSlotsToDelete.length) {
        return NextResponse.json(
          { success: true, message: "No unbooked demo slots eligible for deletion", deletedCount: 0 },
          { status: 200 }
        );
      }

      // 4. Safely process deletion
      let deletedCount = 0;
      for (const slot of safeSlotsToDelete) {
        await safelyDeleteSlot(slot);
        deletedCount++;
      }

      return NextResponse.json(
        {
          success: true,
          message: `Successfully deleted ${deletedCount} available slot${deletedCount === 1 ? "" : "s"}.`,
          deletedCount,
        },
        { status: 200 }
      );
    }

    // ── Individual Slot Deletion ─────────────────────────────────────────────
    if (!id) {
      return NextResponse.json({ success: false, error: "Slot ID required or all=true" }, { status: 400 });
    }

    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ success: false, error: "Invalid slot ID" }, { status: 400 });
    }

    // Find slot including soft-deleted ones (bypassing baseModelPlugin's filterNonDeleted)
    const slot = await DemoAvailability.findOne({
      _id: id,
      isDeleted: { $in: [true, false] },
    });

    if (!slot) {
      return NextResponse.json({ success: false, error: "Slot not found" }, { status: 404 });
    }

    // Idempotent delete: if already soft-deleted, return success safely
    if (slot.isDeleted === true) {
      return NextResponse.json(
        { success: true, message: "Slot already removed" },
        { status: 200 }
      );
    }

    // Booking protection: protect booked slots
    if (
      slot.status === "booked" ||
      (slot.bookedCount && slot.bookedCount > 0) ||
      slot.bookedDemoSession
    ) {
      return NextResponse.json(
        { success: false, error: "Cannot delete a slot that has already been booked" },
        { status: 400 }
      );
    }

    // Additional booking protection: check if an active DemoSession exists
    const activeDemo = await DemoSession.findOne({
      scheduledStart: slot.scheduledStart,
      ...(slot.teacher ? { teacher: slot.teacher } : {}),
      status: { $in: ["scheduled", "live", "completed"] },
      isDeleted: { $ne: true },
    });

    if (activeDemo) {
      return NextResponse.json(
        { success: false, error: "Cannot delete a slot with an associated demo session" },
        { status: 400 }
      );
    }

    await safelyDeleteSlot(slot);

    return NextResponse.json({ success: true, message: "Slot removed successfully" }, { status: 200 });
  } catch (error: any) {
    console.error("Failed to delete demo slot:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 });
  }
}
