import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    let files = formData.getAll("files") as File[];
    if (!files || files.length === 0) {
      const singleFile = formData.get("file") as File | null;
      if (singleFile && typeof singleFile !== "string") {
        files = [singleFile];
      }
    }
    if (!files || files.length === 0) {
      return NextResponse.json({ success: false, message: "No files uploaded" }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), "storage", "uploads");
    await mkdir(uploadDir, { recursive: true });

    const uploadedFiles = [];
    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const ext = path.extname(file.name);
      // fallback if no extension
      const filename = `${crypto.randomUUID()}${ext || ""}`;
      const filePath = path.join(uploadDir, filename);
      await writeFile(filePath, buffer);
      
      uploadedFiles.push({
        fileName: file.name,
        fileUrl: `/uploads/${filename}`,
        url: `/uploads/${filename}`,
        fileSize: file.size,
        fileType: file.type,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Files uploaded successfully",
      data: uploadedFiles,
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
