import { CourseCategory, ICourseCategory } from "../models/course-category.model";
import { BaseRepository } from "./base.repository";

export class CourseCategoryRepository extends BaseRepository<ICourseCategory> {
  constructor() {
    super(CourseCategory);
  }
}

export const courseCategoryRepository = new CourseCategoryRepository();
