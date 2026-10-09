import { StudentTimeline, IStudentTimeline } from "../models/student-timeline.model";
import { BaseRepository } from "./base.repository";

export class StudentTimelineRepository extends BaseRepository<IStudentTimeline> {
  constructor() {
    super(StudentTimeline);
  }
}

export const studentTimelineRepository = new StudentTimelineRepository();
