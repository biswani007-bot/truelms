/* eslint-disable @typescript-eslint/no-explicit-any */
import { attendanceTimelineRepository } from "../../repositories/attendance-timeline.repository";
import { AttendanceSession } from "../../models/attendance-session.model";

export class AttendanceSessionService {
  static async openSession(classId: string, batchId: string, userId?: string) {
    const session = await AttendanceSession.findOneAndUpdate(
      { liveClass: classId as any },
      {
        $set: {
          batch: batchId as any,
          status: "open",
          openedAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );

    await attendanceTimelineRepository.create({
      liveClass: classId as any,
      batch: batchId as any,
      event: "session-opened",
      description: "Attendance register opened for student rollcall",
      performedBy: userId as any,
    });

    return session;
  }

  static async closeSession(classId: string, batchId: string, userId?: string) {
    const session = await AttendanceSession.findOneAndUpdate(
      { liveClass: classId as any },
      {
        $set: {
          status: "closed",
          closedAt: new Date(),
        },
      },
      { new: true }
    );

    await attendanceTimelineRepository.create({
      liveClass: classId as any,
      batch: batchId as any,
      event: "session-closed",
      description: "Attendance register closed by teacher",
      performedBy: userId as any,
    });

    return session;
  }

  static async freezeSession(classId: string, batchId: string, userId?: string) {
    const session = await AttendanceSession.findOneAndUpdate(
      { liveClass: classId as any },
      {
        $set: {
          status: "frozen",
          frozenAt: new Date(),
        },
      },
      { new: true }
    );

    await attendanceTimelineRepository.create({
      liveClass: classId as any,
      batch: batchId as any,
      event: "freeze",
      description: "Attendance session frozen. Read-only lock applied.",
      performedBy: userId as any,
    });

    return session;
  }

  static async reopenSession(classId: string, batchId: string, userId?: string) {
    const session = await AttendanceSession.findOneAndUpdate(
      { liveClass: classId as any },
      {
        $set: {
          status: "open",
          openedAt: new Date(),
        },
      },
      { new: true }
    );

    await attendanceTimelineRepository.create({
      liveClass: classId as any,
      batch: batchId as any,
      event: "re-open",
      description: "Attendance session re-opened for adjustments",
      performedBy: userId as any,
    });

    return session;
  }
}
