import { NextResponse } from "next/server";
import { connectDB } from "../../../../../../config/db";
import { getAuthenticatedStudent } from "../../../../../../lib/auth/student-session";
import { ProgressService } from "../../../../../../services/academic/progress.service";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const student = await getAuthenticatedStudent();

    if (!student) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: courseId } = await params;
    if (!courseId) {
      return NextResponse.json({ error: "Course ID is required" }, { status: 400 });
    }

    const progressDetail = await ProgressService.getStudentCourseProgressDetail(student._id, courseId);

    return NextResponse.json({
      success: true,
      data: progressDetail,
      courseId,
      studentId: student._id,
      progress: progressDetail.progress,
    });
  } catch (error: any) {
    console.error("Error fetching course progress:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
