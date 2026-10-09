import { CourseTopic, ICourseTopic } from "../models/course-topic.model";
import { BaseRepository } from "./base.repository";

export class CourseTopicRepository extends BaseRepository<ICourseTopic> {
  constructor() {
    super(CourseTopic);
  }
}

export const courseTopicRepository = new CourseTopicRepository();
