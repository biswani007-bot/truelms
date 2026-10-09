import { AttendanceSummary, IAttendanceSummary } from "../models/attendance-summary.model";
import { BaseRepository } from "./base.repository";

class AttendanceSummaryRepository extends BaseRepository<IAttendanceSummary> {
  constructor() {
    super(AttendanceSummary);
  }
}

export const attendanceSummaryRepository = new AttendanceSummaryRepository();
