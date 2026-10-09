/* eslint-disable @typescript-eslint/no-explicit-any */
import { createExportAdapter, IExportColumn } from "../../lib/export/export.adapter";

export class ExportService {
  /**
   * Export an array of data records to the requested format.
   * @param data - Array of plain objects
   * @param columns - Column definitions (key, label, optional format fn)
   * @param format - "csv" | "json" | "excel" | "pdf"
   */
  static async export(
    data: Record<string, unknown>[],
    columns: IExportColumn[],
    format: "csv" | "json" | "excel" | "pdf" = "csv",
    options: { filename?: string; delimiter?: string } = {}
  ) {
    const adapter = createExportAdapter(format);
    const content = await adapter.export(data, columns, options);

    return {
      content,
      mimeType: adapter.getMimeType(),
      extension: adapter.getFileExtension(),
      filename: options.filename
        ? `${options.filename}.${adapter.getFileExtension()}`
        : `export-${Date.now()}.${adapter.getFileExtension()}`,
      rowCount: data.length,
    };
  }

  /**
   * Helper: Flatten a nested object into dot-notation keys
   */
  static flattenRecord(obj: Record<string, unknown>, prefix = ""): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      const newKey = prefix ? `${prefix}.${key}` : key;
      if (value !== null && typeof value === "object" && !Array.isArray(value) && !(value instanceof Date)) {
        Object.assign(result, ExportService.flattenRecord(value as Record<string, unknown>, newKey));
      } else {
        result[newKey] = value;
      }
    }
    return result;
  }

  /**
   * Auto-generate column definitions from a sample record.
   */
  static autoColumns(sampleRecord: Record<string, unknown>): IExportColumn[] {
    return Object.keys(sampleRecord).map(key => ({
      key,
      label: key
        .replace(/([A-Z])/g, " $1")
        .replace(/[._]/g, " ")
        .trim()
        .replace(/\b\w/g, c => c.toUpperCase()),
    }));
  }
}
