import { ReportDefinition, IReportDefinition } from "../models/report-definition.model";
import { BaseRepository } from "./base.repository";

class ReportDefinitionRepository extends BaseRepository<IReportDefinition> {
  constructor() {
    super(ReportDefinition);
  }
}

export const reportDefinitionRepository = new ReportDefinitionRepository();
