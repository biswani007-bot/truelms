/* eslint-disable @typescript-eslint/no-explicit-any */
import { reportDefinitionRepository } from "../../repositories/report-definition.repository";
import { reportExecutionRepository } from "../../repositories/report-execution.repository";
import { ReportDefinition } from "../../models/report-definition.model";
import { ReportExecution } from "../../models/report-execution.model";
import { PaginationInput } from "../../dtos/pagination.dto";

export class ReportService {
  // ─── Definitions ────────────────────────────────────────────────────────────

  static async listDefinitions(paginationInput: PaginationInput) {
    return reportDefinitionRepository.paginate(
      paginationInput,
      ["name", "slug", "category"],
      { populate: ["owner"] }
    );
  }

  static async findDefinition(id: string) {
    return reportDefinitionRepository.findById(id, { populate: ["owner"] });
  }

  static async createDefinition(data: {
    name: string;
    slug: string;
    category: string;
    description?: string;
    reportType?: string;
    chartType?: string;
    visibility?: string;
    filters?: Record<string, unknown>;
    tags?: string[];
  }, userId?: string) {
    const existing = await reportDefinitionRepository.findOne({ slug: data.slug });
    if (existing) throw new Error(`Report with slug "${data.slug}" already exists`);

    return ReportDefinition.create({
      ...data,
      owner: userId as any,
      isScheduled: false,
      runCount: 0,
    });
  }

  static async updateDefinition(id: string, data: Partial<{
    name: string;
    description: string;
    reportType: string;
    chartType: string;
    visibility: string;
    filters: Record<string, unknown>;
    tags: string[];
  }>) {
    const def = await reportDefinitionRepository.findById(id);
    if (!def) throw new Error("Report definition not found");
    return reportDefinitionRepository.update(id, data as any);
  }

  static async deleteDefinition(id: string) {
    return reportDefinitionRepository.softDelete(id);
  }

  // ─── Executions ─────────────────────────────────────────────────────────────

  static async runReport(reportDefinitionId: string, appliedFilters: Record<string, unknown> = {}, userId?: string) {
    const def = await reportDefinitionRepository.findById(reportDefinitionId);
    if (!def) throw new Error("Report definition not found");

    const startTime = Date.now();

    const execution = await ReportExecution.create({
      reportDefinition: reportDefinitionId as any,
      executedBy: userId as any,
      appliedFilters,
      status: "completed",
      rowCount: 0,
      executionMs: Date.now() - startTime,
    });

    // Increment run count
    await reportDefinitionRepository.update(reportDefinitionId, {
      runCount: (def.runCount || 0) + 1,
      lastRunAt: new Date(),
    } as any);

    return execution;
  }

  static async listExecutions(reportDefinitionId?: string) {
    const filter: any = {};
    if (reportDefinitionId) filter.reportDefinition = reportDefinitionId;
    return reportExecutionRepository.findMany(filter, {
      populate: ["reportDefinition", "executedBy"],
    });
  }
}
