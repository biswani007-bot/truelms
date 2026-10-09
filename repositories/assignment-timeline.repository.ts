import { AssignmentTimeline, IAssignmentTimeline } from "../models/assignment-timeline.model";
import { BaseRepository } from "./base.repository";

class AssignmentTimelineRepository extends BaseRepository<IAssignmentTimeline> {
  constructor() {
    super(AssignmentTimeline);
  }
}

export const assignmentTimelineRepository = new AssignmentTimelineRepository();
