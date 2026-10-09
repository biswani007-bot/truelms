import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../../../../../../config/db";
import mongoose from "mongoose";
import { JwtHelper } from "../../../../../../helpers/jwt";
import { DemoSession } from "../../../../../../models/demo-session.model";
import { Lead } from "../../../../../../models/lead.model";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id: demoId } = await context.params;

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

    const rawRoles = (decoded as any).roles || ((decoded as any).role ? [(decoded as any).role] : []);
    const roles = rawRoles.map((r: string) => (r || "").toLowerCase());
    const isAdmin = roles.some((r: string) => ["admin", "superadmin", "super admin", "academic manager", "academic-manager", "sales counsellor", "sales counselor", "operations-manager"].includes(r));
    const isTeacher = roles.some((r: string) => ["teacher", "faculty", "instructor"].includes(r));

    if (!isAdmin && !isTeacher) {
      return NextResponse.json({ error: "Access Denied: Only staff can mark a demo as completed." }, { status: 403 });
    }

    const { DemoCompletionService } = await import("@/services/demo/demo-completion.service");
    const result = await DemoCompletionService.completeDemoSession(demoId, decoded.userId, {
      reason: "Marked completed by authorized staff",
    });

    return NextResponse.json({ success: true, data: result.demo });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: error.statusCode || 500 });
  }
}
