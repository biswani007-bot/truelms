import { LiveClassTimeline, ILiveClassTimeline } from "../models/live-class-timeline.model";
import { BaseRepository } from "./base.repository";

class LiveClassTimelineRepository extends BaseRepository<ILiveClassTimeline> {
  constructor() {
    super(LiveClassTimeline);
  }
}

export const liveClassTimelineRepository = new LiveClassTimelineRepository();
