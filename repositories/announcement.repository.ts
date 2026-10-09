import { Announcement, IAnnouncement } from "../models/announcement.model";
import { BaseRepository } from "./base.repository";

export class AnnouncementRepository extends BaseRepository<IAnnouncement> {
  constructor() {
    super(Announcement);
  }
}

export const announcementRepository = new AnnouncementRepository();
