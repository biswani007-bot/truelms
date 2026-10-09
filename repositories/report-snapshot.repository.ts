import { ReportSnapshot, IReportSnapshot } from "../models/report-snapshot.model";
import { BaseRepository } from "./base.repository";

class ReportSnapshotRepository extends BaseRepository<IReportSnapshot> {
  constructor() {
    super(ReportSnapshot);
  }
}

export const reportSnapshotRepository = new ReportSnapshotRepository();
