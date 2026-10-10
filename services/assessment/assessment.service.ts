/* eslint-disable @typescript-eslint/no-explicit-any */
import { assessmentRepository } from "../../repositories/assessment.repository";
import { TimelineService } from "./timeline.service";
import { Assessment } from "../../models/assessment.model";

import mongoose from "mongoose";
import { Batch } from "../../models/batch.model";
import { BatchTeacher } from "../../models/batch-teacher.model";
import { Teacher } from "../../models/teacher.model";

export class AssessmentService {
  static async getTeacherContext(userId: string) {
    if (!userId) return null;
    const teacherDoc: any = await Teacher.findOne({ user: userId }).lean();
    if (!teacherDoc) return null;

    const directBatches: any = await Batch.find({
      $or: [
        { primaryTeacher: teacherDoc._id },
        { assistantTeacher: teacherDoc._id },
        { mentor: teacherDoc._id },
      ],
    }).lean();

    const assignedBatchTeachers: any = await BatchTeacher.find({
      teacher: teacherDoc._id,
      status: "active",
    }).lean();

    const batchIdSet = new Set<string>();
    for (const b of directBatches) {
      batchIdSet.add(b._id.toString());
    }
    for (const bt of assignedBatchTeachers) {
      if (bt.batch) {
        batchIdSet.add(bt.batch.toString());
      }
    }

    const teacherBatchIdStrings = Array.from(batchIdSet);
    const teacherBatchIds = teacherBatchIdStrings.map((id) => new mongoose.Types.ObjectId(id));

    return {
      teacherDoc,
      teacherBatchIds,
      teacherBatchIdStrings,
    };
  }

  static isTeacherAuthorized(
    assessment: any,
    teacherDocId: any,
    userId: string,
    teacherBatchIdStrings: string[]
  ): boolean {
    if (!assessment) return false;

    // Check if teacher is assigned owner
    const asmTeacherId = assessment.teacher?._id?.toString() || assessment.teacher?.toString();
    if (teacherDocId && asmTeacherId === teacherDocId.toString()) {
      return true;
    }

    // Check if createdBy matches teacher's User ID
    const asmCreatedBy = assessment.createdBy?._id?.toString() || assessment.createdBy?.toString();
    if (userId && asmCreatedBy === userId.toString()) {
      return true;
    }

    // Check if assessment batch is among teacher's assigned batches
    const asmBatchId = assessment.batch?._id?.toString() || assessment.batch?.toString();
    if (asmBatchId && teacherBatchIdStrings.includes(asmBatchId)) {
      return true;
    }

    return false;
  }

  static async createAssessment(data: any, userId?: string) {
    const assessment = await assessmentRepository.create(data);
    await TimelineService.logEvent(assessment._id.toString(), "created", "Assessment draft created", userId);
    return assessment;
  }

  static async publishAssessment(id: string, userId?: string) {
    const updated = await Assessment.findByIdAndUpdate(id, { status: "published" }, { new: true });
    await TimelineService.logEvent(id, "published", "Assessment schedule published to cohort", userId);
    return updated;
  }

  static async startAssessment(id: string, userId?: string) {
    const updated = await Assessment.findByIdAndUpdate(id, { status: "running" }, { new: true });
    await TimelineService.logEvent(id, "started", "Assessment status updated to running", userId);
    return updated;
  }

  static async completeAssessment(id: string, userId?: string) {
    const updated = await Assessment.findByIdAndUpdate(id, { status: "completed" }, { new: true });
    await TimelineService.logEvent(id, "evaluated", "Assessment window closed", userId);
    return updated;
  }
}
