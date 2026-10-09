import { NextRequest, NextResponse } from "next/server";
import { withRoles } from "../../../../../middleware/auth.middleware";
import { questionBankRepository } from "../../../../../repositories/question-bank.repository";
import { ResponseHelper } from "../../../../../helpers/response";
import { apiHandler } from "../../../../../utils/api-handler";
import { connectDB } from "../../../../../config/db";
import { ApiError } from "../../../../../utils/api-error";
import { ERROR_CODES } from "../../../../../constants/error-codes";
import mongoose from "mongoose";

// GET Question by ID
export const GET = withRoles(
  ["Admin", "Super Admin", "Academic Manager", "Teacher"],
  apiHandler(async (req: NextRequest, userContext: any, ctx: { params: Promise<{ id: string }> | { id: string } }) => {
    await connectDB();
    const resolvedParams = await Promise.resolve(ctx.params);
    const id = resolvedParams?.id;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError(400, "Invalid question ID", ERROR_CODES.VALIDATION_ERROR);
    }
    const question = await questionBankRepository.findById(id);
    if (!question) {
      throw new ApiError(404, "Question not found", ERROR_CODES.NOT_FOUND);
    }
    return NextResponse.json(ResponseHelper.success("Question fetched successfully", question), { status: 200 });
  })
);

function validateQuestionData(data: any) {
  if (!data.questionText) throw new ApiError(400, "questionText is required", ERROR_CODES.VALIDATION_ERROR);
  if (!data.type) throw new ApiError(400, "type is required", ERROR_CODES.VALIDATION_ERROR);
  if (data.marks <= 0) throw new ApiError(400, "marks must be greater than 0", ERROR_CODES.VALIDATION_ERROR);
  if (!data.category) throw new ApiError(400, "category is required", ERROR_CODES.VALIDATION_ERROR);
  
  if (data.type === "MCQ") {
    if (!data.options || data.options.length < 2) throw new ApiError(400, "MCQ requires at least 2 options", ERROR_CODES.VALIDATION_ERROR);
    if (!data.correctAnswer) throw new ApiError(400, "correctAnswer is required", ERROR_CODES.VALIDATION_ERROR);
    if (!data.options.includes(data.correctAnswer)) throw new ApiError(400, "correctAnswer must exist in options", ERROR_CODES.VALIDATION_ERROR);
  }
  
  if (data.type === "multiple-select") {
    if (!data.options || data.options.length < 2) throw new ApiError(400, "multiple-select requires at least 2 options", ERROR_CODES.VALIDATION_ERROR);
    if (!Array.isArray(data.correctAnswer) || data.correctAnswer.length < 1) throw new ApiError(400, "At least 1 correct answer is required", ERROR_CODES.VALIDATION_ERROR);
    for (const ans of data.correctAnswer) {
      if (!data.options.includes(ans)) throw new ApiError(400, "All correct answers must exist in options", ERROR_CODES.VALIDATION_ERROR);
    }
  }

  if (data.type === "true-false") {
    if (!data.correctAnswer || (data.correctAnswer !== "True" && data.correctAnswer !== "False")) {
       throw new ApiError(400, "true-false requires 'True' or 'False' as correct answer", ERROR_CODES.VALIDATION_ERROR);
    }
  }

  if (data.type === "short-answer" || data.type === "fill-in-the-blanks") {
    if (!data.correctAnswer) throw new ApiError(400, "answer is required", ERROR_CODES.VALIDATION_ERROR);
  }
}

// PUT Update Question
export const PUT = withRoles(
  ["Admin", "Super Admin", "Academic Manager", "Teacher"],
  apiHandler(async (req: NextRequest, userContext: any, ctx: { params: Promise<{ id: string }> | { id: string } }) => {
    await connectDB();
    const resolvedParams = await Promise.resolve(ctx.params);
    const id = resolvedParams?.id;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError(400, "Invalid question ID", ERROR_CODES.VALIDATION_ERROR);
    }

    const body = await req.json();
    validateQuestionData(body);

    const question = await questionBankRepository.update(id, {
      ...body,
      updatedBy: userContext.userId as any
    });

    if (!question) {
      throw new ApiError(404, "Question not found", ERROR_CODES.NOT_FOUND);
    }

    return NextResponse.json(ResponseHelper.success("Question updated successfully", question), { status: 200 });
  })
);

// DELETE Question
export const DELETE = withRoles(
  ["Admin", "Super Admin", "Academic Manager", "Teacher"],
  apiHandler(async (req: NextRequest, userContext: any, ctx: { params: Promise<{ id: string }> | { id: string } }) => {
    await connectDB();
    const resolvedParams = await Promise.resolve(ctx.params);
    const id = resolvedParams?.id;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError(400, "Invalid question ID", ERROR_CODES.VALIDATION_ERROR);
    }

    const question = await questionBankRepository.softDelete(id);

    if (!question) {
      throw new ApiError(404, "Question not found", ERROR_CODES.NOT_FOUND);
    }

    return NextResponse.json(ResponseHelper.success("Question deleted successfully", null), { status: 200 });
  })
);
