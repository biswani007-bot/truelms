import { FinanceTimeline, IFinanceTimeline } from "../models/finance-timeline.model";
import { BaseRepository } from "./base.repository";

class FinanceTimelineRepository extends BaseRepository<IFinanceTimeline> {
  constructor() {
    super(FinanceTimeline);
  }
}

export const financeTimelineRepository = new FinanceTimelineRepository();
