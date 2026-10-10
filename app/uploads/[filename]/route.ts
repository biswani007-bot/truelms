import { NextRequest, NextResponse } from "next/server";
import { readFile, stat } from "fs/promises";
import path from "path";
import mongoose from "mongoose";
import { verifyAuth } from "@/middleware/auth.middleware";
import { getAuthenticatedParent } from "@/lib/auth/parent-auth";
import { connectDB } from "@/config/db";

const MIME_TYPES: Record<string, string> = {
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".txt": "text/plain; charset=utf-8",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".zip": "application/zip",
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;

    // Security check: Prevent directory traversal
    if (!filename || filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
      return new NextResponse("Invalid file path", { status: 400 });
    }

    // 1. Authentication check: enforce logged-in session (dual auth for Parent)
    let authUser = verifyAuth(req);
    let parentDoc: any = null;

    if (!authUser) {
      try {
        const parentAuth = await getAuthenticatedParent(req);
        if (parentAuth) {
          authUser = parentAuth.user;
          parentDoc = parentAuth.parent;
        }
      } catch {
        // Fallback failed
      }
    }

    if (!authUser) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: authentication required to access attachments" },
        { status: 401 }
      );
    }

    // 2. Authorization check: enforce role & ownership permissions
    await connectDB();
    const role = authUser.role;

    if (role === "Teacher") {
      const { AssignmentAttachment } = await import("@/models/assignment-attachment.model");
      const { AssignmentSubmission } = await import("@/models/assignment-submission.model");
      const { AssignmentService } = await import("@/services/assignment/assignment.service");

      // Check if attachment belongs to an existing assignment
      const attachment = await AssignmentAttachment.findOne({
        fileUrl: { $regex: filename },
      }).populate("assignment");

      if (attachment && attachment.assignment) {
        const teacherContext = await AssignmentService.getTeacherContext(authUser.userId);
        const isAuthorized = AssignmentService.isTeacherAuthorized(
          attachment.assignment,
          teacherContext?.teacherDoc?._id,
          authUser.userId,
          teacherContext?.teacherBatchIdStrings || []
        );

        if (!isAuthorized) {
          return NextResponse.json(
            { success: false, message: "Forbidden: you do not have permission to access this attachment" },
            { status: 403 }
          );
        }
      }

      // Check if attachment belongs to a student submission
      const submission = await AssignmentSubmission.findOne({
        files: { $regex: filename },
      }).populate("assignment");

      if (submission && submission.assignment) {
        const teacherContext = await AssignmentService.getTeacherContext(authUser.userId);
        const isAuthorized = AssignmentService.isTeacherAuthorized(
          submission.assignment,
          teacherContext?.teacherDoc?._id,
          authUser.userId,
          teacherContext?.teacherBatchIdStrings || []
        );

        if (!isAuthorized) {
          return NextResponse.json(
            { success: false, message: "Forbidden: you do not have permission to access this submission file" },
            { status: 403 }
          );
        }
      }
    } else if (role === "Student") {
      const { AssignmentAttachment } = await import("@/models/assignment-attachment.model");
      const { AssignmentSubmission } = await import("@/models/assignment-submission.model");
      const { Student } = await import("@/models/student.model");
      const { Enrollment } = await import("@/models/enrollment.model");

      const studentDoc = await Student.findOne({ user: authUser.userId });

      const attachment = await AssignmentAttachment.findOne({
        fileUrl: { $regex: filename },
      }).populate("assignment");

      if (attachment && attachment.assignment) {
        const assignment = attachment.assignment as any;
        if (studentDoc && assignment.batch) {
          const isEnrolled = await Enrollment.exists({
            student: studentDoc._id,
            batch: assignment.batch,
            status: "active",
          });
          // Also allow if assignment visibility is public
          if (!isEnrolled && assignment.visibility !== "public") {
            return NextResponse.json(
              { success: false, message: "Forbidden: student not enrolled in this batch" },
              { status: 403 }
            );
          }
        }
      }

      const submission = await AssignmentSubmission.findOne({
        files: { $regex: filename },
      });
      if (submission && studentDoc) {
        if (submission.student?.toString() !== studentDoc._id.toString()) {
          return NextResponse.json(
            { success: false, message: "Forbidden: cannot access another student's submission" },
            { status: 403 }
          );
        }
      }
    } else if (role === "Parent" || role?.toLowerCase() === "parent") {
      if (!parentDoc) {
        try {
          const parentAuth = await getAuthenticatedParent(req);
          if (parentAuth?.parent) {
            parentDoc = parentAuth.parent;
          }
        } catch {
          // Fallback to direct Parent model lookup below
        }
      }

      if (!parentDoc) {
        const { Parent } = await import("@/models/parent.model");
        parentDoc = await Parent.findOne({
          user: authUser.userId,
          isDeleted: { $ne: true },
        });
      }

      const parentCandidateIds: any[] = [];
      if (parentDoc?._id) {
        parentCandidateIds.push(parentDoc._id);
      }
      if (authUser.userId) {
        if (mongoose.isValidObjectId(authUser.userId)) {
          parentCandidateIds.push(new mongoose.Types.ObjectId(authUser.userId));
        }
        parentCandidateIds.push(authUser.userId);
      }

      const { ParentStudentLink } = await import("@/models/parent-student-link.model");
      const links = await ParentStudentLink.find({
        parent: parentCandidateIds.length === 1 ? parentCandidateIds[0] : { $in: parentCandidateIds },
        canAccessPortal: true,
        isDeleted: { $ne: true },
      });

      if (!links || links.length === 0) {
        return NextResponse.json(
          { success: false, message: "Forbidden: no active child portal access found" },
          { status: 403 }
        );
      }

      const linkedStudentIds: string[] = [];
      for (const l of links) {
        const sVal = (l as any).student;
        const sid = sVal?._id ? sVal._id.toString() : sVal?.toString();
        if (sid) {
          linkedStudentIds.push(sid);
        }
      }

      if (linkedStudentIds.length === 0) {
        return NextResponse.json(
          { success: false, message: "Forbidden: no active child portal access found" },
          { status: 403 }
        );
      }

      const studentObjIds: any[] = [];
      for (const sid of linkedStudentIds) {
        if (mongoose.isValidObjectId(sid)) {
          studentObjIds.push(new mongoose.Types.ObjectId(sid));
        }
      }

      const { Student } = await import("@/models/student.model");
      const studentDocs = await Student.find({
        $or: [
          { _id: { $in: studentObjIds } },
          { user: { $in: studentObjIds } },
        ],
        isDeleted: { $ne: true },
      });

      const allStudentIdStrings = new Set<string>(linkedStudentIds);
      const allStudentObjectIds = [...studentObjIds];

      for (const s of studentDocs) {
        allStudentIdStrings.add(s._id.toString());
        allStudentObjectIds.push(s._id);
        if (s.user) {
          allStudentIdStrings.add(s.user.toString());
          if (mongoose.isValidObjectId(s.user)) {
            allStudentObjectIds.push(s.user);
          }
        }
      }

      const { AssignmentAttachment } = await import("@/models/assignment-attachment.model");
      const { AssignmentSubmission } = await import("@/models/assignment-submission.model");
      const { Enrollment } = await import("@/models/enrollment.model");
      const { BatchStudent } = await import("@/models/batch-student.model");

      // Check if attachment belongs to an existing assignment
      const attachment = await AssignmentAttachment.findOne({
        fileUrl: { $regex: filename },
      }).populate("assignment");

      // Check if attachment belongs to a student submission
      const submission = await AssignmentSubmission.findOne({
        files: { $regex: filename },
      });

      // Strict containment: If neither an attachment nor a submission, return 403
      if (!attachment && !submission) {
        return NextResponse.json(
          { success: false, message: "Forbidden: file not associated with assignments or submissions" },
          { status: 403 }
        );
      }

      let isAuthorized = false;

      // Attachment authorization: public OR active enrollment in assignment batch
      if (attachment && attachment.assignment) {
        const assignment = attachment.assignment as any;
        if (assignment.visibility === "public") {
          isAuthorized = true;
        } else if (assignment.batch) {
          const isEnrolled =
            (await Enrollment.exists({
              student: { $in: allStudentObjectIds },
              batch: assignment.batch,
              status: "active",
            })) ||
            (await BatchStudent.exists({
              student: { $in: allStudentObjectIds },
              batch: assignment.batch,
              status: "active",
            }));

          if (isEnrolled) {
            isAuthorized = true;
          }
        }
      }

      // Submission authorization: student matches one of parent's active linked children
      if (submission) {
        const submissionStudentId = submission.student?.toString();
        if (submissionStudentId && allStudentIdStrings.has(submissionStudentId)) {
          isAuthorized = true;
        } else if (!isAuthorized) {
          return NextResponse.json(
            { success: false, message: "Forbidden: cannot access another student's submission" },
            { status: 403 }
          );
        }
      }

      if (!isAuthorized) {
        return NextResponse.json(
          { success: false, message: "Forbidden: you do not have permission to access this attachment" },
          { status: 403 }
        );
      }
    } else if (!["Admin", "Super Admin", "Academic Manager"].includes(role)) {
      return NextResponse.json(
        { success: false, message: "Forbidden: invalid role for attachment access" },
        { status: 403 }
      );
    }

    // 3. Locate file on disk
    const candidatePaths = [
      path.join(process.cwd(), "storage", "uploads", filename),
      path.join(process.cwd(), "public", "uploads", filename),
    ];

    let foundPath: string | null = null;
    for (const p of candidatePaths) {
      try {
        const fileStat = await stat(p);
        if (fileStat.isFile()) {
          foundPath = p;
          break;
        }
      } catch {
        // file doesn't exist at this candidate location
      }
    }

    if (!foundPath) {
      return new NextResponse("Attachment not found", { status: 404 });
    }

    const buffer = await readFile(foundPath);
    const ext = path.extname(filename).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${encodeURIComponent(filename)}"`,
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "SAMEORIGIN",
        "Content-Security-Policy": "frame-ancestors 'self'",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error: any) {
    console.error("Error serving upload:", error);
    return new NextResponse("Error reading file", { status: 500 });
  }
}

