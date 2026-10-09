import { cookies } from "next/headers";
import { JwtHelper } from "../../helpers/jwt";
import { teacherRepository } from "../../repositories/teacher.repository";
import { connectDB } from "../../config/db";

/**
 * Server-side helper to securely extract the authenticated Teacher model
 * from the request's HTTP-only JWT accessToken cookie.
 */
export async function getAuthenticatedTeacher() {
  await connectDB();
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("accessToken")?.value;
    if (!token) return null;

    const decoded = JwtHelper.verifyAccess(token);
    if (!decoded || !decoded.userId) return null;

    if (decoded.sessionId) {
      const { Session } = await import("../../models/session.model");
      const activeSession = await Session.findOne({ sessionId: decoded.sessionId, isRevoked: false });
      if (!activeSession) return null;
    }

    const teacher = await teacherRepository.findOne({ user: decoded.userId });
    if (!teacher) return null;

    return JSON.parse(JSON.stringify(teacher));
  } catch (error) {
    console.error("Error retrieving authenticated teacher session:", error);
    return null;
  }
}
