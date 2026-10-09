/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "../../../middleware/auth.middleware";
import { CounsellingRequest } from "../../../models/counselling-request.model";
import { Teacher } from "../../../models/teacher.model";
import { Parent } from "../../../models/parent.model";
import { ResponseHelper } from "../../../helpers/response";
import { apiHandler } from "../../../utils/api-handler";
import { connectDB } from "../../../config/db";
import { Notification } from "../../../models/notification.model";

// GET — List all counsellors (teachers with isCounsellor=true) — accessible to parents
export const GET = withAuth(
  apiHandler(async (_req: NextRequest) => {
    await connectDB();
    const counsellors = await Teacher.find({ isCounsellor: true, status: "active", isDeleted: { $ne: true } })
      .select("_id firstName lastName designation department bio")
      .lean();
    return NextResponse.json(
      ResponseHelper.success("Active counsellors fetched", counsellors),
      { status: 200 }
    );
  })
);

// POST — Parent creates a new counselling request
export const POST = withAuth(
  apiHandler(async (req: NextRequest, userContext: any) => {
    await connectDB();
    const body = await req.json();
    const { counsellorId, studentId, proposedStart, proposedEnd, reason } = body;

    if (!counsellorId || !proposedStart || !proposedEnd || !reason) {
      return NextResponse.json(
        ResponseHelper.error("counsellorId, proposedStart, proposedEnd, and reason are required"),
        { status: 400 }
      );
    }

    // Verify counsellor exists and has the flag
    const counsellor = await Teacher.findOne({ _id: counsellorId, isCounsellor: true, status: "active" });
    if (!counsellor) {
      return NextResponse.json(
        ResponseHelper.error("Counsellor not found or not available"),
        { status: 404 }
      );
    }

    const parent = await Parent.findOne({ user: userContext.userId, isDeleted: { $ne: true } });
    if (!parent) {
      return NextResponse.json(
        ResponseHelper.error("Parent profile not found for this account"),
        { status: 403 }
      );
    }

    if (!studentId) {
      return NextResponse.json(ResponseHelper.error("Child Name (studentId) is required"), { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { ParentStudentLink } = require("../../../models/parent-student-link.model");
    const link = await ParentStudentLink.findOne({ parent: parent._id, student: studentId, status: "active" });
    if (!link) {
      return NextResponse.json(ResponseHelper.error("Unauthorized: Student is not linked to your parent account"), { status: 403 });
    }

    // Conflict check — counsellor shouldn't have overlapping accepted sessions
    const conflict = await CounsellingRequest.findOne({
      counsellor: counsellorId,
      status: { $in: ["accepted", "rescheduled"] },
      $or: [
        { confirmedStart: { $lt: new Date(proposedEnd), $gte: new Date(proposedStart) } },
        { proposedStart: { $lt: new Date(proposedEnd), $gte: new Date(proposedStart) } },
      ],
    });
    if (conflict) {
      return NextResponse.json(
        ResponseHelper.error("Counsellor already has a session in this time slot. Please choose a different time."),
        { status: 409 }
      );
    }

    const request = await CounsellingRequest.create({
      parent: parent._id,
      counsellor: counsellorId,
      student: studentId || undefined,
      proposedStart: new Date(proposedStart),
      proposedEnd: new Date(proposedEnd),
      reason,
      status: "pending",
      recordingEnabled: false,
      parentUserId: userContext.userId,
    });

    if (counsellor.user) {
      await Notification.create({
        recipient: counsellor.user,
        sender: userContext.userId,
        title: "New Counselling Request",
        content: `You have received a new counselling request from ${parent.firstName} ${parent.lastName}.`,
        eventSource: "counselling",
        status: "active",
      });
    }

    return NextResponse.json(
      ResponseHelper.success("Counselling request submitted successfully", request),
      { status: 201 }
    );
  })
);
