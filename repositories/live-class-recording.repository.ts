import { LiveClassRecording, ILiveClassRecording } from "../models/live-class-recording.model";
import { BaseRepository } from "./base.repository";

class LiveClassRecordingRepository extends BaseRepository<ILiveClassRecording> {
  constructor() {
    super(LiveClassRecording);
  }
}

export const liveClassRecordingRepository = new LiveClassRecordingRepository();
