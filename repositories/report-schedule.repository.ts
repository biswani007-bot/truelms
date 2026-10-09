import { ReportSchedule, IReportSchedule } from "../models/report-schedule.model";
import { BaseRepository } from "./base.repository";

class ReportScheduleRepository extends BaseRepository<IReportSchedule> {
  constructor() {
    super(ReportSchedule);
  }
}

export const reportScheduleRepository = new ReportScheduleRepository();
