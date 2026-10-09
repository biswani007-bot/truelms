/* eslint-disable @typescript-eslint/no-explicit-any */
import { LiveClass } from "../../models/live-class.model";
import { CohortCalendar } from "../../models/cohort-calendar.model";
import { Batch } from "../../models/batch.model";

export class ConflictService {
  /**
   * Check if a proposed time range overlaps with existing scheduled classes
   * or falls on a holiday.
   */
  static async checkConflicts(
    batchId: string,
    teacherId: string,
    startDate: Date,
    endDate: Date,
    excludeClassId?: string
  ): Promise<{ hasConflict: boolean; reason?: string }> {
    if (!startDate || !endDate || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return { hasConflict: false };
    }

    // 1. Check Cohort Holiday Calendar
    const batch = await Batch.findById(batchId);
    if (batch && batch.cohort) {
      const calendar = await CohortCalendar.findOne({ cohort: batch.cohort });
      if (calendar) {
        const proposedDayStr = startDate.toISOString().split("T")[0];
        const holidayEvent = calendar.events.find(
          (event: any) =>
            event.type === "holiday" &&
            new Date(event.eventDate).toISOString().split("T")[0] === proposedDayStr
        );
        if (holidayEvent) {
          return {
            hasConflict: true,
            reason: `Proposed date falls on holiday: ${holidayEvent.title}`,
          };
        }
      }
    }

    // 2. Check Teacher Overlaps
    const teacherQuery: any = {
      teacher: teacherId,
      status: { $in: ["scheduled", "live", "rescheduled"] },
      startDate: { $lt: endDate },
      endDate: { $gt: startDate },
      isDeleted: false,
    };
    if (excludeClassId) {
      teacherQuery._id = { $ne: excludeClassId };
    }
    const teacherConflict = await LiveClass.findOne(teacherQuery);
    if (teacherConflict) {
      return {
        hasConflict: true,
        reason: `Teacher is already booked for class: ${teacherConflict.classTitle} (${teacherConflict.classCode})`,
      };
    }

    // 3. Check Batch Overlaps
    const batchQuery: any = {
      batch: batchId,
      status: { $in: ["scheduled", "live", "rescheduled"] },
      startDate: { $lt: endDate },
      endDate: { $gt: startDate },
      isDeleted: false,
    };
    if (excludeClassId) {
      batchQuery._id = { $ne: excludeClassId };
    }
    const batchConflict = await LiveClass.findOne(batchQuery);
    if (batchConflict) {
      return {
        hasConflict: true,
        reason: `Batch already has a scheduled class: ${batchConflict.classTitle} (${batchConflict.classCode})`,
      };
    }

    return { hasConflict: false };
  }
}
