
/**
 * @swagger
 * /api/admin/parents/link:
 *   delete:
 *     summary: Auto-generated summary for DELETE /api/admin/parents/link
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
 * /api/admin/parents/link:
 *   post:
 *     summary: Auto-generated summary for POST /api/admin/parents/link
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
import { ParentStudentLink, Parent, Student } from "@/models";
import { authenticateRequest } from "@/middleware/auth.middleware";

export async function POST(req: Request) {
  try {
    const authResult = await authenticateRequest(req);
    if (!authResult.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const body = await req.json();
    const { parentId, studentId, relationshipType, priority, isEmergencyContact, isCustodial, isPickupAuthorized } = body;

    if (!parentId || !studentId) {
      return NextResponse.json({ error: "Parent ID and Student ID are required" }, { status: 400 });
    }

    const [parent, student] = await Promise.all([
      Parent.findById(parentId),
      Student.findById(studentId),
    ]);

    if (!parent || !student) {
      return NextResponse.json({ error: "Invalid Parent or Student reference" }, { status: 404 });
    }

    const link = await ParentStudentLink.findOneAndUpdate(
      { parent: parent._id, student: student._id },
      {
        parent: parent._id,
        student: student._id,
        relationshipType: relationshipType || "guardian",
        priority: priority || 1,
        isEmergencyContact: isEmergencyContact !== undefined ? isEmergencyContact : true,
        isCustodial: isCustodial !== undefined ? isCustodial : true,
        isPickupAuthorized: isPickupAuthorized !== undefined ? isPickupAuthorized : true,
        isDeleted: false,
      },
      { upsert: true, new: true, runValidators: true }
    );

    return NextResponse.json({ success: true, data: link }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to link parent to student" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const authResult = await authenticateRequest(req);
    if (!authResult.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { searchParams } = new URL(req.url);
    const linkId = searchParams.get("linkId");

    if (!linkId) {
      return NextResponse.json({ error: "Link ID is required" }, { status: 400 });
    }

    await ParentStudentLink.findByIdAndUpdate(linkId, { isDeleted: true });
    return NextResponse.json({ success: true, message: "Parent-student link removed" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to remove link" }, { status: 500 });
  }
}
