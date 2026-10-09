import { NextRequest, NextResponse } from "next/server";
import { withRoles } from "../../../../middleware/auth.middleware";
import { ResponseHelper } from "../../../../helpers/response";
import { apiHandler } from "../../../../utils/api-handler";
import { connectDB } from "../../../../config/db";
import { Batch } from "../../../../models/batch.model";
import { BatchTeacher } from "../../../../models/batch-teacher.model";
import { Teacher } from "../../../../models/teacher.model";
import { Course } from "../../../../models/course.model";
import { Cohort } from "../../../../models/cohort.model";

export const GET = withRoles(
  ["Teacher"],
  apiHandler(async (req: NextRequest, userContext: any) => {
    await connectDB();

    console.log("Teacher Batches Route - userContext:", userContext);
    const teacher: any = await Teacher.findOne({ user: userContext.userId || userContext.id || userContext._id }).lean();
    console.log("Teacher Batches Route - found teacher:", teacher ? teacher._id : "None");
    if (!teacher) {
      return NextResponse.json(ResponseHelper.error("Not a valid teacher", "NOT_FOUND"), { status: 404 });
    }

    const directBatches: any = await Batch.find({
      $or: [
        { primaryTeacher: teacher._id },
        { assistantTeacher: teacher._id },
        { mentor: teacher._id },
      ],
    }).populate("course cohort").lean();

    const assignedBatchTeachers: any = await BatchTeacher.find({ teacher: teacher._id, status: "active" })
      .populate({ path: "batch", populate: ["course", "cohort"] })
      .lean();

    const batchMap = new Map();
    for (const b of directBatches) {
      batchMap.set(b._id.toString(), b);
    }
    for (const bt of assignedBatchTeachers) {
      if (bt.batch) {
        batchMap.set((bt.batch as any)._id.toString(), bt.batch);
      }
    }

    const batches = Array.from(batchMap.values());
    console.log("TEACHER BATCHES DEBUG:", JSON.stringify(batches.map(b => ({ _id: b._id, course: b.course })), null, 2));

    return NextResponse.json(
      ResponseHelper.success("Fetched assigned batches successfully", batches),
      { status: 200 }
    );
  })
);
