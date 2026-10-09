import { BatchTimeline, IBatchTimeline } from "../models/batch-timeline.model";
import { BaseRepository } from "./base.repository";

class BatchTimelineRepository extends BaseRepository<IBatchTimeline> {
  constructor() {
    super(BatchTimeline);
  }
}

export const batchTimelineRepository = new BatchTimelineRepository();
