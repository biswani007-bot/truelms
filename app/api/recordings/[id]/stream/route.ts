
/**
 * @swagger
 * /api/recordings/{id}/stream:
 *   get:
 *     summary: Auto-generated summary for GET /api/recordings/{id}/stream
 *     tags: [recordings]
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
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../../../../../config/db";
import { JwtHelper } from "../../../../../helpers/jwt";
import { liveClassRecordingRepository } from "../../../../../repositories/live-class-recording.repository";
import { liveClassRepository } from "../../../../../repositories/live-class.repository";
import { studentRepository } from "../../../../../repositories/student.repository";
import { teacherRepository } from "../../../../../repositories/teacher.repository";
import { batchStudentRepository } from "../../../../../repositories/batch-student.repository";
import { BatchTeacher } from "../../../../../models/batch-teacher.model";
import fs from "fs";
import path from "path";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id: recordingId } = await context.params;

    // 1. Authenticate user
    const token =
      req.cookies.get("accessToken")?.value ||
      req.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const decoded = JwtHelper.verifyAccess(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: "Invalid session token" }, { status: 401 });
    }

    // 2. Fetch recording
    const recording = await liveClassRecordingRepository.findById(recordingId);
    if (!recording) {
      return NextResponse.json({ error: "Recording not found" }, { status: 404 });
    }

    // 3. Fetch LiveClass to verify batch enrollment
    const liveClass = await liveClassRepository.findById(recording.liveClass.toString());
    if (!liveClass) {
      return NextResponse.json({ error: "Associated class not found" }, { status: 404 });
    }

    const roles = (decoded as any).roles || ((decoded as any).role ? [(decoded as any).role] : []);
    const isAdmin = roles.some((r: string) => /admin/i.test(r));
    const isStudent = roles.some((r: string) => /student/i.test(r));
    const isTeacher = roles.some((r: string) => /teacher/i.test(r));
    const isParent = roles.some((r: string) => /parent/i.test(r));

    if (isParent && !isAdmin) {
      const { Parent } = await import("../../../../../models/parent.model");
      const { ParentStudentLink } = await import("../../../../../models/parent-student-link.model");
      const parent = await Parent.findOne({ user: decoded.userId, status: { $in: ["active", "approved"] } });
      if (!parent) {
        return NextResponse.json({ error: "Active parent profile not found" }, { status: 403 });
      }
      const links = await ParentStudentLink.find({
        parent: parent._id,
        canAccessPortal: true,
        isDeleted: { $ne: true },
      });
      const childStudentIds = links.map((l) => l.student);
      const isChildEnrolled = await batchStudentRepository.findOne({
        batch: liveClass.batch,
        student: { $in: childStudentIds },
        status: "active",
      });
      if (!isChildEnrolled) {
        return NextResponse.json(
          { error: "Access Denied: None of your linked children are enrolled in this cohort session." },
          { status: 403 }
        );
      }
    } else if (isStudent && !isAdmin) {
      const student = await studentRepository.findOne({ user: decoded.userId });
      if (!student) {
        return NextResponse.json({ error: "Student profile not found" }, { status: 403 });
      }
      const enrolled = await batchStudentRepository.findOne({
        batch: liveClass.batch,
        student: student._id,
        status: "active",
      });
      if (!enrolled) {
        return NextResponse.json(
          { error: "Access Denied: You do not have revision permissions for this cohort session." },
          { status: 403 }
        );
      }
    } else if (isTeacher && !isAdmin) {
      const teacher = await teacherRepository.findOne({ user: decoded.userId });
      if (!teacher) {
        return NextResponse.json({ error: "Teacher profile not found" }, { status: 403 });
      }
      const isDirectTeacher =
        liveClass.teacher?.toString() === teacher._id.toString() ||
        liveClass.assistantTeacher?.toString() === teacher._id.toString() ||
        liveClass.mentor?.toString() === teacher._id.toString();

      let isAssignedBatch = false;
      if (!isDirectTeacher && liveClass.batch) {
        const bt = await BatchTeacher.findOne({
          batch: liveClass.batch,
          teacher: teacher._id,
          status: "active",
        });
        if (bt) isAssignedBatch = true;
      }
      if (!isDirectTeacher && !isAssignedBatch) {
        return NextResponse.json(
          { error: "Access Denied: You are not assigned to this cohort's lectures." },
          { status: 403 }
        );
      }
    }

    const recordingUrl = recording.recordingUrl;
    if (!recordingUrl) {
      return NextResponse.json({ error: "Recording source URL not available" }, { status: 404 });
    }

    // Check if recordingUrl is a local file in storage directory or docker/jitsi/recordings
    const storageBasePath = path.resolve(process.env.RECORDINGS_STORAGE_PATH || "./storage/recordings");
    const jitsiRecordingsPath = path.resolve("./docker/jitsi/recordings");
    let resolvedFilePath = "";

    if (recordingUrl.startsWith("file://") || recordingUrl.startsWith("/") || recordingUrl.includes("storage") || recordingUrl.includes("recordings")) {
      const cleanPath = recordingUrl.replace("file://", "");
      if (path.isAbsolute(cleanPath) && fs.existsSync(cleanPath)) {
        resolvedFilePath = cleanPath;
      } else if (fs.existsSync(path.join(storageBasePath, path.basename(cleanPath)))) {
        resolvedFilePath = path.join(storageBasePath, path.basename(cleanPath));
      } else if (fs.existsSync(path.join(jitsiRecordingsPath, path.basename(cleanPath)))) {
        resolvedFilePath = path.join(jitsiRecordingsPath, path.basename(cleanPath));
      } else if (fs.existsSync(path.resolve(cleanPath))) {
        resolvedFilePath = path.resolve(cleanPath);
      }
    }

    if (resolvedFilePath && fs.existsSync(resolvedFilePath)) {
      const stat = fs.statSync(resolvedFilePath);
      const fileSize = stat.size;
      const range = req.headers.get("range");

      if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunkSize = end - start + 1;
        const fileStream = fs.createReadStream(resolvedFilePath, { start, end });

        return new NextResponse(fileStream as any, {
          status: 206,
          headers: {
            "Content-Range": `bytes ${start}-${end}/${fileSize}`,
            "Accept-Ranges": "bytes",
            "Content-Length": chunkSize.toString(),
            "Content-Type": "video/mp4",
          },
        });
      } else {
        const fileStream = fs.createReadStream(resolvedFilePath);
        return new NextResponse(fileStream as any, {
          status: 200,
          headers: {
            "Content-Length": fileSize.toString(),
            "Content-Type": "video/mp4",
          },
        });
      }
    }

    // If it's a file:// url and the local file is not found, it is either still processing or missing.
    if (recordingUrl.startsWith("file://")) {
      return NextResponse.json({ error: "Recording is currently processing or unavailable" }, { status: 404 });
    }

    // Otherwise redirect to authorized external URL or stream
    return NextResponse.redirect(recordingUrl);
  } catch (error: any) {
    console.error("Recording stream error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to stream recording" },
      { status: 500 }
    );
  }
}
