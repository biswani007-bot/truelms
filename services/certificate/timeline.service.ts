/* eslint-disable @typescript-eslint/no-explicit-any */
import { certificateTimelineRepository } from "../../repositories/certificate-timeline.repository";

export class TimelineService {
  static async logEvent(certificateId: string, event: string, description: string, userId?: string) {
    return certificateTimelineRepository.create({
      certificate: certificateId as any,
      event: event as any,
      description,
      performedBy: userId as any,
      timestamp: new Date(),
    });
  }
}
