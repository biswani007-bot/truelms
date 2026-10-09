import { NextRequest, NextResponse } from "next/server";
import { withRoles } from "../../../../middleware/auth.middleware";
import { questionBankRepository } from "../../../../repositories/question-bank.repository";
import { ResponseHelper } from "../../../../helpers/response";
import { apiHandler } from "../../../../utils/api-handler";
import { PaginationSchema } from "../../../../dtos/pagination.dto";
import { connectDB } from "../../../../config/db";
import { ApiError } from "../../../../utils/api-error";
import { ERROR_CODES } from "../../../../constants/error-codes";

// GET Paginated Questions
export const GET = withRoles(
  ["Admin", "Super Admin", "Academic Manager", "Teacher"],
  apiHandler(async (req: NextRequest) => {
    await connectDB();
    const url = new URL(req.url);
    const paginationInput = PaginationSchema.parse({
      page: url.searchParams.get("page"),
      limit: url.searchParams.get("limit"),
      search: url.searchParams.get("search") || undefined,
      sort: url.searchParams.get("sort") || "createdAt",
      order: url.searchParams.get("order") || "desc",
    });

    const category = url.searchParams.get("category");
    const difficultyLevel = url.searchParams.get("difficultyLevel");
    const type = url.searchParams.get("type");
    const tags = url.searchParams.get("tags");

    if (category) paginationInput.filters.category = category;
    if (difficultyLevel) paginationInput.filters.difficultyLevel = difficultyLevel;
    if (type) paginationInput.filters.type = type;
    if (tags) {
      const tagsArray = tags.split(',').map(t => t.trim()).filter(Boolean);
      if (tagsArray.length > 0) {
         paginationInput.filters.tags = { $in: tagsArray };
      }
    }

    const searchableFields = ["questionCode", "questionText", "category", "tags"];
    const result = await questionBankRepository.paginate(paginationInput, searchableFields);

    return NextResponse.json(ResponseHelper.success("Questions fetched successfully", result.data, result.meta), { status: 200 });
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

// POST Create Question
export const POST = withRoles(
  ["Admin", "Super Admin", "Academic Manager", "Teacher"],
  apiHandler(async (req: NextRequest, userContext: any) => {
    await connectDB();
    const body = await req.json();

    validateQuestionData(body);

    const count = await questionBankRepository.count();
    const questionCode = `QB-${Date.now()}-${String(count + 1).padStart(4, "0")}`;

    const question = await questionBankRepository.create({
      ...body,
      questionCode,
      createdBy: userContext.userId as any
    });

    return NextResponse.json(ResponseHelper.success("Question created successfully", question), { status: 201 });
  })
);
