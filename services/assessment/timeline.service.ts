/* eslint-disable @typescript-eslint/no-explicit-any */
import { assessmentTimelineRepository } from "../../repositories/assessment-timeline.repository";

export class TimelineService {
  static async logEvent(assessmentId: string, event: string, description: string, userId?: string) {
    return assessmentTimelineRepository.create({
      assessment: assessmentId as any,
      event: event as any,
      description,
      performedBy: userId as any,
      timestamp: new Date(),
    });
  }
}
