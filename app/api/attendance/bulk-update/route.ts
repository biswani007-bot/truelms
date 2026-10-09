
/**
 * @swagger
 * /api/attendance/bulk-update:
 *   post:
 *     summary: Auto-generated summary for POST /api/attendance/bulk-update
 *     tags: [attendance]
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
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { withRoles } from "../../../../middleware/auth.middleware";
import { ResponseHelper } from "../../../../helpers/response";
import { apiHandler } from "../../../../utils/api-handler";
import { connectDB } from "../../../../config/db";
import { AttendanceService } from "../../../../services/attendance/attendance.service";

export const POST = withRoles(
  ["Admin", "Super Admin", "Academic Manager", "Teacher"],
  apiHandler(async (req: NextRequest, userContext: any) => {
    await connectDB();
    const body = await req.json();

    const { liveClass, batch, teacher, records } = body;
    if (!liveClass || !batch || !teacher || !records) {
      return NextResponse.json(ResponseHelper.error("liveClass, batch, teacher, and records are required"), { status: 400 });
    }

    const results = await AttendanceService.bulkMark(liveClass, batch, teacher, records, userContext.userId);

    return NextResponse.json(
      ResponseHelper.success("Bulk attendance updated successfully", results),
      { status: 200 }
    );
  })
);
