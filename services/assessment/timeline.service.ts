/* eslint-disable @typescript-eslint/no-explicit-any */
import { assessmentTimelineRepository } from "../../repositories/assessment-timeline.repository";

export class TimelineService {
  static async logEvent(assessmentId: string, event: string, description: string, userId?: string) {
    try {
      const allowedEvents = ["created", "published", "started", "submitted", "evaluated", "result-published", "archived"];
      const safeEvent = allowedEvents.includes(event) ? event : "created";
      return await assessmentTimelineRepository.create({
        assessment: assessmentId as any,
        event: safeEvent as any,
        description,
        performedBy: userId as any,
        timestamp: new Date(),
      });
    } catch {
      return null;
    }
  }
}
