
/**
 * @swagger
 * /api/admin/parents:
 *   post:
 *     summary: Auto-generated summary for POST /api/admin/parents
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
 * /api/admin/parents:
 *   get:
 *     summary: Auto-generated summary for GET /api/admin/parents
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
import { Parent, ParentStudentLink } from "@/models";
import { IParent } from "@/models/parent.model";
import { authenticateRequest } from "@/middleware/auth.middleware";

export async function GET(req: Request) {
  try {
    const authResult = await authenticateRequest(req);
    if (!authResult.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const skip = (page - 1) * limit;

    const query: any = { isDeleted: { $ne: true } };
    if (status) {
      query.status = status;
    }
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { parentId: { $regex: search, $options: "i" } },
      ];
    }

    const [parents, total] = await Promise.all([
      Parent.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean<IParent[]>(),
      Parent.countDocuments(query),
    ]);

    // Attach children count for each parent
    const parentIds = parents.map((p) => p._id);
    const links = await ParentStudentLink.find({ parent: { $in: parentIds }, isDeleted: { $ne: true } }).lean();
    const childCounts: Record<string, number> = {};
    links.forEach((link) => {
      const pid = link.parent.toString();
      childCounts[pid] = (childCounts[pid] || 0) + 1;
    });

    const enrichedParents = parents.map((p) => ({
      ...p,
      _id: p._id.toString(),
      childrenCount: childCounts[p._id.toString()] || 0,
    }));

    return NextResponse.json({
      success: true,
      data: enrichedParents,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch parents" }, { status: 500 });
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

    const count = await Parent.countDocuments();
    const parentId = `PRN-${String(count + 1).padStart(5, "0")}`;

    const parent = await Parent.create({
      ...body,
      parentId,
      status: body.status || "active",
    });

    return NextResponse.json({ success: true, data: parent }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create parent" }, { status: 500 });
  }
}
