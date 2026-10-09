import { Media, IMedia } from "../models/media.model";
import { BaseRepository } from "./base.repository";

export class MediaRepository extends BaseRepository<IMedia> {
  constructor() {
    super(Media);
  }
}

export const mediaRepository = new MediaRepository();
