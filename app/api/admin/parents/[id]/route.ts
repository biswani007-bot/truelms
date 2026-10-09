
/**
 * @swagger
 * /api/admin/parents/{id}:
 *   delete:
 *     summary: Auto-generated summary for DELETE /api/admin/parents/{id}
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
 * /api/admin/parents/{id}:
 *   put:
 *     summary: Auto-generated summary for PUT /api/admin/parents/{id}
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
 * /api/admin/parents/{id}:
 *   get:
 *     summary: Auto-generated summary for GET /api/admin/parents/{id}
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
import { Parent, ParentStudentLink, Student } from "@/models";
import { IParent } from "@/models/parent.model";
import { User } from "@/models/user.model";
import { Lead } from "@/models/lead.model";
import { authenticateRequest } from "@/middleware/auth.middleware";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await authenticateRequest(req);
    if (!authResult.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();
    const parent = await Parent.findById(id).lean<IParent>();
    if (!parent || parent.isDeleted) {
      return NextResponse.json({ error: "Parent not found" }, { status: 404 });
    }

    const studentLinks = await ParentStudentLink.find({ parent: parent._id, isDeleted: { $ne: true } })
      .populate("student")
      .lean();

    return NextResponse.json({
      success: true,
      data: {
        ...parent,
        students: studentLinks,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch parent detail" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await authenticateRequest(req);
    if (!authResult.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();
    const body = await req.json();

    const parent = await Parent.findByIdAndUpdate(id, body, { new: true, runValidators: true });
    if (!parent) {
      return NextResponse.json({ error: "Parent not found" }, { status: 404 });
    }

    if (body.firstName || body.lastName || body.phone) {
      const parentFullName = `${parent.firstName} ${parent.lastName}`.trim();
      if (parent.user && (body.firstName || body.lastName)) {
        await User.findByIdAndUpdate(parent.user, {
          ...(body.firstName ? { firstName: body.firstName.trim() } : {}),
          ...(body.lastName ? { lastName: body.lastName.trim() } : {}),
        });
      }
      const leadSyncUpdates: any = {
        fullName: parentFullName,
        parent: parent._id,
      };
      if (parent.phone) leadSyncUpdates.phone = parent.phone;

      await Lead.updateMany(
        {
          $or: [
            { parent: parent._id },
            { email: parent.email }
          ],
          isDeleted: { $ne: true }
        },
        { $set: leadSyncUpdates }
      );
    }

    return NextResponse.json({ success: true, data: parent });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update parent" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await authenticateRequest(req);
    if (!authResult.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();
    const parent = await Parent.findByIdAndUpdate(id, { isDeleted: true, status: "archived" }, { new: true });
    if (!parent) {
      return NextResponse.json({ error: "Parent not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Parent archived successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to archive parent" }, { status: 500 });
  }
}
