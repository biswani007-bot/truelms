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
    const body = await req.json();
    if (!Array.isArray(body.questions)) {
      return NextResponse.json(ResponseHelper.error("Expected array of questions"), { status: 400 });
    }

    const results = {
      created: 0,
      skipped: 0,
      failed: 0,
      errors: [] as any[]
    };

    let count = await questionBankRepository.count();

    for (let i = 0; i < body.questions.length; i++) {
      const q = body.questions[i];
      try {
        if (!q.questionText || !q.type || !q.category || !q.difficultyLevel || !q.marks) {
          throw new Error("Missing required fields");
        }
        
        count++;
        const questionCode = `QB-${Date.now()}-${String(count).padStart(4, "0")}`;

        await questionBankRepository.create({
          ...q,
          questionCode,
          createdBy: userContext.userId
        });
        results.created++;
      } catch (err: any) {
        results.failed++;
        results.errors.push({ row: q.rowIndex || i + 1, reason: err.message });
      }
    }

    return NextResponse.json(ResponseHelper.success("Bulk import completed", results), { status: 200 });
  })
);
