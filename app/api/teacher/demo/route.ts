import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/config/db";
import { JwtHelper } from "@/helpers/jwt";
import { Teacher } from "@/models/teacher.model";
import { DemoTeacherService } from "@/services/demo/demo-teacher.service";
import { ResponseHelper } from "@/helpers/response";

/**
 * GET /api/teacher/demo
 * Returns DemoSessions authoritatively assigned to the authenticated teacher.
 */
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const token =
      req.cookies.get("accessToken")?.value ||
      req.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(ResponseHelper.error("Authentication required"), { status: 401 });
    }

    const decoded = JwtHelper.verifyAccess(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json(ResponseHelper.error("Invalid or expired session token"), { status: 401 });
    }

    // Resolve Teacher Profile
    const teacher = await Teacher.findOne({
      user: decoded.userId,
      isDeleted: { $ne: true },
    });

    if (!teacher) {
      return NextResponse.json(
        ResponseHelper.error("Faculty profile not found for this account"),
        { status: 403 }
      );
    }

    const demos = await DemoTeacherService.getTeacherAssignedDemos(teacher._id, teacher.user);

    // Attach join eligibility
    const formatted = demos.map((d: any) => {
      const joinStatus = DemoTeacherService.getTeacherDemoJoinStatus(d);
      return {
        _id: d._id,
        demoCode: d.demoCode,
        course: d.course,
        student: d.student,
        parent: d.parent,
        scheduledStart: d.scheduledStart,
        scheduledEnd: d.scheduledEnd,
        duration: d.duration,
        status: d.status,
        meetingPlatform: d.meetingPlatform,
        meetingLink: d.meetingLink,
        joinEligibility: joinStatus,
      };
    });

    return NextResponse.json(
      ResponseHelper.success("Assigned demo sessions fetched successfully", formatted),
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Failed to fetch teacher demo sessions:", error);
    return NextResponse.json(
      ResponseHelper.error(error.message || "Failed to fetch teacher demos"),
      { status: 500 }
    );
  }
}
