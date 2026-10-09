
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
  apiHandler(async (req: NextRequest, _userContext: any, routeCtx: RouteParams) => {
    await connectDB();
    const { id } = await routeCtx.params;
    const body = await req.json();

    const updated = await assessmentRepository.update(id, body);
    if (!updated) {
      return NextResponse.json(ResponseHelper.error("Assessment not found"), { status: 404 });
    }

    return NextResponse.json(ResponseHelper.success("Assessment details updated", updated), { status: 200 });
  })
);

// DELETE Soft-delete Assessment
export const DELETE = withRoles(
  ["Admin", "Super Admin"],
  apiHandler(async (_req: NextRequest, _ctx: any, routeCtx: RouteParams) => {
    await connectDB();
    const { id } = await routeCtx.params;

    const deleted = await assessmentRepository.softDelete(id);
    if (!deleted) {
      return NextResponse.json(ResponseHelper.error("Assessment not found"), { status: 404 });
    }

    return NextResponse.json(ResponseHelper.success("Assessment profile deleted", deleted), { status: 200 });
  })
);
