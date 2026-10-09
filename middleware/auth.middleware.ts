import { NextRequest, NextResponse } from "next/server";
import { UserPayload } from "../types";
import { roleRepository } from "../repositories/role.repository";
import { ApiResponse } from "../utils/api-response";
import { JwtHelper } from "../helpers/jwt";
import { ERROR_CODES } from "../constants/error-codes";
import { MESSAGES } from "../constants/messages";

// Extract token and verify
export const verifyAuth = (req: NextRequest | Request): UserPayload | null => {
  let token: string | undefined;

  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  } else if ("cookies" in req && typeof (req as NextRequest).cookies?.get === "function") {
    token = (req as NextRequest).cookies.get("accessToken")?.value;
  } else {
    // Fallback: parse cookie header from standard Request
    const cookieHeader = req.headers.get("cookie");
    if (cookieHeader) {
      const match = cookieHeader.match(/(?:^|;\s*)accessToken=([^;]+)/);
      if (match) {
        token = match[1];
      }
    }
  }

  if (!token) {
    return null;
  }

  return JwtHelper.verifyAccess(token);
};

export const authenticateRequest = async (req: NextRequest | Request): Promise<{ user: UserPayload | null }> => {
  const user = verifyAuth(req);
  return { user };
};

// Route wrapper for requiring authentication
export const withAuth = (
  handler: (req: NextRequest, user: UserPayload, context?: any) => Promise<NextResponse>
) => {
  return async (req: NextRequest, context?: any) => {
    const user = verifyAuth(req);
    if (!user) {
      return NextResponse.json(
        ApiResponse.error(MESSAGES.AUTH.UNAUTHORIZED, ERROR_CODES.AUTH_TOKEN_INVALID),
        { status: 401 }
      );
    }

    if (user.sessionId) {
      const { connectDB } = await import("../config/db");
      await connectDB();
      const { Session } = await import("../models/session.model");
      const sessionDoc = await Session.findOne({ sessionId: user.sessionId, isRevoked: false });
      if (!sessionDoc) {
        return NextResponse.json(
          ApiResponse.error("Session has been revoked", ERROR_CODES.AUTH_TOKEN_INVALID),
          { status: 401 }
        );
      }
    }

    return handler(req, user, context);
  };
};

// Route wrapper for requiring specific roles
export const withRoles = (
  roles: string[],
  handler: (req: NextRequest, user: UserPayload, context?: any) => Promise<NextResponse>
) => {
  return withAuth(async (req, user, context) => {
    const userRole = (user.role || "").toLowerCase().replace(/[-_ ]/g, "");
    const allowedRoles = roles.map((r) => r.toLowerCase().replace(/[-_ ]/g, ""));

    if (!allowedRoles.includes(userRole)) {
      return NextResponse.json(
        ApiResponse.error(MESSAGES.AUTH.FORBIDDEN, ERROR_CODES.FORBIDDEN),
        { status: 403 }
      );
    }
    return handler(req, user, context);
  });
};

// Route wrapper for requiring specific permissions
export const withPermissions = (
  permissions: string[],
  handler: (req: NextRequest, user: UserPayload, context?: any) => Promise<NextResponse>
) => {
  return withAuth(async (req, user, context) => {
    const roleDoc = await roleRepository.findRoleByName(user.role);
    if (!roleDoc) {
      return NextResponse.json(
        ApiResponse.error("Role not found", ERROR_CODES.FORBIDDEN),
        { status: 403 }
      );
    }

    const userPermissions = (roleDoc.permissions as { name: string }[]).map(
      (p) => p.name
    );

    const hasAll = permissions.every((perm) => userPermissions.includes(perm));

    if (!hasAll) {
      return NextResponse.json(
        ApiResponse.error("Not authorized, insufficient permissions", ERROR_CODES.FORBIDDEN),
        { status: 403 }
      );
    }

    return handler(req, user, context);
  });
};
