import { NextRequest, NextResponse } from "next/server";
import { withRoles } from "../../../../../middleware/auth.middleware";
import { questionBankRepository } from "../../../../../repositories/question-bank.repository";
import { ResponseHelper } from "../../../../../helpers/response";
import { apiHandler } from "../../../../../utils/api-handler";
import { connectDB } from "../../../../../config/db";

export const POST = withRoles(
  ["Admin", "Super Admin", "Academic Manager", "Teacher"],
  apiHandler(async (req: NextRequest) => {
    await connectDB();
    const body = await req.json();
    if (!Array.isArray(body.texts)) {
      return NextResponse.json(ResponseHelper.error("Expected array of texts"), { status: 400 });
    }

    const existing = await (questionBankRepository as any).model.find({ 
      questionText: { $in: body.texts } 
    }).select("questionText").lean();

    const existingTexts = existing.map((doc: any) => doc.questionText);

    return NextResponse.json(ResponseHelper.success("Checked duplicates", existingTexts), { status: 200 });
  })
);
