/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { withRoles } from "../../../../middleware/auth.middleware";
import { ResponseHelper } from "../../../../helpers/response";
import { apiHandler } from "../../../../utils/api-handler";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { connectDB } from "../../../../config/db";

// Ensure storage directory exists
const uploadDir = path.resolve("./storage/media");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

export const POST = withRoles(
  ["Admin", "Super Admin", "Teacher", "Instructor", "Academic Manager", "Course Manager"], // Allow authoring roles to upload media
  apiHandler(async (req: NextRequest) => {
    await connectDB();
    
    let formData;
    try {
      formData = await req.formData();
    } catch (e) {
      return NextResponse.json(ResponseHelper.error("Invalid multipart form data"), { status: 400 });
    }

    let file = (formData.get("file") || formData.get("image")) as File | null;
    if (!file || !(file instanceof Blob)) {
      const files = formData.getAll("files");
      if (files.length > 0 && files[0] instanceof Blob) {
        file = files[0] as File;
      }
    }

    if (!file || !(file instanceof Blob) || (typeof (file as any).name === "undefined" && file.size === 0)) {
      return NextResponse.json(ResponseHelper.error("No file provided"), { status: 400 });
    }

    // Validate size (e.g., 50MB max)
    const MAX_SIZE = 50 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(ResponseHelper.error("File size exceeds 50MB limit"), { status: 400 });
    }

    // Validate extension/mime
    const ext = path.extname(file.name || "").toLowerCase() || (file.type === "application/pdf" ? ".pdf" : ".png");
    const allowedMimeTypes = [
      "application/pdf",
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/webp",
      "image/gif",
      "image/svg+xml"
    ];
    const allowedExtensions = [".pdf", ".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"];
    if (!allowedMimeTypes.includes(file.type) && !allowedExtensions.includes(ext)) {
      return NextResponse.json(ResponseHelper.error("Invalid file type. Only PDF, PNG, JPG, WEBP, and GIF are allowed."), { status: 400 });
    }

    try {
      const safeFilename = `${crypto.randomUUID()}${ext}`;
      const filePath = path.join(uploadDir, safeFilename);

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      fs.writeFileSync(filePath, buffer);

      // Return canonical internal path for the viewer
      const resourceUrl = `/api/media/${safeFilename}`;
      
      return NextResponse.json(
        ResponseHelper.success("File uploaded successfully", {
          url: resourceUrl,
          resourceUrl,
          fileUrl: resourceUrl,
          filename: safeFilename,
          mimeType: file.type || "application/octet-stream",
          size: file.size,
        }),
        { status: 201 }
      );
    } catch (e: any) {
      console.error("Upload error:", e);
      return NextResponse.json(ResponseHelper.error("Failed to process file upload"), { status: 500 });
    }
  })
);
