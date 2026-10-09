import { EnrollmentTimeline, IEnrollmentTimeline } from "../models/enrollment-timeline.model";
import { BaseRepository } from "./base.repository";

export class EnrollmentTimelineRepository extends BaseRepository<IEnrollmentTimeline> {
  constructor() {
    super(EnrollmentTimeline);
  }
}

export const enrollmentTimelineRepository = new EnrollmentTimelineRepository();
