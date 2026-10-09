import { AnalyticsDashboard, IAnalyticsDashboard } from "../models/analytics-dashboard.model";
import { BaseRepository } from "./base.repository";

class AnalyticsDashboardRepository extends BaseRepository<IAnalyticsDashboard> {
  constructor() {
    super(AnalyticsDashboard);
  }
}

export const analyticsDashboardRepository = new AnalyticsDashboardRepository();
