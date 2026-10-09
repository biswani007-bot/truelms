import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../../../../../../config/db";
import { JwtHelper } from "../../../../../../helpers/jwt";
import { DemoSession } from "../../../../../../models/demo-session.model";
import { Parent } from "../../../../../../models/parent.model";
import { generateJitsiToken } from "../../../../../../lib/jitsi/token";

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

    // 2. Fetch DemoSession
    const demo = await DemoSession.findById(demoId);
    if (!demo || demo.isDeleted) {
      return NextResponse.json({ error: "Demo session not found" }, { status: 404 });
    }

    // 3. Verify Parent Role & Ownership
    const rawRoles = (decoded as any).roles || ((decoded as any).role ? [(decoded as any).role] : []);
    const roles = rawRoles.map((r: string) => (r || "").toLowerCase());
    const isParent = roles.some((r: string) => ["parent", "guardian"].includes(r));

    if (!isParent) {
      return NextResponse.json({ error: "Access Denied: Only parents can join this demo session." }, { status: 403 });
    }

    const parentDoc = await Parent.findOne({
      user: decoded.userId,
      status: { $in: ["active", "approved"] },
      isDeleted: { $ne: true },
    });

    if (!parentDoc) {
      return NextResponse.json({ error: "Access Denied: No active parent profile found." }, { status: 403 });
    }

    // Verify Demo belongs to this Parent
    if (demo.parent?.toString() !== parentDoc._id.toString()) {
      return NextResponse.json({ error: "Access Denied: You are not authorized to join this demo." }, { status: 403 });
    }

    // Verify Timing
    const now = new Date();
    const joinWindowStart = new Date(demo.scheduledStart.getTime() - 15 * 60000);
    const joinWindowEnd = new Date(demo.scheduledEnd);
    
    if (now < joinWindowStart) {
      return NextResponse.json({ error: "Demo is not open yet. You can join 15 minutes before the start time." }, { status: 403 });
    }
    if (now > joinWindowEnd) {
      return NextResponse.json({ error: "Demo session has ended." }, { status: 403 });
    }
    if (demo.status === "completed" || demo.status === "cancelled" || demo.status === "missed") {
       return NextResponse.json({ error: "Demo session is no longer active." }, { status: 403 });
    }

    // 4. Generate Jitsi token
    const parentName = `${(parentDoc as any).firstName || ""} ${(parentDoc as any).lastName || ""}`.trim() || "Parent";
    const tokenPayload = generateJitsiToken(`demo-${demoId}`, {
      id: decoded.userId,
      name: parentName,
      email: (parentDoc as any).email || (decoded as any).email,
      isModerator: false,
    });

    return NextResponse.json({
      success: true,
      data: {
        ...tokenPayload,
        liveClass: {
          id: demo._id,
          title: "TrueLern Platform Demo",
          scheduledAt: demo.scheduledStart,
          duration: demo.duration,
          agenda: "TrueLern Program Introduction",
          status: demo.status,
          recordingEnabled: false,
        },
      },
    });
  } catch (error: any) {
    console.error("Failed to generate Jitsi demo token:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
