import { cookies } from "next/headers";
import { JwtHelper } from "../../helpers/jwt";
import { studentRepository } from "../../repositories/student.repository";
import { connectDB } from "../../config/db";

/**
 * Server-side helper to securely extract the authenticated Student model
 * from the request's HTTP-only JWT accessToken cookie.
 */
export async function getAuthenticatedStudent() {
  await connectDB();
  try {
    const cookieStore = await cookies();
    let token = cookieStore.get("accessToken")?.value;
    if (!token) {
      const { headers } = await import("next/headers");
      const headerStore = await headers();
      const authHeader = headerStore.get("authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1];
      }
    }
    if (!token) return null;

    const decoded = JwtHelper.verifyAccess(token);
    if (!decoded || !decoded.userId) return null;

    const student = await studentRepository.findOne({ user: decoded.userId });
    if (!student) return null;

    return JSON.parse(JSON.stringify(student));
  } catch (error) {
    console.error("Error retrieving authenticated student session:", error);
    return null;
  }
}
