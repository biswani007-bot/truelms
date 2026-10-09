/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { withRoles } from "../../../../../middleware/auth.middleware";
import { studentRepository } from "../../../../../repositories/student.repository";
import { studentDocumentRepository } from "../../../../../repositories/student-document.repository";
import { studentTimelineRepository } from "../../../../../repositories/student-timeline.repository";
import { ResponseHelper } from "../../../../../helpers/response";
import { apiHandler } from "../../../../../utils/api-handler";
import { connectDB } from "../../../../../config/db";
import path from "path";
import fs from "fs";
import crypto from "crypto";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const uploadDir = path.resolve("./storage/media");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// GET all documents for a student
export const GET = withRoles(
  ["Admin", "Super Admin", "Academic Manager", "Counsellor", "Student", "Parent"],
  apiHandler(async (req: NextRequest, authUser: any, routeCtx: RouteParams) => {
    await connectDB();
    const { id } = await routeCtx.params;

    const student = await studentRepository.findById(id);
    if (!student) {
      return NextResponse.json(ResponseHelper.error("Student profile not found", "NOT_FOUND"), { status: 404 });
    }

    const documents = await studentDocumentRepository.findMany(
      { student: id, isDeleted: { $ne: true } },
      { populate: ["verifiedBy", "uploadedBy"], sort: "createdAt", order: "desc" } as any
    );

    return NextResponse.json(ResponseHelper.success("Fetched student documents", documents), { status: 200 });
  })
);

// POST upload a document for a student
export const POST = withRoles(
  ["Admin", "Super Admin", "Academic Manager"],
  apiHandler(async (req: NextRequest, authUser: any, routeCtx: RouteParams) => {
    await connectDB();
    const { id } = await routeCtx.params;

    const student = await studentRepository.findById(id);
    if (!student) {
      return NextResponse.json(ResponseHelper.error("Student profile not found", "NOT_FOUND"), { status: 404 });
    }

    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      return NextResponse.json(ResponseHelper.error("Invalid multipart form data"), { status: 400 });
    }

    const file = formData.get("file") as File | null;
    const documentType = (formData.get("documentType") as string) || "id_proof";
    const title = (formData.get("title") as string) || file?.name || "Student Document";

    if (!file) {
      return NextResponse.json(ResponseHelper.error("No file provided"), { status: 400 });
    }

    const MAX_SIZE = 50 * 1024 * 1024; // 50MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json(ResponseHelper.error("File size exceeds 50MB limit"), { status: 400 });
    }

    const allowedMimeTypes = [
      "application/pdf",
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/webp",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedMimeTypes.includes(file.type)) {
      return NextResponse.json(
        ResponseHelper.error("Invalid file format. Allowed: PDF, JPG, PNG, WEBP, DOC, DOCX"),
        { status: 400 }
      );
    }

    const ext = path.extname(file.name) || ".pdf";
    const safeFilename = `doc_${crypto.randomUUID()}${ext}`;
    const filePath = path.join(uploadDir, safeFilename);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(filePath, buffer);

    const fileUrl = `/api/media/${safeFilename}`;

    const docRecord = await studentDocumentRepository.create({
      student: id as any,
      documentType: documentType as any,
      title,
      fileName: file.name,
      fileUrl,
      fileSize: file.size,
      mimeType: file.type,
      verificationStatus: "pending",
      uploadedBy: (authUser.userId || authUser.id) as any,
    });

    // Record in student audit timeline
    await studentTimelineRepository.create({
      student: id as any,
      event: "document_uploaded",
      description: `Uploaded document: "${title}" (${documentType})`,
    });

    return NextResponse.json(
      ResponseHelper.success("Document uploaded successfully", docRecord),
      { status: 201 }
    );
  })
);
