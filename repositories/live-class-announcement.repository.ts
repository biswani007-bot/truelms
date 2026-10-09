import { LiveClassAnnouncement, ILiveClassAnnouncement } from "../models/live-class-announcement.model";
import { BaseRepository } from "./base.repository";

class LiveClassAnnouncementRepository extends BaseRepository<ILiveClassAnnouncement> {
  constructor() {
    super(LiveClassAnnouncement);
  }
}

export const liveClassAnnouncementRepository = new LiveClassAnnouncementRepository();
