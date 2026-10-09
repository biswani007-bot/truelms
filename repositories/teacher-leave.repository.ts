import { TeacherLeave, ITeacherLeave } from "../models/teacher-leave.model";
import { BaseRepository } from "./base.repository";

export class TeacherLeaveRepository extends BaseRepository<ITeacherLeave> {
  constructor() {
    super(TeacherLeave);
  }
}

export const teacherLeaveRepository = new TeacherLeaveRepository();
