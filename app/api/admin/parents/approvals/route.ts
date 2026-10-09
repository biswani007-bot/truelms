
/**
 * @swagger
 * /api/admin/parents/approvals:
 *   post:
 *     summary: Auto-generated summary for POST /api/admin/parents/approvals
 *     tags: [admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 */

/**
 * @swagger
 * /api/admin/parents/approvals:
 *   get:
 *     summary: Auto-generated summary for GET /api/admin/parents/approvals
 *     tags: [admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 */
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Parent } from "@/models";
import { authenticateRequest } from "@/middleware/auth.middleware";

export async function GET(req: Request) {
  try {
    const authResult = await authenticateRequest(req);
    if (!authResult.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const pendingParents = await Parent.find({ status: "pending-approval", isDeleted: { $ne: true } })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, data: pendingParents });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch approvals" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authResult = await authenticateRequest(req);
    if (!authResult.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const body = await req.json();
    const { parentId, action, rejectionReason } = body; // action: 'approve' | 'reject'

    if (!parentId || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
    }

    const parent = await Parent.findById(parentId);
    if (!parent) {
      return NextResponse.json({ error: "Parent not found" }, { status: 404 });
    }

    if (action === "approve") {
      parent.status = "active";
      parent.approvalDate = new Date();
      parent.approvedBy = authResult.user.userId as any;
    } else {
      parent.status = "rejected";
      parent.rejectionReason = rejectionReason || "Admin rejected registration request";
    }

    await parent.save();
    return NextResponse.json({ success: true, data: parent });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to process approval action" }, { status: 500 });
  }
}
