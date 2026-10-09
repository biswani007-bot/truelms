/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "../../../../middleware/auth.middleware";
import { CounsellingRequest } from "../../../../models/counselling-request.model";
import { Teacher } from "../../../../models/teacher.model";
import { Parent } from "../../../../models/parent.model";
import { ResponseHelper } from "../../../../helpers/response";
import { apiHandler } from "../../../../utils/api-handler";
import { connectDB } from "../../../../config/db";
import { Notification } from "../../../../models/notification.model";

interface RouteParams {
  params: Promise<{ requestId: string }>;
}

/**
 * GET — Fetch a single counselling request
 * Accessible by: the parent who created it, or the counsellor it was assigned to
 */
export const GET = withAuth(
  apiHandler(async (_req: NextRequest, userContext: any, routeCtx: RouteParams) => {
    await connectDB();
    const { requestId } = await routeCtx.params;

    const request = await CounsellingRequest.findById(requestId)
      .populate("parent", "firstName lastName email phone")
      .populate("counsellor", "firstName lastName designation isCounsellor")
      .populate("student", "firstName lastName studentId")
      .lean();

    if (!request) {
      return NextResponse.json(ResponseHelper.error("Request not found", "NOT_FOUND"), { status: 404 });
    }

    // Access control: only the parent or the assigned counsellor's user account
    const parent = await Parent.findOne({ user: userContext.userId }).lean();
    const teacher = await Teacher.findOne({ user: userContext.userId }).lean();

    const isParentOwner = parent && (request as any).parent?._id?.toString() === (parent as any)._id?.toString();
    const isCounsellorOwner = teacher && (request as any).counsellor?._id?.toString() === (teacher as any)._id?.toString();
    const isAdmin = ["Admin", "Super Admin", "Academic Manager"].includes(userContext.role || "");

    if (!isParentOwner && !isCounsellorOwner && !isAdmin) {
      return NextResponse.json(ResponseHelper.error("Access denied", "FORBIDDEN"), { status: 403 });
    }

    return NextResponse.json(ResponseHelper.success("Request fetched", request), { status: 200 });
  })
);

/**
 * PATCH — Counsellor actions: accept, reject, reschedule, complete, cancel
 */
export const PATCH = withAuth(
  apiHandler(async (req: NextRequest, userContext: any, routeCtx: RouteParams) => {
    await connectDB();
    const { requestId } = await routeCtx.params;
    const body = await req.json();
    const { action, confirmedStart, confirmedEnd, rejectionReason, notes } = body;

    const request = await CounsellingRequest.findById(requestId);
    if (!request) {
      return NextResponse.json(ResponseHelper.error("Request not found", "NOT_FOUND"), { status: 404 });
    }

    // Verify the actor is the assigned counsellor or an admin
    const teacher = await Teacher.findOne({ user: userContext.userId });
    const isAdmin = ["Admin", "Super Admin", "Academic Manager"].includes(userContext.role || "");
    const isCounsellorOwner = teacher && request.counsellor.toString() === teacher._id.toString();

    // For parent cancel, verify parent owns the request
    const parent = await Parent.findOne({ user: userContext.userId });
    const isParentOwner = parent && request.parent.toString() === parent._id.toString();

    if (action === "cancel") {
      // Both parent and counsellor can cancel
      if (!isParentOwner && !isCounsellorOwner && !isAdmin) {
        return NextResponse.json(ResponseHelper.error("Access denied", "FORBIDDEN"), { status: 403 });
      }
      request.status = "cancelled";
    } else {
      // All other actions require counsellor or admin
      if (!isCounsellorOwner && !isAdmin) {
        return NextResponse.json(ResponseHelper.error("Only the assigned counsellor can perform this action", "FORBIDDEN"), { status: 403 });
      }

      switch (action) {
        case "accept":
          if (!confirmedStart || !confirmedEnd) {
            return NextResponse.json(
              ResponseHelper.error("confirmedStart and confirmedEnd are required to accept"),
              { status: 400 }
            );
          }
          request.status = "accepted";
          request.confirmedStart = new Date(confirmedStart);
          request.confirmedEnd = new Date(confirmedEnd);
          // Generate a deterministic Jitsi room ID from the request document ID
          request.jitsiRoomId = `counselling-${request._id.toString()}`;
          break;

        case "reject":
          request.status = "rejected";
          request.rejectionReason = rejectionReason || "Session declined by counsellor.";
          break;

        case "reschedule":
          if (!confirmedStart || !confirmedEnd) {
            return NextResponse.json(
              ResponseHelper.error("confirmedStart and confirmedEnd are required to reschedule"),
              { status: 400 }
            );
          }
          request.status = "rescheduled";
          request.confirmedStart = new Date(confirmedStart);
          request.confirmedEnd = new Date(confirmedEnd);
          break;

        case "complete":
          request.status = "completed";
          break;

        default:
          return NextResponse.json(
            ResponseHelper.error(`Unknown action: ${action}. Valid actions: accept, reject, reschedule, complete, cancel`),
            { status: 400 }
          );
      }
    }

    if (notes !== undefined) request.notes = notes;
    await request.save();

    if (action !== "cancel" || isCounsellorOwner || isAdmin) {
      if (request.parentUserId) {
        let title = "Counselling Request Updated";
        let content = "Your counselling request has been updated.";
        
        if (action === "accept") {
          title = "Counselling Request Accepted";
          content = "Your counselling request has been accepted by the counsellor.";
        } else if (action === "reject") {
          title = "Counselling Request Declined";
          content = "Your counselling request has been declined by the counsellor.";
        } else if (action === "reschedule") {
          title = "Counselling Request Rescheduled";
          content = "Your counselling request has been rescheduled by the counsellor.";
        } else if (action === "cancel") {
          title = "Counselling Request Cancelled";
          content = "Your counselling request has been cancelled by the counsellor.";
        } else if (action === "complete") {
          title = "Counselling Session Completed";
          content = "Your counselling session has been marked as completed.";
        }
        
        await Notification.create({
          recipient: request.parentUserId,
          sender: userContext.userId,
          title,
          content,
          eventSource: "counselling",
          status: "active",
        });
      }
    }

    return NextResponse.json(
      ResponseHelper.success(`Request ${action}ed successfully`, request),
      { status: 200 }
    );
  })
);
