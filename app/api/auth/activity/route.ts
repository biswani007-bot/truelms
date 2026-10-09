import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../../../../config/db";
import { ResponseHelper } from "../../../../helpers/response";
import { apiHandler } from "../../../../utils/api-handler";
import { verifyAuth } from "../../../../middleware/auth.middleware";
import { ActivityLog } from "../../../../models/activity-log.model";
import { Session } from "../../../../models/session.model";
import { ApiError } from "../../../../utils/api-error";
import { ERROR_CODES } from "../../../../constants/error-codes";

export const GET = apiHandler(async (req: NextRequest) => {
  await connectDB();
  const user = await verifyAuth(req);
  if (!user) {
    throw new ApiError(401, "Unauthorized", ERROR_CODES.AUTH_TOKEN_INVALID);
  }

  if (user.sessionId) {
    const activeSession = await Session.findOne({ sessionId: user.sessionId, isRevoked: false });
    if (!activeSession) {
      throw new ApiError(401, "Session has been revoked", ERROR_CODES.AUTH_TOKEN_INVALID);
    }
  }

  const logs = await ActivityLog.find({ user: user.userId })
    .sort({ createdAt: -1 })
    .limit(50);

  return NextResponse.json(
    ResponseHelper.success("Activity logs retrieved", logs),
    { status: 200 }
  );
});
