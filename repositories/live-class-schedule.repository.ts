import { LiveClassSchedule, ILiveClassSchedule } from "../models/live-class-schedule.model";
import { BaseRepository } from "./base.repository";

class LiveClassScheduleRepository extends BaseRepository<ILiveClassSchedule> {
  constructor() {
    super(LiveClassSchedule);
  }
}

export const liveClassScheduleRepository = new LiveClassScheduleRepository();
