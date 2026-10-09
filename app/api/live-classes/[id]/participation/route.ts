/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/config/db";
import { JwtHelper } from "@/helpers/jwt";
import { ParticipationService } from "@/services/live-class/participation.service";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await context.params;

    // 1. Authenticate user from cookie or authorization header
    const token =
      req.cookies.get("accessToken")?.value ||
      req.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const decoded = JwtHelper.verifyAccess(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired session token" },
        { status: 401 }
      );
    }

    const rawRoles = (decoded as any).roles || ((decoded as any).role ? [(decoded as any).role] : []);
    const body = await req.json().catch(() => ({}));

    const result = await ParticipationService.recordParticipation(
      decoded.userId,
      rawRoles,
      id,
      body
    );

    return NextResponse.json({
      success: true,
      message: "Participation recorded successfully",
      data: result,
    });
  } catch (error: any) {
    console.error("Error in live-class participation endpoint:", error);
    const status = error.statusCode || error.status || 500;
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to record live class participation",
      },
      { status }
    );
  }
}
