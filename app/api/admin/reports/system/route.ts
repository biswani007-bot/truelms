
/**
 * @swagger
 * /api/admin/reports/system:
 *   get:
 *     summary: Auto-generated summary for GET /api/admin/reports/system
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
import { withRoles } from "../../../../../middleware/auth.middleware";
import { connectDB } from "../../../../../config/db";
import { User } from "../../../../../models/user.model";
import { Student } from "../../../../../models/student.model";
import { Course } from "../../../../../models/course.model";
import { Enrollment } from "../../../../../models/enrollment.model";

export const GET = withRoles(
  ["Admin", "Super Admin", "operations-manager"],
  async (req: NextRequest) => {
    try {
      await connectDB();
      
      const [totalUsers, totalStudents, totalCourses, totalEnrollments] = await Promise.all([
        User.countDocuments({ isDeleted: false }),
        Student.countDocuments({ isDeleted: false }),
        Course.countDocuments({ isDeleted: false }),
        Enrollment.countDocuments({ isDeleted: false })
      ]);

      // Just doing simple counts for operational dashboard
      return NextResponse.json({ 
        success: true, 
        data: {
          metrics: {
            users: totalUsers,
            students: totalStudents,
            courses: totalCourses,
            enrollments: totalEnrollments
          }
        }
      });
    } catch (err: any) {
      return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
  }
);
