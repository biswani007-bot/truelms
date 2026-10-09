import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "../../../../middleware/auth.middleware";
import { userRepository } from "../../../../repositories/user.repository";
import { connectDB } from "../../../../config/db";

export async function GET(req: NextRequest) {
  try {
    const payload = verifyAuth(req);
    if (!payload) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    await connectDB();
    const user = await userRepository.findById(payload.userId);
    if (!user || !user.isActive) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const roleName = typeof user.role === "object" && user.role !== null ? (user.role as any).name : user.role;

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user._id.toString(),
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: roleName,
      },
    });
  } catch {
    return NextResponse.json({ authenticated: false, user: null });
  }
}
