import { ReportExecution, IReportExecution } from "../models/report-execution.model";
import { BaseRepository } from "./base.repository";

class ReportExecutionRepository extends BaseRepository<IReportExecution> {
  constructor() {
    super(ReportExecution);
  }
}

export const reportExecutionRepository = new ReportExecutionRepository();
