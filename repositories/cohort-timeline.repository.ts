import { CohortTimeline, ICohortTimeline } from "../models/cohort-timeline.model";
import { BaseRepository } from "./base.repository";

export class CohortTimelineRepository extends BaseRepository<ICohortTimeline> {
  constructor() {
    super(CohortTimeline);
  }
}

export const cohortTimelineRepository = new CohortTimelineRepository();
