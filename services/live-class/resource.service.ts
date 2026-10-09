/* eslint-disable @typescript-eslint/no-explicit-any */
import { liveClassResourceRepository } from "../../repositories/live-class-resource.repository";
import { liveClassTimelineRepository } from "../../repositories/live-class-timeline.repository";

export class ResourceService {
  static async attachResource(
    classId: string,
    data: { title: string; type: "presentation" | "pdf" | "worksheet" | "video" | "link"; url: string; sizeBytes?: number },
    userId?: string
  ) {
    const res = await liveClassResourceRepository.create({
      liveClass: classId as any,
      title: data.title,
      type: data.type,
      url: data.url,
      sizeBytes: data.sizeBytes,
      status: "published",
    });

    await liveClassTimelineRepository.create({
      liveClass: classId as any,
      event: "resources-added",
      description: `Class resource attached: ${data.title} (${data.type})`,
      performedBy: userId as any,
    });

    return res;
  }
}
