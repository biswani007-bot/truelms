import { Attendance, IAttendance } from "../models/attendance.model";
import { BaseRepository } from "./base.repository";

class AttendanceRepository extends BaseRepository<IAttendance> {
  constructor() {
    super(Attendance);
  }
}

export const attendanceRepository = new AttendanceRepository();
