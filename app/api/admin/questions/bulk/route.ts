import { NextRequest, NextResponse } from "next/server";
import { withRoles } from "../../../../../middleware/auth.middleware";
import { questionBankRepository } from "../../../../../repositories/question-bank.repository";
import { ResponseHelper } from "../../../../../helpers/response";
import { apiHandler } from "../../../../../utils/api-handler";
import { connectDB } from "../../../../../config/db";

export const POST = withRoles(
  ["Admin", "Super Admin", "Academic Manager", "Teacher"],
  apiHandler(async (req: NextRequest, userContext: any) => {
    await connectDB();
    const { questions } = await req.json();

    if (!Array.isArray(questions)) {
      return NextResponse.json(ResponseHelper.error("Invalid format"), { status: 400 });
    }

    let count = await questionBankRepository.count();
    
    const preparedQuestions = questions.map(q => {
      count++;
      return {
        ...q,
        questionCode: `QB-${Date.now()}-${String(count).padStart(4, "0")}`,
        createdBy: userContext.userId as any
      };
    });

    // In a real scenario, use insertMany
    const created = await Promise.all(preparedQuestions.map(q => questionBankRepository.create(q)));

    return NextResponse.json(ResponseHelper.success("Questions imported successfully", created), { status: 201 });
  })
);
