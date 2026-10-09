import { Teacher, ITeacher } from "../models/teacher.model";
import { BaseRepository } from "./base.repository";

export class TeacherRepository extends BaseRepository<ITeacher> {
  constructor() {
    super(Teacher);
  }
}

export const teacherRepository = new TeacherRepository();
