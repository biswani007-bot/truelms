import { LeadTimeline, ILeadTimeline } from "../models/lead-timeline.model";
import { BaseRepository } from "./base.repository";

export class LeadTimelineRepository extends BaseRepository<ILeadTimeline> {
  constructor() {
    super(LeadTimeline);
  }
}

export const leadTimelineRepository = new LeadTimelineRepository();
