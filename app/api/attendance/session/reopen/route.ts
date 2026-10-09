
/**
 * @swagger
 * /api/attendance/session/reopen:
 *   post:
 *     summary: Auto-generated summary for POST /api/attendance/session/reopen
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
import { withRoles } from "../../../../../middleware/auth.middleware";
import { ResponseHelper } from "../../../../../helpers/response";
import { apiHandler } from "../../../../../utils/api-handler";
import { connectDB } from "../../../../../config/db";
import { AttendanceSessionService } from "../../../../../services/attendance/attendance-session.service";

export const POST = withRoles(
  ["Admin", "Super Admin", "Academic Manager"],
  apiHandler(async (req: NextRequest, userContext: any) => {
    await connectDB();
    const body = await req.json();

    const { liveClass, batch } = body;
    if (!liveClass || !batch) {
      return NextResponse.json(ResponseHelper.error("liveClass and batch are required"), { status: 400 });
    }

    const session = await AttendanceSessionService.reopenSession(liveClass, batch, userContext.userId);

    return NextResponse.json(ResponseHelper.success("Attendance session re-opened successfully", session), { status: 200 });
  })
);
