/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { withRoles } from "../../../../middleware/auth.middleware";
import { ResponseHelper } from "../../../../helpers/response";
import { apiHandler } from "../../../../utils/api-handler";
import path from "path";
import fs from "fs";
import { connectDB } from "../../../../config/db";

interface RouteParams {
  params: Promise<{ filename: string }>;
}

export const GET = withRoles(
  ["Admin", "Super Admin", "Teacher", "Academic Manager", "Student", "Parent"],
  apiHandler(async (req: NextRequest, authUser: any, routeCtx: RouteParams) => {
    const { filename } = await routeCtx.params;

    // Prevent path traversal
    if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
      return NextResponse.json(ResponseHelper.error("Invalid filename"), { status: 400 });
    }

    const uploadDir = path.resolve("./storage/media");
    const filePath = path.join(uploadDir, filename);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json(ResponseHelper.error("Media not found"), { status: 404 });
    }

    await connectDB();
    const mongoose = require("mongoose");
    const CourseLesson = mongoose.models.CourseLesson;
    const Enrollment = mongoose.models.Enrollment;
    const ParentStudentLink = mongoose.models.ParentStudentLink;
    const Batch = mongoose.models.Batch;

    // Resolve resource context
    const resourceUrl = `/api/media/${filename}`;
    const lesson = await CourseLesson.findOne({ resourceUrl });

    const userId = authUser.userId || authUser.id;

    if (!lesson) {
      // Check if this is a student document
      const StudentDocument = mongoose.models.StudentDocument;
      const studentDoc = StudentDocument ? await StudentDocument.findOne({ fileUrl: resourceUrl, isDeleted: { $ne: true } }) : null;

      if (studentDoc) {
        if (authUser.role === "Admin" || authUser.role === "Super Admin") {
          // Allowed
        } else if (authUser.role === "Student") {
          const { Student } = await import("../../../../models/student.model");
          const s = await Student.findOne({ user: userId });
          if (!s || s._id.toString() !== studentDoc.student.toString()) {
            return NextResponse.json(ResponseHelper.error("Unauthorized access to student document", "FORBIDDEN"), { status: 403 });
          }
        } else if (authUser.role === "Parent") {
          const { ParentStudentLink } = await import("../../../../models/parent-student-link.model");
          const { Parent } = await import("../../../../models/parent.model");
          const p = await Parent.findOne({ user: userId });
          const parentId = p ? p._id : userId;
          const link = await ParentStudentLink.findOne({
            $and: [
              { $or: [{ parent: parentId }, { parentId }] },
              { $or: [{ student: studentDoc.student }, { studentId: studentDoc.student }] },
              { isDeleted: { $ne: true } },
            ],
          });
          if (!link) {
            return NextResponse.json(ResponseHelper.error("Unauthorized access to student document", "FORBIDDEN"), { status: 403 });
          }
        } else {
          return NextResponse.json(ResponseHelper.error("Unauthorized access to student document", "FORBIDDEN"), { status: 403 });
        }
      } else {
        // If neither lesson nor student document, allow authoring roles (Admin, Teacher, Instructor, Academic Manager) and portal users
        const allowedRoles = ["Admin", "Super Admin", "Teacher", "Instructor", "Academic Manager", "Student", "Parent"];
        if (!allowedRoles.includes(authUser.role)) {
          return NextResponse.json(ResponseHelper.error("Unauthorized access to media resource", "FORBIDDEN"), { status: 403 });
        }
      }
    } else {
      // Authorization by Role
      if (authUser.role === "Parent") {
        const { Parent } = await import("../../../../models/parent.model");
        const { Student } = await import("../../../../models/student.model");
        const parentDoc = await Parent.findOne({ user: userId });
        
        // Find links either by parentDoc._id or by parentId/userId
        const linkQuery: any = { isDeleted: { $ne: true } };
        const parentIds: any[] = [userId];
        if (parentDoc) {
          parentIds.push(parentDoc._id);
          parentIds.push(parentDoc._id.toString());
        }
        linkQuery.$or = [{ parent: { $in: parentIds } }, { parentId: { $in: parentIds } }];

        const links = await ParentStudentLink.find(linkQuery);
        
        // Collect student IDs (both Student._id and Student.user ObjectId/string)
        const studentObjIds: any[] = [];
        for (const l of links) {
          if (l.student) studentObjIds.push(l.student);
          if (l.studentId) studentObjIds.push(l.studentId);
        }
        
        // Also find students with user matching these or studentId
        const studentDocs = await Student.find({
          $or: [
            { _id: { $in: studentObjIds } },
            { user: { $in: studentObjIds } }
          ]
        });
        for (const s of studentDocs) {
          studentObjIds.push(s._id);
          if (s.user) studentObjIds.push(s.user);
        }

        const CourseModule = mongoose.models.CourseModule;
        const module = await CourseModule.findById(lesson.module);
        
        if (!module) {
          return NextResponse.json(ResponseHelper.error("Invalid curriculum structure", "FORBIDDEN"), { status: 403 });
        }

        const courseId = module.course;
        
        // Check if any child is enrolled in this course
        const enrollment = await Enrollment.findOne({ 
          student: { $in: studentObjIds },
          $or: [
            { course: courseId },
            { "program.course": courseId }
          ],
          isDeleted: { $ne: true }
        });

        if (!enrollment) {
          return NextResponse.json(ResponseHelper.error("Unauthorized. Child is not enrolled in this course.", "FORBIDDEN"), { status: 403 });
        }
      } else if (authUser.role === "Teacher") {
        const { Teacher } = await import("../../../../models/teacher.model");
        const teacherDoc = await Teacher.findOne({ user: userId });
        const teacherId = teacherDoc ? teacherDoc._id : userId;

        const CourseModule = mongoose.models.CourseModule;
        const module = await CourseModule.findById(lesson.module);
        if (!module) {
          return NextResponse.json(ResponseHelper.error("Invalid curriculum structure", "FORBIDDEN"), { status: 403 });
        }
        
        // Check if teacher is assigned to any batch for this course
        const batch = await Batch.findOne({
          course: module.course,
          $or: [
            { primaryTeacher: teacherId },
            { assistantTeachers: teacherId },
            { primaryTeacher: userId },
            { assistantTeachers: userId }
          ],
          isDeleted: { $ne: true }
        });

        if (!batch) {
          return NextResponse.json(ResponseHelper.error("Unauthorized. Teacher not assigned to this course.", "FORBIDDEN"), { status: 403 });
        }
      } else if (authUser.role === "Student") {
        const { Student } = await import("../../../../models/student.model");
        const studentDoc = await Student.findOne({ user: userId });
        const studentIds = [userId];
        if (studentDoc) studentIds.push(studentDoc._id);

        const CourseModule = mongoose.models.CourseModule;
        const module = await CourseModule.findById(lesson.module);
        if (module) {
          const enrollment = await Enrollment.findOne({ 
            student: { $in: studentIds },
            $or: [
              { course: module.course },
              { "program.course": module.course }
            ],
            isDeleted: { $ne: true }
          });
          if (!enrollment) {
            return NextResponse.json(ResponseHelper.error("Unauthorized.", "FORBIDDEN"), { status: 403 });
          }
        }
      }
    }

    const stat = fs.statSync(filePath);
    const ext = path.extname(filename).toLowerCase();
    let contentType = "application/octet-stream";
    if (ext === ".pdf") contentType = "application/pdf";
    if (ext === ".png") contentType = "image/png";
    if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
    if (ext === ".webp") contentType = "image/webp";
    if (ext === ".gif") contentType = "image/gif";
    if (ext === ".svg") contentType = "image/svg+xml";

    const fileStream = fs.createReadStream(filePath);

    return new NextResponse(fileStream as any, {
      status: 200,
      headers: {
        "Content-Length": stat.size.toString(),
        "Content-Type": contentType,
        // Inline disposition to render PDFs and Images directly in browser
        "Content-Disposition": `inline; filename="${filename}"`,
      },
    });
  })
);
