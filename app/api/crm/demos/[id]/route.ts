import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { withRoles } from "@/middleware/auth.middleware";
import { apiHandler } from "@/utils/api-handler";
import { connectDB } from "@/config/db";
import { DemoSession } from "@/models/demo-session.model";
import { DemoTeacherService } from "@/services/demo/demo-teacher.service";
import { ResponseHelper } from "@/helpers/response";

/**
 * GET /api/crm/demos/[id]
 * Fetches DemoSession details along with the course's configured faculty and their real-time availability.
 */
export const GET = withRoles(
  ["Admin", "Super Admin", "Academic Manager", "operations-manager"],
  apiHandler(async (req: NextRequest, authUser: any, segmentData: any) => {
    await connectDB();
    const params = await segmentData.params;
    const { id } = params;

    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json(ResponseHelper.error("Invalid Demo ID"), { status: 400 });
    }

    const demo = await DemoSession.findById(id)
      .populate("course", "courseName courseCode slug demoFaculty")
      .populate("parent", "firstName lastName email phone")
      .populate("student", "firstName lastName studentId studentCode")
      .populate("lead", "fullName email phone status")
      .populate("teacher", "firstName lastName email teacherCode employeeId status");

    if (!demo || demo.isDeleted) {
      return NextResponse.json(ResponseHelper.error("Demo session not found"), { status: 404 });
    }

    let facultyAvailability: any[] = [];
    if (demo.course?._id) {
      facultyAvailability = await DemoTeacherService.getCourseFacultyAvailability(
        demo.course._id,
        demo.scheduledStart,
        demo.scheduledEnd,
        demo._id
      );
    }

    return NextResponse.json(
      ResponseHelper.success("Demo details fetched successfully", {
        demo,
        facultyAvailability,
      }),
      { status: 200 }
    );
  })
);

/**
 * PATCH /api/crm/demos/[id]
 * Assigns or reassigns an eligible teacher to this DemoSession.
 * Validates teacher eligibility, active status, and availability/conflict.
 */
export const PATCH = withRoles(
  ["Admin", "Super Admin", "Academic Manager", "operations-manager"],
  apiHandler(async (req: NextRequest, authUser: any, segmentData: any) => {
    await connectDB();
    const params = await segmentData.params;
    const { id } = params;

    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json(ResponseHelper.error("Invalid Demo ID"), { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const { teacherId, reason, isReassignment } = body;

    if (!teacherId || !mongoose.isValidObjectId(teacherId)) {
      return NextResponse.json(
        ResponseHelper.error("Valid teacherId is required for assignment"),
        { status: 400 }
      );
    }

    const updatedDemo = await DemoTeacherService.assignOrReassignDemoTeacher(
      id,
      teacherId,
      authUser.userId || authUser.id || "",
      reason,
      Boolean(isReassignment)
    );

    return NextResponse.json(
      ResponseHelper.success(
        isReassignment ? "Teacher reassigned successfully" : "Teacher assigned successfully",
        updatedDemo
      ),
      { status: 200 }
    );
  })
);
