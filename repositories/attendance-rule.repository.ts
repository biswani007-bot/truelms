import { AttendanceRule, IAttendanceRule } from "../models/attendance-rule.model";
import { BaseRepository } from "./base.repository";

class AttendanceRuleRepository extends BaseRepository<IAttendanceRule> {
  constructor() {
    super(AttendanceRule);
  }
}

export const attendanceRuleRepository = new AttendanceRuleRepository();
