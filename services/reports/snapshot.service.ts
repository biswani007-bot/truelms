/* eslint-disable @typescript-eslint/no-explicit-any */
import { reportSnapshotRepository } from "../../repositories/report-snapshot.repository";
import { ReportSnapshot } from "../../models/report-snapshot.model";
import { AnalyticsService } from "./analytics.service";
import { PaginationInput } from "../../dtos/pagination.dto";

export class SnapshotService {
  /**
   * Capture a daily KPI snapshot for a given date.
   */
  static async generateDailySnapshot(date: Date, userId?: string) {
    const summary = await AnalyticsService.getExecutiveSummary();
    const dateStr = date.toISOString().split("T")[0];

    const existing = await reportSnapshotRepository.findOne({
      snapshotType: "daily",
      name: `Daily Snapshot – ${dateStr}`,
    });
    if (existing) throw new Error(`Daily snapshot for ${dateStr} already exists`);

    return ReportSnapshot.create({
      name: `Daily Snapshot – ${dateStr}`,
      snapshotType: "daily",
      referenceDate: date,
      data: summary as any,
      generatedBy: userId as any,
    });
  }

  /**
   * Capture a monthly rollup snapshot.
   */
  static async generateMonthlySnapshot(year: number, month: number, userId?: string) {
    const summary = await AnalyticsService.getExecutiveSummary();
    const label = `${year}-${String(month).padStart(2, "0")}`;

    const existing = await reportSnapshotRepository.findOne({
      snapshotType: "monthly",
      name: `Monthly Snapshot – ${label}`,
    });
    if (existing) throw new Error(`Monthly snapshot for ${label} already exists`);

    return ReportSnapshot.create({
      name: `Monthly Snapshot – ${label}`,
      snapshotType: "monthly",
      referenceDate: new Date(year, month - 1, 1),
      data: summary as any,
      generatedBy: userId as any,
    });
  }

  /**
   * Capture an academic session snapshot.
   */
  static async generateSessionSnapshot(sessionName: string, userId?: string) {
    const [summary, admissions, academic] = await Promise.all([
      AnalyticsService.getExecutiveSummary(),
      AnalyticsService.getAdmissionsKPIs(),
      AnalyticsService.getAcademicKPIs(),
    ]);

    return ReportSnapshot.create({
      name: `Session Snapshot – ${sessionName}`,
      snapshotType: "session",
      referenceDate: new Date(),
      academicSession: sessionName,
      data: { summary, admissions, academic } as any,
      generatedBy: userId as any,
    });
  }

  /**
   * Capture a financial period snapshot.
   */
  static async generateFinancialSnapshot(period: string, userId?: string) {
    const finance = await AnalyticsService.getFinanceKPIs();

    return ReportSnapshot.create({
      name: `Financial Snapshot – ${period}`,
      snapshotType: "financial",
      referenceDate: new Date(),
      data: finance as any,
      generatedBy: userId as any,
    });
  }

  /**
   * List snapshots with pagination and filters.
   */
  static async listSnapshots(paginationInput: PaginationInput) {
    return reportSnapshotRepository.paginate(
      paginationInput,
      ["name", "academicSession"],
      { populate: ["generatedBy"] }
    );
  }

  static async findSnapshot(id: string) {
    return reportSnapshotRepository.findById(id, { populate: ["generatedBy"] });
  }
}
