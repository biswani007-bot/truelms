import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../../../../../config/db";
import { JwtHelper } from "../../../../../helpers/jwt";
import { LiveClassAccessOverride } from "../../../../../models/live-class-access-override.model";
import { LiveClassTimeline } from "../../../../../models/live-class-timeline.model";
import { liveClassRepository } from "../../../../../repositories/live-class.repository";
import { studentRepository } from "../../../../../repositories/student.repository";
import mongoose from "mongoose";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id: classId } = await context.params;
    const body = await req.json();
    const { studentId, reason, expiresAt } = body;

    if (!studentId || !mongoose.isValidObjectId(studentId)) {
      return NextResponse.json({ error: "Valid studentId is required" }, { status: 400 });
    }

    const token = req.cookies.get("accessToken")?.value || req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

    const decoded = JwtHelper.verifyAccess(token);
    if (!decoded || !decoded.userId) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const roles = (decoded as any).roles || ((decoded as any).role ? [(decoded as any).role] : []);
    const normalizedRoles = roles.map((r: string) => (r || "").toLowerCase());
    const isAdmin = normalizedRoles.some((r: string) => ["admin", "superadmin", "academic-manager", "operations-manager"].includes(r));

    if (!isAdmin) {
      return NextResponse.json({ error: "Access Denied: Only administrators can grant late-join overrides." }, { status: 403 });
    }

    const liveClass = await liveClassRepository.findById(classId);
    if (!liveClass) return NextResponse.json({ error: "Live class not found" }, { status: 404 });

    const student = await studentRepository.findById(studentId);
    if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });

    const expiration = expiresAt ? new Date(expiresAt) : new Date(Date.now() + 60 * 60 * 1000); // default 1 hour

    const override = await LiveClassAccessOverride.create({
      liveClass: liveClass._id,
      student: student._id,
      grantedBy: new mongoose.Types.ObjectId(decoded.userId),
      reason: reason || "Admin granted late join access",
      expiresAt: expiration,
    });

    // Audit the override
    await LiveClassTimeline.create({
      liveClass: liveClass._id,
      batch: (liveClass as any).batch,
      event: "override-granted",
      description: `Admin granted late-join override for student ${student.firstName} ${student.lastName}. Reason: ${reason || "None"}`,
      performedBy: new mongoose.Types.ObjectId(decoded.userId),
    });

    return NextResponse.json({ success: true, data: override });
  } catch (error: any) {
    console.error("Failed to grant late-join override:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
