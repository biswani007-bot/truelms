import { AnalyticsWidget, IAnalyticsWidget } from "../models/analytics-widget.model";
import { BaseRepository } from "./base.repository";

class AnalyticsWidgetRepository extends BaseRepository<IAnalyticsWidget> {
  constructor() {
    super(AnalyticsWidget);
  }
}

export const analyticsWidgetRepository = new AnalyticsWidgetRepository();
