/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { withRoles } from "../../../../../../middleware/auth.middleware";
import { BatchTeacher } from "../../../../../../models/batch-teacher.model";
import { batchTimelineRepository } from "../../../../../../repositories/batch-timeline.repository";
import { ResponseHelper } from "../../../../../../helpers/response";
import { apiHandler } from "../../../../../../utils/api-handler";
import { connectDB } from "../../../../../../config/db";

interface RouteParams {
  params: Promise<{ id: string; assignmentId: string }>;
}

// DELETE — Remove a specific BatchTeacher assignment (soft-delete to "removed")
export const DELETE = withRoles(
  ["Admin", "Super Admin", "Academic Manager"],
  apiHandler(async (req: NextRequest, userContext: any, routeCtx: RouteParams) => {
    await connectDB();
    const { id, assignmentId } = await routeCtx.params;

    const assignment = await BatchTeacher.findOne({
      _id: assignmentId,
      batch: id,
      isDeleted: { $ne: true },
    });

    if (!assignment) {
      return NextResponse.json(
        ResponseHelper.error("Assignment not found or already removed", "NOT_FOUND"),
        { status: 404 }
      );
    }

    // Soft-status update rather than hard delete to preserve audit trail
    assignment.status = "removed";
    await assignment.save();

    const batchUpdate: { $unset: Record<string, any> } = { $unset: {} };
    if (assignment.role === "primary") batchUpdate.$unset.primaryTeacher = "";
    if (assignment.role === "assistant") batchUpdate.$unset.assistantTeacher = "";
    if (assignment.role === "mentor") batchUpdate.$unset.mentor = "";
    if (Object.keys(batchUpdate.$unset).length > 0) {
      const mongoose = (await import("mongoose")).default;
      await mongoose.models.Batch.findByIdAndUpdate(id, batchUpdate);
    }

    await batchTimelineRepository.create({
      batch: id as any,
      event: "teacher-removed",
      description: `Teacher assignment (${assignment.role}) removed from batch`,
      performedBy: userContext.userId as any,
      referenceId: assignment.teacher as any,
      referenceType: "teacher",
    });

    return NextResponse.json(
      ResponseHelper.success("Teacher assignment removed successfully", { id: assignmentId }),
      { status: 200 }
    );
  })
);

// PATCH — Update role / notes for an existing assignment
export const PATCH = withRoles(
  ["Admin", "Super Admin", "Academic Manager"],
  apiHandler(async (req: NextRequest, userContext: any, routeCtx: RouteParams) => {
    await connectDB();
    const { id, assignmentId } = await routeCtx.params;
    const body = await req.json();

    const assignment = await BatchTeacher.findOne({
      _id: assignmentId,
      batch: id,
      status: "active",
    });

    if (!assignment) {
      return NextResponse.json(
        ResponseHelper.error("Active assignment not found", "NOT_FOUND"),
        { status: 404 }
      );
    }

    const { role, notes, isOverride } = body;
    if (role) assignment.role = role;
    if (notes !== undefined) assignment.notes = notes;
    if (isOverride !== undefined) assignment.isOverride = isOverride;
    await assignment.save();

    await batchTimelineRepository.create({
      batch: id as any,
      event: "teacher-updated",
      description: `Teacher assignment updated: role=${assignment.role}`,
      performedBy: userContext.userId as any,
      referenceId: assignment.teacher as any,
      referenceType: "teacher",
    });

    return NextResponse.json(
      ResponseHelper.success("Assignment updated", assignment),
      { status: 200 }
    );
  })
);
