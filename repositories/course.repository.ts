import { Course, ICourse } from "../models/course.model";
import { BaseRepository } from "./base.repository";
import "../models/course-category.model";
import "../models/user.model";
import "../models/teacher.model";

export class CourseRepository extends BaseRepository<ICourse> {
  constructor() {
    super(Course);
  }
}

export const courseRepository = new CourseRepository();
