import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../../../config/db";
import { ResponseHelper } from "../../../helpers/response";
import { apiHandler } from "../../../utils/api-handler";
import { verifyAuth } from "../../../middleware/auth.middleware";
import { ApiError } from "../../../utils/api-error";
import { ERROR_CODES } from "../../../constants/error-codes";
import { ParentService } from "../../../services/parent/parent.service";
import mongoose from "mongoose";
import { Parent } from "../../../models/parent.model";

export const GET = apiHandler(async (req: NextRequest) => {
  await connectDB();
  const authUser = await verifyAuth(req);
  if (!authUser || authUser.role !== "Parent") {
    throw new ApiError(403, "Forbidden. Only parents can access this route.", ERROR_CODES.FORBIDDEN);
  }

  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get("studentId");
  const teacherId = searchParams.get("teacherId");

  if (!studentId) {
    throw new ApiError(400, "studentId is required", ERROR_CODES.VALIDATION_ERROR);
  }

  const parent = await Parent.findOne({ user: authUser.userId });
  if (!parent) {
    throw new ApiError(404, "Parent profile not found", ERROR_CODES.NOT_FOUND);
  }

  const result = await ParentService.getChildMessages(parent._id, studentId, teacherId || undefined);

  return NextResponse.json(
    ResponseHelper.success("Messages retrieved successfully", result),
    { status: 200 }
  );
});

export const POST = apiHandler(async (req: NextRequest) => {
  await connectDB();
  const authUser = await verifyAuth(req);
  if (!authUser || authUser.role !== "Parent") {
    throw new ApiError(403, "Forbidden. Only parents can access this route.", ERROR_CODES.FORBIDDEN);
  }

  const body = await req.json();
  const { studentId, teacherId, subject, message } = body;

  if (!studentId || !message) {
    throw new ApiError(400, "studentId and message are required", ERROR_CODES.VALIDATION_ERROR);
  }

  const parent = await Parent.findOne({ user: authUser.userId });
  if (!parent) {
    throw new ApiError(404, "Parent profile not found", ERROR_CODES.NOT_FOUND);
  }

  const result = await ParentService.sendChildMessage(
    parent._id,
    studentId,
    { teacherId, subject, message },
    new mongoose.Types.ObjectId(authUser.userId.toString())
  );

  return NextResponse.json(
    ResponseHelper.success("Message sent successfully", result),
    { status: 201 }
  );
});
