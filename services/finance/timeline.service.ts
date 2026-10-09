/* eslint-disable @typescript-eslint/no-explicit-any */
import { financeTimelineRepository } from "../../repositories/finance-timeline.repository";

export class TimelineService {
  static async logEvent(referenceId: string, event: string, description: string, userId?: string) {
    return financeTimelineRepository.create({
      referenceId: referenceId as any,
      event: event as any,
      description,
      performedBy: userId as any,
      timestamp: new Date(),
    });
  }
}
