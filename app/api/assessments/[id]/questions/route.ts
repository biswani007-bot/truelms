import { NextRequest, NextResponse } from "next/server";
import { withRoles } from "../../../../../middleware/auth.middleware";
import { ResponseHelper } from "../../../../../helpers/response";
import { apiHandler } from "../../../../../utils/api-handler";
import { connectDB } from "../../../../../config/db";
import { Assessment } from "../../../../../models/assessment.model";
import { QuestionBank } from "../../../../../models/question-bank.model";
import { AssessmentQuestion } from "../../../../../models/assessment-question.model";
import { AssessmentAttempt } from "../../../../../models/assessment-attempt.model";
import { AssessmentService } from "../../../../../services/assessment/assessment.service";
import { ApiError } from "../../../../../utils/api-error";
import { ERROR_CODES } from "../../../../../constants/error-codes";
import mongoose from "mongoose";

// GET questions for an assessment
export const GET = withRoles(
  ["Admin", "Super Admin", "Academic Manager", "Teacher", "Student", "Parent"],
  apiHandler(async (req: NextRequest, userContext: any, { params }: { params: Promise<{ id: string }> }) => {
    await connectDB();
    const { id: assessmentId } = await params;

    const assessment: any = await Assessment.findById(assessmentId);
    if (!assessment) {
      throw new ApiError(404, "Assessment not found", ERROR_CODES.NOT_FOUND);
    }

    if (userContext.role === "Teacher") {
      const teacherContext = await AssessmentService.getTeacherContext(userContext.userId);
      const isAuthorized = AssessmentService.isTeacherAuthorized(
        assessment,
        teacherContext?.teacherDoc?._id,
        userContext.userId,
        teacherContext?.teacherBatchIdStrings || []
      );
      if (!isAuthorized) {
        throw new ApiError(403, "Not authorized to access questions for this assessment", ERROR_CODES.FORBIDDEN);
      }
    }

    const assessmentQuestions = await AssessmentQuestion.find({ assessment: assessmentId })
      .populate("questionBank")
      .sort({ displayOrder: 1 });

    return NextResponse.json(ResponseHelper.success("Questions fetched successfully", assessmentQuestions), {
      status: 200,
    });
  })
);

// POST save questions for an assessment (Replaces existing questions)
export const POST = withRoles(
  ["Admin", "Super Admin", "Academic Manager", "Teacher"],
  apiHandler(async (req: NextRequest, userContext: any, { params }: { params: Promise<{ id: string }> }) => {
    await connectDB();
    const { id: assessmentId } = await params;
    const body = await req.json();

    const { questions } = body;
    if (!Array.isArray(questions)) {
      throw new ApiError(400, "Questions array is required", ERROR_CODES.VALIDATION_ERROR);
    }

    const assessment: any = await Assessment.findById(assessmentId);
    if (!assessment) {
      throw new ApiError(404, "Assessment not found", ERROR_CODES.NOT_FOUND);
    }

    if (userContext.role === "Teacher") {
      const teacherContext = await AssessmentService.getTeacherContext(userContext.userId);
      const isAuthorized = AssessmentService.isTeacherAuthorized(
        assessment,
        teacherContext?.teacherDoc?._id,
        userContext.userId,
        teacherContext?.teacherBatchIdStrings || []
      );
      if (!isAuthorized) {
        throw new ApiError(403, "Not authorized to modify questions for this assessment", ERROR_CODES.FORBIDDEN);
      }
    }

    const attemptCount = await AssessmentAttempt.countDocuments({ assessment: assessmentId, isDeleted: { $ne: true } });
    if (attemptCount > 0) {
      throw new ApiError(400, "Cannot modify questions after student attempts have started", ERROR_CODES.VALIDATION_ERROR);
    }

    if (assessment.status !== "draft" && assessment.status !== "scheduled" && attemptCount > 0) {
      throw new ApiError(403, "Cannot modify questions for running or completed assessments", ERROR_CODES.FORBIDDEN);
    }

    
    try {
      // 1. Remove existing questions for this assessment
      await AssessmentQuestion.deleteMany({ assessment: assessmentId });

      const createdQuestions = [];
      let order = 1;

      // 2. Create/Reuse QuestionBank entries and link them
      for (const q of questions) {
        let questionBankId;

        if (q.questionBankId) {
          questionBankId = q.questionBankId;
        } else {
          // Create new QuestionBank entry for the assessment
          const newQ = await QuestionBank.create(
            [
              {
                questionCode: `QB-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                questionText: q.questionText,
                category: assessment.course.toString(), // Group by course
                difficultyLevel: q.difficultyLevel || "medium",
                marks: q.marks || 5,
                type: q.type || "MCQ",
                options: q.options || [],
                correctAnswer: q.correctAnswer,
                mediaAttachments: q.mediaAttachments || [],
                createdBy: userContext.userId
              },
            ]
          );
          questionBankId = newQ[0]._id;
        }

        const aq = await AssessmentQuestion.create(
          [
            {
              assessment: assessmentId,
              questionBank: questionBankId,
              marksOverride: q.marks,
              displayOrder: order++,
            },
          ]
        );
        createdQuestions.push(aq[0]);
      }

      

      return NextResponse.json(ResponseHelper.success("Questions saved successfully", createdQuestions), {
        status: 201,
      });
    } catch (err) {
      
      throw err;
    }
  })
);
