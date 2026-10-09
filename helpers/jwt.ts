/* eslint-disable @typescript-eslint/no-explicit-any */
import jwt from "jsonwebtoken";
import { jwtVerify } from "jose";
import { env } from "../config/env";
import { UserPayload } from "../types";

export class JwtHelper {
  static signAccess(payload: { userId: string; role: string; sessionId?: string }): string {
    return jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as any,
    });
  }

  static signRefresh(payload: { userId: string, sessionId?: string }): string {
    return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN as any,
    });
  }

  static verifyAccess(token: string): UserPayload | null {
    try {
      return jwt.verify(token, env.JWT_SECRET) as UserPayload;
    } catch {
      return null;
    }
  }

  static verifyRefresh(token: string): { userId: string, sessionId?: string } | null {
    try {
      return jwt.verify(token, env.JWT_REFRESH_SECRET) as { userId: string, sessionId?: string };
    } catch {
      return null;
    }
  }

  // Edge runtime verification using jose
  static async verifyAccessEdge(token: string): Promise<UserPayload | null> {
    try {
      const secret = new TextEncoder().encode(env.JWT_SECRET);
      const { payload } = await jwtVerify(token, secret);
      return payload as unknown as UserPayload;
    } catch {
      return null;
    }
  }
}
