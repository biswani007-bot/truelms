import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../../../../../config/db";
import { certificateRepository } from "../../../../../repositories/certificate.repository";
import { CertificatePdfService } from "../../../../../services/certificate-pdf.service";
import { verifyAuth } from "../../../../../middleware/auth.middleware";
import { ParentService } from "../../../../../services/parent/parent.service";
import { getAuthenticatedParent } from "../../../../../lib/auth/parent-auth";
export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const params = await context.params;
    const { id } = params;

    // Optional: Authenticate request
    // This allows Parents, Admins, and potentially students to download if authorized.
    // For this prototype, we'll implement basic token check if needed, 
    // or just allow download if the ID is known.
    // However, the rules specify "Private certificate access must require appropriate authorization."
    
    const user = verifyAuth(req);
    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const certificate = await certificateRepository.findById(id, {
      populate: [
        "student",
        { path: "course", populate: { path: "instructors" } },
        "batch",
        "template",
        "approvedBy",
        "issuedBy",
      ],
    });

    if (!certificate) {
      return NextResponse.json({ success: false, message: "Certificate not found" }, { status: 404 });
    }

    // Revocation Guard: Revoked certificates cannot be downloaded
    if (certificate.status === "revoked") {
      return NextResponse.json(
        { success: false, message: "Certificate has been officially revoked and cannot be downloaded or verified" },
        { status: 403 }
      );
    }

    const isPreview = req.nextUrl.searchParams.get("preview") === "true";
    if (certificate.status !== "issued" && !isPreview) {
      return NextResponse.json(
        { success: false, message: "Only issued certificates can be downloaded" },
        { status: 400 }
      );
    }

    // Authorization Check
    const rawRole = user.role || "";
    const userRole = rawRole.toLowerCase();
    let isAuthorized = false;
    
    if (["admin", "super admin", "academic manager", "certificate officer"].includes(userRole)) {
      isAuthorized = true;
    } else if (userRole === "student") {
      const certStudentId = (certificate.student as any)?._id?.toString() || certificate.student?.toString();
      const certStudentUserId = (certificate.student as any)?.user?.toString();
      if (user.userId === certStudentId || user.userId === certStudentUserId) {
        isAuthorized = true;
      } else {
        const { Student } = await import("../../../../../models/student.model");
        const studentDoc = await Student.findOne({ user: user.userId });
        if (studentDoc && studentDoc._id.toString() === certStudentId) {
          isAuthorized = true;
        }
      }
    } else if (userRole === "parent") {
      try {
        const { parent } = await getAuthenticatedParent(req);
        await ParentService.authorizeChildAccess(parent._id, (certificate.student as any)._id?.toString());
        isAuthorized = true;
      } catch (e) {
        console.error("PARENT CERT DOWNLOAD AUTH ERROR:", e);
        isAuthorized = false;
      }
    }

    if (!isAuthorized) {
      return NextResponse.json({ success: false, message: "Access denied" }, { status: 403 });
    }

    // Generate PDF Buffer
    const pdfBuffer = await CertificatePdfService.generateCertificatePdf(certificate);

    // Return as PDF file download
    const filename = `TrueLern-Certificate-${certificate.certificateNumber}.pdf`;
    const disposition = isPreview ? `inline; filename="${filename}"` : `attachment; filename="${filename}"`;

    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": disposition,
        "Content-Length": pdfBuffer.length.toString(),
      },
    });
  } catch (error: any) {
    console.error("PDF Generation Error:", error);
    return NextResponse.json({ success: false, message: "Failed to generate PDF" }, { status: 500 });
  }
}
