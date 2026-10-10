/**
 * @swagger
 * /api/batches/{id}/students:
 *   post:
 *     summary: Auto-generated summary for POST /api/batches/{id}/students
 *     tags: [batches]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 */

/**
 * @swagger
 * /api/batches/{id}/students:
 *   get:
 *     summary: Auto-generated summary for GET /api/batches/{id}/students
 *     tags: [batches]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import { withRoles } from "../../../../../middleware/auth.middleware";
import { batchStudentRepository } from "../../../../../repositories/batch-student.repository";
import { ResponseHelper } from "../../../../../helpers/response";
import { apiHandler } from "../../../../../utils/api-handler";
import { connectDB } from "../../../../../config/db";
import { AssignmentService } from "../../../../../services/batch/assignment.service";
import { CapacityService } from "../../../../../services/batch/capacity.service";
import { RosterEligibilityService } from "../../../../../services/batch/roster-eligibility.service";
import { Batch } from "../../../../../models/batch.model";
import { Enrollment } from "../../../../../models/enrollment.model";
import { BatchStudent } from "../../../../../models/batch-student.model";

interface RouteParams {
  params: Promise<{ id: string }>;
}

async function resolveBatchId(req: NextRequest, ctx1?: any, ctx2?: any): Promise<string | undefined> {
  const p2 = ctx2?.params;
  if (p2) {
    const resolved = typeof p2.then === "function" ? await p2 : p2;
    if (resolved?.id) return resolved.id;
  }
  const p1 = ctx1?.params;
  if (p1) {
    const resolved = typeof p1.then === "function" ? await p1 : p1;
    if (resolved?.id) return resolved.id;
  }
  const pathname = req.nextUrl?.pathname || new URL(req.url).pathname;
  const match = pathname.match(/\/batches\/([^/]+)/);
  return match ? match[1] : undefined;
}

// GET Student roster or eligible students for batch
export const GET = withRoles(
  ["Admin", "Super Admin", "Academic Manager", "Teacher"],
  apiHandler(async (req: NextRequest, _ctx: any, routeCtx: RouteParams) => {
    await connectDB();
    const id = await resolveBatchId(req, _ctx, routeCtx);

    const url = new URL(req.url);
    const eligibleOnly = url.searchParams.get("eligible") === "true" || url.searchParams.get("eligible") === "1";
    const search = url.searchParams.get("search") || undefined;

    if (eligibleOnly) {
      if (!id) {
        return NextResponse.json(ResponseHelper.error("Batch ID required"), { status: 400 });
      }
      const result = await RosterEligibilityService.getEligibleStudentsForBatch(id, search);
      if (!result) {
        return NextResponse.json(
          ResponseHelper.error("Batch not found"),
          { status: 404 }
        );
      }
      return NextResponse.json(
        ResponseHelper.success("Fetched eligible students successfully", result.eligibleStudents),
        { status: 200 }
      );
    }

    if (!id) {
      return NextResponse.json(ResponseHelper.error("Batch ID required"), { status: 400 });
    }

    if (_ctx?.role === "Teacher") {
      const { Teacher } = await import("../../../../../models/teacher.model");
      const { BatchTeacher } = await import("../../../../../models/batch-teacher.model");
      const teacher: any = await Teacher.findOne({ user: _ctx.userId || _ctx.id || _ctx._id }).lean();
      if (!teacher) {
        return NextResponse.json(ResponseHelper.error("Not authorized as teacher", "FORBIDDEN"), { status: 403 });
      }
      const directBatch = await Batch.findOne({
        _id: id,
        $or: [
          { primaryTeacher: teacher._id },
          { assistantTeacher: teacher._id },
          { mentor: teacher._id },
        ],
      }).lean();
      const assignedBt = !directBatch
        ? await BatchTeacher.findOne({ batch: id, teacher: teacher._id, status: "active" }).lean()
        : null;
      if (!directBatch && !assignedBt) {
        return NextResponse.json(
          ResponseHelper.error("Access Denied: You are not assigned to this batch", "FORBIDDEN"),
          { status: 403 }
        );
      }
    }

    const students = await batchStudentRepository.findMany(
      { batch: id, status: "active" },
      { populate: ["student", "enrollment"] }
    );

    return NextResponse.json(
      ResponseHelper.success("Batch students fetched", students),
      { status: 200 }
    );
  })
);

// POST Assign student to batch with authoritative eligibility and capacity verification
export const POST = withRoles(
  ["Admin", "Super Admin", "Academic Manager"],
  apiHandler(async (req: NextRequest, userContext: any, routeCtx: RouteParams) => {
    await connectDB();
    const id = await resolveBatchId(req, userContext, routeCtx);
    const body = await req.json().catch(() => ({}));

    let { studentId, enrollmentId, priority, forceManual, student } = body;
    if (!studentId && student) studentId = student;

    // 1. Verify batch exists
    if (!id || !mongoose.isValidObjectId(id)) {
      return NextResponse.json(ResponseHelper.error("Invalid batch ID"), { status: 400 });
    }
    const batch = await Batch.findById(id);
    if (!batch || (batch as any).isDeleted) {
      return NextResponse.json(ResponseHelper.error("Batch not found"), { status: 404 });
    }

    if (!studentId || !mongoose.isValidObjectId(studentId)) {
      return NextResponse.json(
        ResponseHelper.error("Valid studentId is required"),
        { status: 400 }
      );
    }

    // 2. Check if student is already actively assigned to this batch
    const alreadyAssigned = await BatchStudent.findOne({
      batch: id,
      student: studentId,
      status: "active",
      isDeleted: { $ne: true },
    });
    if (alreadyAssigned) {
      return NextResponse.json(
        ResponseHelper.error("Student is already assigned to this batch.", "ALREADY_ASSIGNED"),
        { status: 400 }
      );
    }

    // 3. Enforce batch capacity
    const capacitySnapshot = await CapacityService.getSnapshot(id);
    const activeStudentCount = await BatchStudent.countDocuments({
      batch: id,
      status: "active",
      isDeleted: { $ne: true },
    });
    const maxAllowed = batch.maxCapacity ?? capacitySnapshot.maxCapacity;
    if (activeStudentCount >= maxAllowed || capacitySnapshot.isFull) {
      return NextResponse.json(
        ResponseHelper.error("Batch is at maximum capacity. Cannot assign more students.", "BATCH_FULL"),
        { status: 400 }
      );
    }

    // 4. Resolve and validate student enrollment
    let enr = null;
    if (enrollmentId && mongoose.isValidObjectId(enrollmentId)) {
      enr = await Enrollment.findById(enrollmentId);
    }

    if (!enr) {
      enr = await Enrollment.findOne({
        student: studentId,
        course: batch.course,
        status: { $in: ["confirmed", "batch-assigned", "learning-started"] },
        isDeleted: { $ne: true },
      }).sort({ enrollmentDate: -1 });
    }

    if (!enr) {
      // Check for unpaid enrollment to provide precise diagnostic
      const unpaidEnr = await Enrollment.findOne({
        student: studentId,
        course: batch.course,
        status: "waiting-payment",
      });
      if (unpaidEnr) {
        return NextResponse.json(
          ResponseHelper.error(
            "Student enrollment is waiting for payment. Only paid/confirmed enrollments can be assigned to a batch.",
            "UNPAID_ENROLLMENT"
          ),
          { status: 400 }
        );
      }
      return NextResponse.json(
        ResponseHelper.error(
          "No valid confirmed enrollment found for this student in the batch course.",
          "NO_ELIGIBLE_ENROLLMENT"
        ),
        { status: 400 }
      );
    }

    // 5. Verify course relationship
    if (enr.course.toString() !== batch.course.toString()) {
      return NextResponse.json(
        ResponseHelper.error("Student enrollment belongs to a different course.", "COURSE_MISMATCH"),
        { status: 400 }
      );
    }

    // 6. Verify enrollment is paid/confirmed
    if (!["confirmed", "batch-assigned", "learning-started"].includes(enr.status)) {
      return NextResponse.json(
        ResponseHelper.error(
          `Cannot assign student: enrollment status is "${enr.status}". Must be confirmed/paid.`,
          "INVALID_ENROLLMENT_STATUS"
        ),
        { status: 400 }
      );
    }

    // 7. Perform roster assignment
    const result = await AssignmentService.assignStudent({
      batchId: id,
      studentId,
      enrollmentId: enr._id.toString(),
      userId: userContext.userId,
      forceManual: true,
      priority: priority ?? "normal",
    });

    if (result.type === "assigned") {
      enr.status = "batch-assigned";
      await enr.save();
    }

    const message =
      result.type === "assigned"
        ? "Student assigned to batch successfully"
        : "Batch is full – student added to waiting list";

    return NextResponse.json(
      ResponseHelper.success(message, result),
      { status: result.type === "assigned" ? 201 : 202 }
    );
  })
);
