import { NextRequest, NextResponse } from "next/server";
import { readFile, stat } from "fs/promises";
import path from "path";

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

    const candidatePaths = [
      path.join(process.cwd(), "public", "uploads", filename),
      path.join(process.cwd(), "storage", "uploads", filename),
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
        // file doesn't exist at this location
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
        "Cache-Control": "public, max-age=86400, immutable",
      },
    });
  } catch (error: any) {
    console.error("Error serving upload:", error);
    return new NextResponse("Error reading file", { status: 500 });
  }
}
