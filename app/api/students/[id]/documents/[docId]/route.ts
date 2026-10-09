/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { withRoles } from "../../../../../../middleware/auth.middleware";
import { studentDocumentRepository } from "../../../../../../repositories/student-document.repository";
import { studentTimelineRepository } from "../../../../../../repositories/student-timeline.repository";
import { ResponseHelper } from "../../../../../../helpers/response";
import { apiHandler } from "../../../../../../utils/api-handler";
import { connectDB } from "../../../../../../config/db";

interface RouteParams {
  params: Promise<{ id: string; docId: string }>;
}

// PATCH update verification status (verify or reject)
export const PATCH = withRoles(
  ["Admin", "Super Admin", "Academic Manager"],
  apiHandler(async (req: NextRequest, authUser: any, routeCtx: RouteParams) => {
    await connectDB();
    const { id, docId } = await routeCtx.params;
    const body = await req.json();

    const { verificationStatus, rejectionReason } = body;

    if (!verificationStatus || !["pending", "verified", "rejected"].includes(verificationStatus)) {
      return NextResponse.json(
        ResponseHelper.error("Valid verificationStatus ('pending', 'verified', 'rejected') is required"),
        { status: 400 }
      );
    }

    const doc = await studentDocumentRepository.findById(docId);
    if (!doc || doc.student.toString() !== id) {
      return NextResponse.json(ResponseHelper.error("Student document not found", "NOT_FOUND"), { status: 404 });
    }

    const updatePayload: any = {
      verificationStatus,
      verifiedBy: authUser.userId || authUser.id,
      verifiedAt: new Date(),
    };

    if (verificationStatus === "rejected") {
      updatePayload.rejectionReason = rejectionReason || "Rejected by administrator";
    } else if (verificationStatus === "verified") {
      updatePayload.rejectionReason = undefined;
    }

    const updated = await studentDocumentRepository.update(docId, updatePayload);

    // Record audit timeline
    const reasonText = rejectionReason ? ` (Reason: ${rejectionReason})` : "";
    await studentTimelineRepository.create({
      student: id as any,
      event: "status_change",
      description: `Document "${doc.title}" was marked as ${verificationStatus}${reasonText}`,
    });

    return NextResponse.json(ResponseHelper.success(`Document marked as ${verificationStatus}`, updated), {
      status: 200,
    });
  })
);

// DELETE remove student document
export const DELETE = withRoles(
  ["Admin", "Super Admin"],
  apiHandler(async (req: NextRequest, authUser: any, routeCtx: RouteParams) => {
    await connectDB();
    const { id, docId } = await routeCtx.params;

    const doc = await studentDocumentRepository.findById(docId);
    if (!doc || doc.student.toString() !== id) {
      return NextResponse.json(ResponseHelper.error("Student document not found", "NOT_FOUND"), { status: 404 });
    }

    await studentDocumentRepository.softDelete(docId);

    await studentTimelineRepository.create({
      student: id as any,
      event: "status_change",
      description: `Document "${doc.title}" was deleted/archived`,
    });

    return NextResponse.json(ResponseHelper.success("Document deleted successfully"), { status: 200 });
  })
);
