import { NextRequest } from "next/server";
import { verifyAuth } from "../../middleware/auth.middleware";
import { Parent, IParent } from "../../models/parent.model";
import { UserPayload } from "../../types";
import { ApiError } from "../../utils/api-error";
import { ERROR_CODES } from "../../constants/error-codes";
import { MESSAGES } from "../../constants/messages";
import mongoose from "mongoose";

import { connectDB } from "../../config/db";

export interface AuthenticatedParentContext {
  user: UserPayload;
  parent: IParent;
}

/**
 * Canonical server-side authentication resolver for Parent accounts.
 * Resolves the authenticated user from the established HTTP-only JWT/session mechanism.
 * Authoritatively verifies:
 * 1. user exists
 * 2. user.role is 'parent' (or authorized administrator)
 * 3. Parent.user === user.userId
 * 4. Parent.status === 'active'
 */
export async function getAuthenticatedParent(req: NextRequest | Request): Promise<AuthenticatedParentContext> {
  await connectDB();
  const user = verifyAuth(req);
  if (!user || !user.userId) {
    throw new ApiError(401, MESSAGES.AUTH.UNAUTHORIZED, ERROR_CODES.AUTH_TOKEN_INVALID);
  }

  const userRole = (user.role || "").toLowerCase().replace(/[-_ ]/g, "");
  if (userRole !== "parent" && userRole !== "admin" && userRole !== "superadmin") {
    throw new ApiError(403, MESSAGES.AUTH.FORBIDDEN, ERROR_CODES.FORBIDDEN);
  }

  if (user.sessionId) {
    const { Session } = await import("../../models/session.model");
    const activeSession = await Session.findOne({ sessionId: user.sessionId, isRevoked: false });
    if (!activeSession) {
      throw new ApiError(401, "Session has been revoked", ERROR_CODES.AUTH_TOKEN_INVALID);
    }
  }

  // Find linked parent document strictly matching user ID and active status
  const parent = await Parent.findOne({
    user: new (mongoose.Types.ObjectId as any)(user.userId),
    status: { $in: ["active", "approved"] },
    isDeleted: { $ne: true },
  });

  if (!parent) {
    throw new ApiError(403, "No active parent profile found for this user account", ERROR_CODES.FORBIDDEN);
  }

  return {
    user,
    parent,
  };
}
