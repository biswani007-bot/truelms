
/**
 * @swagger
 * /api/reports/export:
 *   post:
 *     summary: Auto-generated summary for POST /api/reports/export
 *     tags: [reports]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 */
import { NextRequest, NextResponse } from "next/server";
import { withRoles } from "../../../../middleware/auth.middleware";
import { ResponseHelper } from "../../../../helpers/response";
import { connectDB } from "../../../../config/db";
import { ExportService } from "../../../../services/reports/export.service";

export const POST = withRoles(
  ["super-admin", "admin", "academic-manager", "finance-manager"],
  async (req: NextRequest) => {
    await connectDB();
    const body = await req.json();
    const { data = [], columns = [], format = "csv", filename } = body;

    if (!Array.isArray(data)) {
      return NextResponse.json(
        ResponseHelper.error("data must be an array"),
        { status: 400 }
      );
    }

    // Auto-generate columns if not provided
    const resolvedColumns =
      columns.length > 0
        ? columns
        : data.length > 0
        ? ExportService.autoColumns(data[0])
        : [];

    const result = await ExportService.export(data, resolvedColumns, format, { filename });

    return NextResponse.json(
      ResponseHelper.success("Export generated", {
        content: result.content,
        mimeType: result.mimeType,
        filename: result.filename,
        extension: result.extension,
        rowCount: result.rowCount,
      })
    );
  }
);
