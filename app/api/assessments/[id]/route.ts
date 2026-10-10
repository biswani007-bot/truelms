
/**
 * @swagger
 * /api/assessments/{id}:
 *   delete:
 *     summary: Auto-generated summary for DELETE /api/assessments/{id}
 *     tags: [assessments]
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
 * /api/assessments/{id}:
 *   put:
 *     summary: Auto-generated summary for PUT /api/assessments/{id}
 *     tags: [assessments]
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
 * /api/assessments/{id}:
 *   get:
 *     summary: Auto-generated summary for GET /api/assessments/{id}
 *     tags: [assessments]
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
import { NextRequest, NextResponse } from "next/server";
import { withRoles } from "../../../../middleware/auth.middleware";
import { assessmentRepository } from "../../../../repositories/assessment.repository";
import { ResponseHelper } from "../../../../helpers/response";
import { apiHandler } from "../../../../utils/api-handler";
import { connectDB } from "../../../../config/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

import { Assessment } from "../../../../models/assessment.model";
import { AssessmentAttempt } from "../../../../models/assessment-attempt.model";
import { AssessmentService } from "../../../../services/assessment/assessment.service";
import { TimelineService } from "../../../../services/assessment/timeline.service";
import { AssessmentQuestion } from "../../../../models/assessment-question.model";
import "../../../../models/question-bank.model";
import "../../../../models/course.model";
import "../../../../models/batch.model";
import "../../../../models/teacher.model";

// GET Assessment Detail
export const GET = apiHandler(async (req: NextRequest, arg2: any, arg3?: any) => {
  await connectDB();
  const context = (arg3 && arg3.params) ? arg3 : (arg2 && arg2.params ? arg2 : null);
  const rawParams = context ? (context.params instanceof Promise ? await context.params : context.params) : {};
  const id = rawParams?.id;

  if (!id) {
    return NextResponse.json(ResponseHelper.error("Assessment ID is required"), { status: 400 });
  }

  const { verifyAuth } = await import("../../../../middleware/auth.middleware");
  const normalUser = verifyAuth(req);
  let isAuthorized = false;
  let isAdminOrStaff = false;
  
  if (normalUser && ["admin", "super admin", "superadmin", "academic manager", "teacher"].includes(normalUser.role?.toLowerCase() || "")) {
    isAuthorized = true;
    isAdminOrStaff = true;
  } else {
    const { verifyAssessmentAccess } = await import("../../../../lib/auth/assessment-runner-auth");
    const access = await verifyAssessmentAccess(req, id);
    if (access) {
      isAuthorized = true;
    }
  }

  if (!isAuthorized) {
    return NextResponse.json(ResponseHelper.error("Not authorized to access this assessment"), { status: 403 });
  }

  const assessment = await assessmentRepository.findById(id, {
    populate: ["course", "batch", "teacher"],
  });

  if (!assessment) {
    return NextResponse.json(ResponseHelper.error("Assessment profile not found"), { status: 404 });
  }

  // Teacher authorization check
  if (normalUser && normalUser.role?.toLowerCase() === "teacher") {
    const teacherContext = await AssessmentService.getTeacherContext(normalUser.userId);
    const teacherAuthorized = AssessmentService.isTeacherAuthorized(
      assessment,
      teacherContext?.teacherDoc?._id,
      normalUser.userId,
      teacherContext?.teacherBatchIdStrings || []
    );
    if (!teacherAuthorized) {
      return NextResponse.json(ResponseHelper.error("Not authorized to access this assessment"), { status: 403 });
    }
  }

  const questions = await AssessmentQuestion.find({ assessment: id, isDeleted: { $ne: true } })
    .populate({
      path: "questionBank",
      match: { isDeleted: { $ne: true } },
    })
    .sort({ displayOrder: 1 })
    .lean();

  const data = {
    ...assessment.toJSON ? assessment.toJSON() : assessment,
    questions: questions
      .filter((q: any) => q.questionBank)
      .map((q: any) => {
        const qb = q.questionBank || {};
        let qType = qb.type || "MCQ";
        if (qType === "multiple-select") qType = "multiple-select";
        else if (qType === "true-false") qType = "true-false";
        else if (qType === "short-answer") qType = "short-answer";
        else if (qType === "fill-in-the-blanks") qType = "fill-in-the-blanks";
        else if (qType === "essay" || qType === "long-answer" || qType === "written") qType = "essay";
        else qType = "MCQ";

        const mapped: any = {
          _id: q._id?.toString(),
          displayOrder: q.displayOrder,
          marksOverride: q.marksOverride,
          questionBankId: qb._id?.toString(),
          questionCode: qb.questionCode,
          questionText: qb.questionText,
          type: qType,
          marks: q.marksOverride || qb.marks || 5,
          options: Array.isArray(qb.options) ? qb.options : [],
          mediaAttachments: qb.mediaAttachments || [],
        };

        if (isAdminOrStaff) {
          mapped.correctAnswer = qb.correctAnswer;
          mapped.explanation = qb.explanation;
        }

        return mapped;
      }),
  };

  return NextResponse.json(ResponseHelper.success("Assessment profile fetched", data), { status: 200 });
});

// PUT Update Assessment Details
export const PUT = withRoles(
  ["Admin", "Super Admin", "Academic Manager", "Teacher"],
  apiHandler(async (req: NextRequest, userContext: any, routeCtx: RouteParams) => {
    await connectDB();
    const { id } = await routeCtx.params;
    const body = await req.json();

    const assessment: any = await Assessment.findById(id);
    if (!assessment) {
      return NextResponse.json(ResponseHelper.error("Assessment not found"), { status: 404 });
    }

    // Teacher authorization check
    if (userContext.role === "Teacher") {
      const teacherContext = await AssessmentService.getTeacherContext(userContext.userId);
      const isAuthorized = AssessmentService.isTeacherAuthorized(
        assessment,
        teacherContext?.teacherDoc?._id,
        userContext.userId,
        teacherContext?.teacherBatchIdStrings || []
      );
      if (!isAuthorized) {
        return NextResponse.json(ResponseHelper.error("Not authorized to modify this assessment"), { status: 403 });
      }

      const newBatch = body.batch || body.batchId;
      if (newBatch && newBatch.toString() !== assessment.batch.toString()) {
        if (!teacherContext?.teacherBatchIdStrings.includes(newBatch.toString())) {
          return NextResponse.json(ResponseHelper.error("You are not authorized for the selected batch"), { status: 403 });
        }
      }
    }

    // Check attempt lifecycle
    const attemptCount = await AssessmentAttempt.countDocuments({ assessment: id, isDeleted: { $ne: true } });
    if (attemptCount > 0) {
      const newBatch = body.batch || body.batchId;
      if (newBatch && newBatch.toString() !== assessment.batch.toString()) {
        return NextResponse.json(ResponseHelper.error("Cannot modify batch after student attempts have started"), { status: 400 });
      }
      const newCourse = body.course || body.courseId;
      if (newCourse && newCourse.toString() !== assessment.course.toString()) {
        return NextResponse.json(ResponseHelper.error("Cannot modify course after student attempts have started"), { status: 400 });
      }
      if (body.maximumMarks !== undefined && Number(body.maximumMarks) !== assessment.maximumMarks) {
        return NextResponse.json(ResponseHelper.error("Cannot modify maximum marks after student attempts have started"), { status: 400 });
      }
      if (body.type && body.type !== assessment.type) {
        return NextResponse.json(ResponseHelper.error("Cannot modify assessment type after student attempts have started"), { status: 400 });
      }
      if (body.attemptLimit !== undefined && Number(body.attemptLimit) !== assessment.attemptLimit) {
        return NextResponse.json(ResponseHelper.error("Cannot modify attempt limit after student attempts have started"), { status: 400 });
      }
    }

    const updateData: any = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.instructions !== undefined) updateData.instructions = body.instructions;
    if (body.duration !== undefined) updateData.duration = Number(body.duration);
    if (attemptCount === 0) {
      if (body.maximumMarks !== undefined) updateData.maximumMarks = Number(body.maximumMarks);
      if (body.passingMarks !== undefined) updateData.passingMarks = Number(body.passingMarks);
      if (body.type !== undefined) updateData.type = body.type;
      if (body.attemptLimit !== undefined) updateData.attemptLimit = Number(body.attemptLimit);
      if (body.batch || body.batchId) updateData.batch = body.batch || body.batchId;
      if (body.course || body.courseId) updateData.course = body.course || body.courseId;
    } else {
      if (body.passingMarks !== undefined) updateData.passingMarks = Number(body.passingMarks);
    }
    if (body.weightage !== undefined) updateData.weightage = Number(body.weightage);
    if (body.assessmentDate) updateData.assessmentDate = new Date(body.assessmentDate);
    if (body.startTime) updateData.startTime = new Date(body.startTime);
    if (body.endTime) updateData.endTime = new Date(body.endTime);
    if (body.timezone) updateData.timezone = body.timezone;
    if (body.negativeMarking !== undefined) updateData.negativeMarking = Boolean(body.negativeMarking);
    if (body.randomizationEnabled !== undefined) updateData.randomizationEnabled = Boolean(body.randomizationEnabled);
    if (body.visibility) updateData.visibility = body.visibility;
    if (body.status && ["draft", "scheduled", "published"].includes(body.status)) updateData.status = body.status;
    updateData.updatedBy = userContext.userId;

    const updated = await Assessment.findByIdAndUpdate(id, { $set: updateData }, { new: true });
    await TimelineService.logEvent(id, "updated", "Assessment details updated", userContext.userId);

    return NextResponse.json(ResponseHelper.success("Assessment details updated", updated), { status: 200 });
  })
);

// DELETE Soft-delete Assessment
export const DELETE = withRoles(
  ["Admin", "Super Admin", "Teacher"],
  apiHandler(async (_req: NextRequest, userContext: any, routeCtx: RouteParams) => {
    await connectDB();
    const { id } = await routeCtx.params;

    const assessment: any = await Assessment.findById(id);
    if (!assessment) {
      return NextResponse.json(ResponseHelper.error("Assessment not found"), { status: 404 });
    }

    // Teacher authorization check
    if (userContext.role === "Teacher") {
      const teacherContext = await AssessmentService.getTeacherContext(userContext.userId);
      const isAuthorized = AssessmentService.isTeacherAuthorized(
        assessment,
        teacherContext?.teacherDoc?._id,
        userContext.userId,
        teacherContext?.teacherBatchIdStrings || []
      );
      if (!isAuthorized) {
        return NextResponse.json(ResponseHelper.error("Not authorized to delete this assessment"), { status: 403 });
      }
    }

    // Check attempt lifecycle
    const attemptCount = await AssessmentAttempt.countDocuments({ assessment: id, isDeleted: { $ne: true } });
    if (attemptCount > 0) {
      return NextResponse.json(ResponseHelper.error("Cannot delete assessment with existing student attempts or submissions"), { status: 400 });
    }

    const deleted = await assessmentRepository.softDelete(id);
    await TimelineService.logEvent(id, "archived", "Assessment soft-deleted", userContext.userId);

    return NextResponse.json(ResponseHelper.success("Assessment profile deleted", deleted), { status: 200 });
  })
);
