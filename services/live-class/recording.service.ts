/* eslint-disable @typescript-eslint/no-explicit-any */
import { liveClassRecordingRepository } from "../../repositories/live-class-recording.repository";
import { liveClassTimelineRepository } from "../../repositories/live-class-timeline.repository";
import { LiveClass } from "../../models/live-class.model";

export class RecordingService {
  static async publishRecording(
    classId: string,
    data: { recordingUrl: string; durationMinutes?: number; sizeBytes?: number },
    userId?: string
  ) {
    const recording = await (liveClassRecordingRepository as any).model.findOneAndUpdate(
      { liveClass: classId as any },
      {
        liveClass: classId as any,
        recordingUrl: data.recordingUrl,
        durationMinutes: data.durationMinutes,
        sizeBytes: data.sizeBytes,
        status: "ready",
        isPublished: true,
      },
      { upsert: true, new: true }
    );

    // Update parent recordingUrl as well
    await LiveClass.findByIdAndUpdate(classId, { recordingUrl: data.recordingUrl });

    await liveClassTimelineRepository.create({
      liveClass: classId as any,
      event: "recording-published",
      description: `Class session recording published at: ${data.recordingUrl}`,
      performedBy: userId as any,
    });

    return recording;
  }
}
