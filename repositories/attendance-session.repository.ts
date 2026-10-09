import { AttendanceSession, IAttendanceSession } from "../models/attendance-session.model";
import { BaseRepository } from "./base.repository";

class AttendanceSessionRepository extends BaseRepository<IAttendanceSession> {
  constructor() {
    super(AttendanceSession);
  }
}

export const attendanceSessionRepository = new AttendanceSessionRepository();
