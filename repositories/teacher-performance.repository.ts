import { TeacherPerformance, ITeacherPerformance } from "../models/teacher-performance.model";
import { BaseRepository } from "./base.repository";

export class TeacherPerformanceRepository extends BaseRepository<ITeacherPerformance> {
  constructor() {
    super(TeacherPerformance);
  }
}

export const teacherPerformanceRepository = new TeacherPerformanceRepository();
