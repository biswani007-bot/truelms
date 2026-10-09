import { AttendanceTimeline, IAttendanceTimeline } from "../models/attendance-timeline.model";
import { BaseRepository } from "./base.repository";

class AttendanceTimelineRepository extends BaseRepository<IAttendanceTimeline> {
  constructor() {
    super(AttendanceTimeline);
  }
}

export const attendanceTimelineRepository = new AttendanceTimelineRepository();
