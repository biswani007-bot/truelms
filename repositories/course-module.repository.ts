import { CourseModule, ICourseModule } from "../models/course-module.model";
import { BaseRepository } from "./base.repository";

export class CourseModuleRepository extends BaseRepository<ICourseModule> {
  constructor() {
    super(CourseModule);
  }
}

export const courseModuleRepository = new CourseModuleRepository();
