/* eslint-disable @typescript-eslint/no-explicit-any */
import { liveClassRepository } from "../../repositories/live-class.repository";
import { liveClassTimelineRepository } from "../../repositories/live-class-timeline.repository";
import { liveClassScheduleRepository } from "../../repositories/live-class-schedule.repository";
import { ConflictService } from "./conflict.service";
import { LiveClass } from "../../models/live-class.model";
import { ScheduleService } from "./schedule.service";

export class LiveClassService {
  /**
   * Schedules a single live class with conflict checking
   */
  static async scheduleClass(data: any, userId?: string) {
    if (data.batch) {
      const { Batch } = await import("../../models/batch.model");
      const batchDoc = await Batch.findById(data.batch);
      if (batchDoc) {
        if (batchDoc.cohort && !data.cohort) {
          data.cohort = batchDoc.cohort;
        }
        if (batchDoc.course) {
          data.course = batchDoc.course; // Strictly enforce canonical course identity
        }
      }
    }

    if (!data.classNumber) {
      const existingInBatch = await liveClassRepository.findMany({ batch: data.batch });
      data.classNumber = (existingInBatch?.length || 0) + 1;
    }

    if (!data.meetingPlatform) {
      data.meetingPlatform = "truelern";
    }

    if (!data.meetingLink) {
      data.meetingLink = `/student/live-classes`;
    }

    const startDateObj = new Date(data.startDate);
    const endDateObj = new Date(data.endDate);
    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      const { ApiError } = await import("../../utils/api-error");
      throw new ApiError(400, "Invalid start or end date provided", "INVALID_DATE");
    }

    const conflict = await ConflictService.checkConflicts(
      data.batch,
      data.teacher,
      startDateObj,
      endDateObj
    );
    if (conflict.hasConflict) {
      const { ApiError } = await import("../../utils/api-error");
      throw new ApiError(409, `Schedule conflict detected: ${conflict.reason}`, "SCHEDULE_CONFLICT");
    }

    const liveClass = await liveClassRepository.create(data);

    try {
      const mongoose = await import("mongoose");
      const timelineData: any = {
        liveClass: liveClass._id as any,
        event: "created",
        description: `Class scheduled successfully on platform ${data.meetingPlatform}`,
      };
      if (userId && mongoose.isValidObjectId(userId)) {
        timelineData.performedBy = userId;
      }
      await liveClassTimelineRepository.create(timelineData);
    } catch {
      // Timeline logging is non-blocking for class creation
    }

    return liveClass;
  }

  /**
   * Reschedules an existing class
   */
  static async rescheduleClass(classId: string, newStart: Date, newEnd: Date, userId?: string) {
    const liveClass = await liveClassRepository.findById(classId);
    if (!liveClass) throw new Error("Live class profile not found");

    const conflict = await ConflictService.checkConflicts(
      liveClass.batch.toString(),
      liveClass.teacher.toString(),
      newStart,
      newEnd,
      classId
    );
    if (conflict.hasConflict) {
      throw new Error(`Schedule conflict detected: ${conflict.reason}`);
    }

    const updated = await LiveClass.findByIdAndUpdate(
      classId,
      {
        startDate: newStart,
        endDate: newEnd,
        status: "rescheduled",
      },
      { new: true }
    );

    await liveClassTimelineRepository.create({
      liveClass: classId as any,
      event: "rescheduled",
      description: `Rescheduled to ${newStart.toLocaleString()} - ${newEnd.toLocaleString()}`,
      performedBy: userId as any,
    });

    return updated;
  }

  /**
   * Cancels a class
   */
  static async cancelClass(classId: string, userId?: string) {
    const updated = await LiveClass.findByIdAndUpdate(classId, { status: "cancelled" }, { new: true });
    await liveClassTimelineRepository.create({
      liveClass: classId as any,
      event: "cancelled",
      description: "Class cancelled by manager override",
      performedBy: userId as any,
    });
    return updated;
  }

  /**
   * Completes a class
   */
  static async completeClass(classId: string, userId?: string) {
    const updated = await LiveClass.findByIdAndUpdate(classId, { status: "completed" }, { new: true });
    await liveClassTimelineRepository.create({
      liveClass: classId as any,
      event: "completed",
      description: "Class completed and attendance finalized",
      performedBy: userId as any,
    });
    return updated;
  }

  /**
   * Duplicates/clones a class profile
   */
  static async duplicateClass(classId: string, newStart: Date, userId?: string) {
    const origin = await liveClassRepository.findById(classId);
    if (!origin) throw new Error("Source class profile not found");

    const count = await liveClassRepository.findMany({}).then((res) => res.length);
    const classCode = `LVC-${String(count + 1).padStart(4, "0")}`;

    const newEnd = new Date(newStart.getTime() + origin.duration * 60 * 1000);

    const dupData = {
      classCode,
      classTitle: `${origin.classTitle} (Cloned)`,
      batch: origin.batch,
      course: origin.course,
      cohort: origin.cohort,
      teacher: origin.teacher,
      assistantTeacher: origin.assistantTeacher,
      mentor: origin.mentor,
      classNumber: origin.classNumber + 1,
      startDate: newStart,
      endDate: newEnd,
      duration: origin.duration,
      timezone: origin.timezone,
      meetingPlatform: origin.meetingPlatform,
      meetingLink: origin.meetingLink,
      meetingId: origin.meetingId,
      meetingPassword: origin.meetingPassword,
      recordingEnabled: origin.recordingEnabled,
      description: origin.description,
      status: "scheduled",
    };

    return this.scheduleClass(dupData, userId);
  }

  /**
   * Clones schedule definitions from one batch to another
   */
  static async cloneSchedule(scheduleId: string, targetBatchId: string, userId?: string) {
    const origin = await liveClassScheduleRepository.findById(scheduleId);
    if (!origin) throw new Error("Source schedule not found");

    // Create target schedule definition
    const targetSchedule = await liveClassScheduleRepository.create({
      batch: targetBatchId as any,
      course: origin.course,
      recurrenceRule: origin.recurrenceRule,
      recurrenceConfig: origin.recurrenceConfig,
      startRange: origin.startRange,
      endRange: origin.endRange,
      templateMeetingDetails: origin.templateMeetingDetails,
    });

    // Generate occurrences
    const dates = ScheduleService.generateDates(targetSchedule);
    const createdClasses = [];

    for (let i = 0; i < dates.length; i++) {
      const start = dates[i];
      const end = new Date(start.getTime() + 60 * 60 * 1000); // default 60 mins
      const count = await liveClassRepository.findMany({}).then((res) => res.length);
      const classCode = `LVC-${String(count + 1).padStart(4, "0")}`;

      const liveClass = await this.scheduleClass(
        {
          classCode,
          classTitle: `Session ${i + 1}`,
          batch: targetBatchId,
          course: origin.course,
          cohort: targetSchedule.course, // using course id as cohort reference fallback
          teacher: origin.createdBy || targetSchedule._id, // fallback assignment
          classNumber: i + 1,
          startDate: start,
          endDate: end,
          duration: 60,
          meetingPlatform: origin.templateMeetingDetails.meetingPlatform,
          meetingLink: origin.templateMeetingDetails.meetingLink,
          status: "scheduled",
        },
        userId
      );
      createdClasses.push(liveClass);
    }

    return { schedule: targetSchedule, occurrences: createdClasses.length };
  }
}
