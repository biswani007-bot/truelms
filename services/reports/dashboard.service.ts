/* eslint-disable @typescript-eslint/no-explicit-any */
import { analyticsDashboardRepository } from "../../repositories/analytics-dashboard.repository";
import { analyticsWidgetRepository } from "../../repositories/analytics-widget.repository";
import { AnalyticsDashboard } from "../../models/analytics-dashboard.model";
import { AnalyticsWidget } from "../../models/analytics-widget.model";
import { PaginationInput } from "../../dtos/pagination.dto";

export class DashboardService {
  // ─── Dashboards ─────────────────────────────────────────────────────────────

  static async listDashboards(paginationInput: PaginationInput) {
    return analyticsDashboardRepository.paginate(
      paginationInput,
      ["name", "slug"],
      { populate: ["widgets", "owner"] }
    );
  }

  static async findDashboard(id: string) {
    return analyticsDashboardRepository.findById(id, { populate: ["widgets"] });
  }

  static async createDashboard(data: {
    name: string;
    slug: string;
    description?: string;
    visibility?: string;
    isDefault?: boolean;
    layout?: Record<string, unknown>;
  }, userId?: string) {
    const existing = await analyticsDashboardRepository.findOne({ slug: data.slug });
    if (existing) throw new Error(`Dashboard with slug "${data.slug}" already exists`);

    return AnalyticsDashboard.create({
      ...data,
      owner: userId as any,
      widgets: [],
    });
  }

  static async updateDashboard(id: string, data: Partial<{
    name: string;
    description: string;
    visibility: string;
    isDefault: boolean;
    layout: Record<string, unknown>;
  }>) {
    const dashboard = await analyticsDashboardRepository.findById(id);
    if (!dashboard) throw new Error("Dashboard not found");
    return analyticsDashboardRepository.update(id, data as any);
  }

  static async deleteDashboard(id: string) {
    return analyticsDashboardRepository.softDelete(id);
  }

  static async addWidget(dashboardId: string, widgetId: string) {
    const dashboard = await analyticsDashboardRepository.findById(dashboardId, { lean: false });
    if (!dashboard) throw new Error("Dashboard not found");

    const widget = await analyticsWidgetRepository.findById(widgetId);
    if (!widget) throw new Error("Widget not found");

    const currentWidgets = (dashboard as any).widgets as any[];
    const alreadyAdded = currentWidgets.some(
      (w: any) => w.toString() === widgetId
    );
    if (alreadyAdded) throw new Error("Widget already added to this dashboard");

    return analyticsDashboardRepository.update(dashboardId, {
      widgets: [...currentWidgets, widgetId],
    } as any);
  }

  static async removeWidget(dashboardId: string, widgetId: string) {
    const dashboard = await analyticsDashboardRepository.findById(dashboardId, { lean: false });
    if (!dashboard) throw new Error("Dashboard not found");

    const currentWidgets = ((dashboard as any).widgets as any[]).filter(
      (w: any) => w.toString() !== widgetId
    );

    return analyticsDashboardRepository.update(dashboardId, {
      widgets: currentWidgets,
    } as any);
  }

  // ─── Widgets ─────────────────────────────────────────────────────────────────

  static async listWidgets(paginationInput: PaginationInput) {
    return analyticsWidgetRepository.paginate(
      paginationInput,
      ["name", "dataKey"]
    );
  }

  static async findWidget(id: string) {
    return analyticsWidgetRepository.findById(id);
  }

  static async createWidget(data: {
    name: string;
    dataKey: string;
    widgetType: string;
    category: string;
    description?: string;
    config?: Record<string, unknown>;
    visibility?: string;
    order?: number;
  }) {
    const existing = await analyticsWidgetRepository.findOne({ dataKey: data.dataKey });
    if (existing) throw new Error(`Widget with dataKey "${data.dataKey}" already exists`);

    return AnalyticsWidget.create({
      ...data,
      isSystem: false,
    });
  }

  static async updateWidget(id: string, data: Partial<{
    name: string;
    description: string;
    config: Record<string, unknown>;
    visibility: string;
    order: number;
  }>) {
    const widget = await analyticsWidgetRepository.findById(id);
    if (!widget) throw new Error("Widget not found");
    if (widget.isSystem) throw new Error("System widgets cannot be modified");
    return analyticsWidgetRepository.update(id, data as any);
  }

  static async deleteWidget(id: string) {
    const widget = await analyticsWidgetRepository.findById(id);
    if (!widget) throw new Error("Widget not found");
    if (widget.isSystem) throw new Error("System widgets cannot be deleted");
    return analyticsWidgetRepository.softDelete(id);
  }
}
