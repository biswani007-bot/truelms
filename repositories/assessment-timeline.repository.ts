import { AssessmentTimeline, IAssessmentTimeline } from "../models/assessment-timeline.model";
import { BaseRepository } from "./base.repository";

class AssessmentTimelineRepository extends BaseRepository<IAssessmentTimeline> {
  constructor() {
    super(AssessmentTimeline);
  }
}

export const assessmentTimelineRepository = new AssessmentTimelineRepository();
