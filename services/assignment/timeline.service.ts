/* eslint-disable @typescript-eslint/no-explicit-any */
import { assignmentTimelineRepository } from "../../repositories/assignment-timeline.repository";

export class TimelineService {
  static async logEvent(assignmentId: string, event: string, description: string, userId?: string) {
    return assignmentTimelineRepository.create({
      assignment: assignmentId as any,
      event: event as any,
      description,
      performedBy: userId as any,
      timestamp: new Date(),
    });
  }
}
