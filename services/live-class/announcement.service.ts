/* eslint-disable @typescript-eslint/no-explicit-any */
import { liveClassAnnouncementRepository } from "../../repositories/live-class-announcement.repository";
import { liveClassTimelineRepository } from "../../repositories/live-class-timeline.repository";

export class AnnouncementService {
  static async createAnnouncement(data: {
    liveClass: string;
    title: string;
    content: string;
    type: "general" | "homework" | "schedule-change";
    isPinned?: boolean;
    sentBy: string;
  }) {
    const ann = await liveClassAnnouncementRepository.create({
      liveClass: data.liveClass as any,
      title: data.title,
      content: data.content,
      type: data.type,
      isPinned: data.isPinned ?? false,
      sentBy: data.sentBy as any,
    });

    await liveClassTimelineRepository.create({
      liveClass: data.liveClass as any,
      event: "resources-added",
      description: `Announcement posted: ${data.title} (Type: ${data.type})`,
      performedBy: data.sentBy as any,
    });

    return ann;
  }
}
