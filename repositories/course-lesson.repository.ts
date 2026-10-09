import { CourseLesson, ICourseLesson } from "../models/course-lesson.model";
import { BaseRepository } from "./base.repository";

export class CourseLessonRepository extends BaseRepository<ICourseLesson> {
  constructor() {
    super(CourseLesson);
  }
}

export const courseLessonRepository = new CourseLessonRepository();
