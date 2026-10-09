/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "../../../../middleware/auth.middleware";
import { CounsellingRequest } from "../../../../models/counselling-request.model";
import { Parent } from "../../../../models/parent.model";
import { ResponseHelper } from "../../../../helpers/response";
import { apiHandler } from "../../../../utils/api-handler";
import { connectDB } from "../../../../config/db";

/**
 * GET /api/counselling/my-requests
 * Returns all counselling requests for the authenticated parent.
 */
export const GET = withAuth(
  apiHandler(async (_req: NextRequest, userContext: any) => {
    await connectDB();

    const parent = await Parent.findOne({
      user: userContext.userId,
      isDeleted: { $ne: true },
    }).lean();

    if (!parent) {
      return NextResponse.json(
        ResponseHelper.error("No parent profile found for this account", "NOT_FOUND"),
        { status: 404 }
      );
    }

    const requests = await CounsellingRequest.find({
      parent: (parent as any)._id,
      isDeleted: { $ne: true },
    })
      .populate("counsellor", "firstName lastName designation")
      .populate("student", "firstName lastName studentId")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(
      ResponseHelper.success("Your counselling requests fetched", requests),
      { status: 200 }
    );
  })
);
