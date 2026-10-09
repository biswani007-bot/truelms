
/**
 * @swagger
 * /api/admin/search:
 *   get:
 *     summary: Auto-generated summary for GET /api/admin/search
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
import { NextRequest, NextResponse } from "next/server";
import { withRoles } from "../../../../middleware/auth.middleware";
import { connectDB } from "../../../../config/db";
import { userRepository } from "../../../../repositories/user.repository";
import { courseRepository } from "../../../../repositories/course.repository";
import { studentRepository } from "../../../../repositories/student.repository";
import { batchRepository } from "../../../../repositories/batch.repository";

export const GET = withRoles(
  ["Admin", "Super Admin"],
  async (req: NextRequest) => {
    try {
      await connectDB();
      const { searchParams } = req.nextUrl;
      const q = searchParams.get("q") || "";

      if (q.length < 2) {
        return NextResponse.json({ success: true, data: [] });
      }

      const regex = new RegExp(q, "i");

      // Parallel execution for performance
      const [users, courses, students, batches] = await Promise.all([
        userRepository.findMany({ 
          filter: { $or: [{ email: regex }, { firstName: regex }, { lastName: regex }] }, 
          limit: 3 
        }),
        courseRepository.findMany({ 
          filter: { $or: [{ title: regex }, { slug: regex }] }, 
          limit: 3 
        }),
        studentRepository.findMany({ 
          filter: { $or: [{ admissionNumber: regex }, { email: regex }] }, 
          limit: 3 
        }),
        batchRepository.findMany({ 
          filter: { $or: [{ name: regex }, { code: regex }] }, 
          limit: 3 
        })
      ]);

      const results = [
        ...users.map((u: any) => ({
          id: u._id,
          type: "User",
          title: `${u.firstName} ${u.lastName}`,
          subtitle: u.email,
          url: `/admin/users`
        })),
        ...courses.map((c: any) => ({
          id: c._id,
          type: "Course",
          title: c.title,
          subtitle: c.slug,
          url: `/admin/courses`
        })),
        ...students.map((s: any) => ({
          id: s._id,
          type: "Student",
          title: `${s.firstName} ${s.lastName}`,
          subtitle: s.admissionNumber,
          url: `/admin/students`
        })),
        ...batches.map((b: any) => ({
          id: b._id,
          type: "Batch",
          title: b.name,
          subtitle: b.code,
          url: `/admin/batches`
        }))
      ];

      return NextResponse.json({ success: true, data: results });
    } catch (err: any) {
      return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
  }
);
