import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { getAuthenticatedParent } from "@/lib/auth/parent-auth";
import { ParentService } from "@/services/parent/parent.service";
import { ApiResponse } from "@/utils/api-response";
import { apiHandler } from "@/utils/api-handler";

export const GET = apiHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const { parent } = await getAuthenticatedParent(req);
  const { searchParams } = new URL(req.url);
  const teacherId = searchParams.get("teacherId") || undefined;

  const data = await ParentService.getChildMessages(parent._id, id, teacherId);
  return NextResponse.json(ApiResponse.success("Messages retrieved successfully", data));
});

export const POST = apiHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const { parent, user } = await getAuthenticatedParent(req);
  const body = await req.json();

  const userObjectId = parent.user as mongoose.Types.ObjectId;
  const data = await ParentService.sendChildMessage(parent._id, id, body, userObjectId);
  return NextResponse.json(ApiResponse.success("Message sent successfully", data), { status: 201 });
});
