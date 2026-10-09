
/**
 * @swagger
 * /api/admin/metrics:
 *   get:
 *     summary: Auto-generated summary for GET /api/admin/metrics
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
import { connectDB } from "../../../../config/db";
import { userRepository } from "../../../../repositories/user.repository";
import { studentRepository } from "../../../../repositories/student.repository";
import { teacherRepository } from "../../../../repositories/teacher.repository";
import { courseRepository } from "../../../../repositories/course.repository";
import { batchRepository } from "../../../../repositories/batch.repository";

export async function GET() {
  try {
    await connectDB();
    const [
      totalUsers,
      activeStudents,
      activeTeachers,
      activeCourses,
      activeBatches
    ] = await Promise.all([
      userRepository.count({}),
      studentRepository.count({ status: "active" }),
      teacherRepository.count({ status: "active" }),
      courseRepository.count({ status: "published" }),
      batchRepository.count({ status: "active" })
    ]);

    return NextResponse.json({
      success: true,
      data: {
        totalUsers,
        activeStudents,
        activeTeachers,
        activeCourses,
        activeBatches
      }
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
