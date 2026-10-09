import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../../../../config/db";
import { ResponseHelper } from "../../../../helpers/response";
import { apiHandler } from "../../../../utils/api-handler";
import { MESSAGES } from "../../../../constants/messages";
import { verifyAuth } from "../../../../middleware/auth.middleware";
import { Session } from "../../../../models/session.model";
import { ApiError } from "../../../../utils/api-error";
import { ERROR_CODES } from "../../../../constants/error-codes";

export const GET = apiHandler(async (req: NextRequest) => {
  await connectDB();
  const user = await verifyAuth(req);
  if (!user) {
    throw new ApiError(401, MESSAGES.AUTH.UNAUTHORIZED, ERROR_CODES.AUTH_TOKEN_INVALID);
  }

  if (user.sessionId) {
    const activeSession = await Session.findOne({ sessionId: user.sessionId, isRevoked: false });
    if (!activeSession) {
      throw new ApiError(401, "Session has been revoked", ERROR_CODES.AUTH_TOKEN_INVALID);
    }
  }

  // Fetch active sessions for the authenticated user only
  const sessions = await Session.find({ user: user.userId, isRevoked: false })
    .select("-refreshTokenHash")
    .sort({ lastSeenAt: -1 });

  const sessionList = sessions.map((s) => {
    const sObj = s.toObject();
    return {
      ...sObj,
      isCurrent: user.sessionId ? s.sessionId === user.sessionId : false,
    };
  });

  return NextResponse.json(
    ResponseHelper.success("Devices retrieved successfully", sessionList),
    { status: 200 }
  );
});

export const DELETE = apiHandler(async (req: NextRequest) => {
  await connectDB();
  const user = await verifyAuth(req);
  if (!user) {
    throw new ApiError(401, MESSAGES.AUTH.UNAUTHORIZED, ERROR_CODES.AUTH_TOKEN_INVALID);
  }

  if (user.sessionId) {
    const activeSession = await Session.findOne({ sessionId: user.sessionId, isRevoked: false });
    if (!activeSession) {
      throw new ApiError(401, "Session has been revoked", ERROR_CODES.AUTH_TOKEN_INVALID);
    }
  }

  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");

  if (!sessionId) {
    throw new ApiError(400, "Session ID is required", ERROR_CODES.VALIDATION_ERROR);
  }

  const session = await Session.findOne({ sessionId, user: user.userId });
  if (!session) {
    throw new ApiError(404, "Session not found", ERROR_CODES.NOT_FOUND);
  }

  session.isRevoked = true;
  session.revokedAt = new Date();
  await session.save();

  return NextResponse.json(
    ResponseHelper.success("Device revoked successfully", null),
    { status: 200 }
  );
});
