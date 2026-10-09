import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/config/db";
import { JwtHelper } from "@/helpers/jwt";
import { teacherRepository } from "@/repositories/teacher.repository";
import { DemoTeacherService } from "@/services/demo/demo-teacher.service";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id: demoId } = await context.params;

    // 1. Authenticate user from cookie or bearer token
    const token =
      req.cookies.get("accessToken")?.value ||
      req.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const decoded = JwtHelper.verifyAccess(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: "Invalid or expired session token" }, { status: 401 });
    }

    // 2. Verify Teacher or Admin role
    const rawRoles = (decoded as any).roles || ((decoded as any).role ? [(decoded as any).role] : []);
    const roles = rawRoles.map((r: string) => (r || "").toLowerCase());
    const isTeacher = roles.some((r: string) =>
      ["teacher", "instructor", "faculty", "coach"].includes(r)
    );
    const isAdmin = roles.some((r: string) =>
      ["admin", "superadmin", "super-admin", "academic-manager", "operations-manager"].includes(r)
    );

    if (!isTeacher && !isAdmin) {
      return NextResponse.json(
        { error: "Access Denied: Only assigned instructors can request a demo conduction token." },
        { status: 403 }
      );
    }

    // 3. Resolve Teacher Profile
    let teacher: any = await teacherRepository.findOne({ user: decoded.userId });
    if (!teacher && isAdmin) {
      // Allow administrator override to conduct or observe
      teacher = {
        _id: decoded.userId,
        user: decoded.userId,
        firstName: "Administrator",
        lastName: "",
        email: (decoded as any).email || "admin@truelern.com",
      };
    }

    if (!teacher) {
      return NextResponse.json(
        { error: "Access Denied: Faculty profile not found." },
        { status: 403 }
      );
    }

    // 4. Authorize teacher, check T-15 join window, and generate token
    const { tokenPayload, demo } = await DemoTeacherService.generateTeacherDemoToken(
      teacher,
      demoId
    );

    return NextResponse.json({
      success: true,
      data: {
        ...tokenPayload,
        demoSession: {
          id: demo._id,
          demoCode: demo.demoCode,
          childName: demo.student
            ? `${(demo.student as any).firstName || ""} ${(demo.student as any).lastName || ""}`.trim()
            : "Student",
          courseTitle: (demo.course as any)?.courseName || demo.interestedCourse || "Demo Program",
          scheduledStart: demo.scheduledStart,
          scheduledEnd: demo.scheduledEnd,
          duration: demo.duration,
          status: demo.status,
        },
      },
    });
  } catch (error: any) {
    console.error("Failed to generate teacher demo token:", error);
    const status = error.statusCode || error.status || 500;
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status }
    );
  }
}
