import { TeacherAvailability, ITeacherAvailability } from "../models/teacher-availability.model";
import { BaseRepository } from "./base.repository";

export class TeacherAvailabilityRepository extends BaseRepository<ITeacherAvailability> {
  constructor() {
    super(TeacherAvailability);
  }
}

export const teacherAvailabilityRepository = new TeacherAvailabilityRepository();
