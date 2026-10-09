import { LiveClass, ILiveClass } from "../models/live-class.model";
import { BaseRepository } from "./base.repository";

class LiveClassRepository extends BaseRepository<ILiveClass> {
  constructor() {
    super(LiveClass);
  }
}

export const liveClassRepository = new LiveClassRepository();
