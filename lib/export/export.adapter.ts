/**
 * Export Adapter Interface
 *
 * Defines the contract for all export format implementations.
 * CSV and JSON are implemented. Excel and PDF are stubs for future versions.
 */

export interface IExportColumn {
  key: string;
  label: string;
  format?: (value: unknown) => string;
}

export interface IExportOptions {
  filename?: string;
  includeHeaders?: boolean;
  delimiter?: string;
}

// ─── Adapter Interface ───────────────────────────────────────────────────────

export interface IExportAdapter {
  export(
    data: Record<string, unknown>[],
    columns: IExportColumn[],
    options?: IExportOptions
  ): Promise<string | Buffer>;

  getMimeType(): string;
  getFileExtension(): string;
}

// ─── CSV Adapter ─────────────────────────────────────────────────────────────

export class CsvExportAdapter implements IExportAdapter {
  getMimeType(): string {
    return "text/csv";
  }

  getFileExtension(): string {
    return "csv";
  }

  async export(
    data: Record<string, unknown>[],
    columns: IExportColumn[],
    options: IExportOptions = {}
  ): Promise<string> {
    const delimiter = options.delimiter || ",";
    const rows: string[] = [];

    // Headers
    if (options.includeHeaders !== false) {
      rows.push(columns.map(c => `"${c.label}"`).join(delimiter));
    }

    // Data rows
    for (const row of data) {
      const values = columns.map(col => {
        const val = row[col.key];
        const formatted = col.format ? col.format(val) : String(val ?? "");
        return `"${formatted.replace(/"/g, '""')}"`;
      });
      rows.push(values.join(delimiter));
    }

    return rows.join("\n");
  }
}

// ─── JSON Adapter ─────────────────────────────────────────────────────────────

export class JsonExportAdapter implements IExportAdapter {
  getMimeType(): string {
    return "application/json";
  }

  getFileExtension(): string {
    return "json";
  }

  async export(
    data: Record<string, unknown>[],
    columns: IExportColumn[]
  ): Promise<string> {
    const filtered = data.map(row => {
      const output: Record<string, unknown> = {};
      for (const col of columns) {
        output[col.label] = col.format ? col.format(row[col.key]) : row[col.key];
      }
      return output;
    });

    return JSON.stringify(filtered, null, 2);
  }
}

// ─── Excel Adapter Stub (Future Version) ────────────────────────────────────

export class ExcelExportAdapter implements IExportAdapter {
  getMimeType(): string {
    return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  }

  getFileExtension(): string {
    return "xlsx";
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async export(_data: Record<string, unknown>[], _columns: IExportColumn[]): Promise<Buffer> {
    throw new Error("Excel export is not yet implemented. Use CSV or JSON.");
  }
}

// ─── PDF Adapter Stub (Future Version) ───────────────────────────────────────

export class PdfExportAdapter implements IExportAdapter {
  getMimeType(): string {
    return "application/pdf";
  }

  getFileExtension(): string {
    return "pdf";
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async export(_data: Record<string, unknown>[], _columns: IExportColumn[]): Promise<Buffer> {
    throw new Error("PDF export is not yet implemented.");
  }
}

// ─── Adapter Factory ─────────────────────────────────────────────────────────

export function createExportAdapter(format: string): IExportAdapter {
  switch (format) {
    case "csv":
      return new CsvExportAdapter();
    case "json":
      return new JsonExportAdapter();
    case "excel":
      return new ExcelExportAdapter();
    case "pdf":
      return new PdfExportAdapter();
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
}
