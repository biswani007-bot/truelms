/* eslint-disable @typescript-eslint/no-explicit-any */
import { assignmentRepository } from "../../repositories/assignment.repository";
import { TimelineService } from "./timeline.service";
import { Assignment } from "../../models/assignment.model";

import mongoose from "mongoose";
import { Batch } from "../../models/batch.model";
import { BatchTeacher } from "../../models/batch-teacher.model";
import { Teacher } from "../../models/teacher.model";

export class AssignmentService {
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
    assignment: any,
    teacherDocId: any,
    userId: string,
    teacherBatchIdStrings: string[]
  ): boolean {
    if (!assignment) return false;

    // 1. Check if teacher is assigned owner
    const asmTeacherId = assignment.teacher?._id?.toString() || assignment.teacher?.toString();
    if (teacherDocId && asmTeacherId === teacherDocId.toString()) {
      return true;
    }

    // 2. Check if createdBy matches teacher's User ID
    const asmCreatedBy = assignment.createdBy?._id?.toString() || assignment.createdBy?.toString();
    if (userId && asmCreatedBy === userId.toString()) {
      return true;
    }

    // 3. Check if assignment batch is among teacher's assigned batches
    const asmBatchId = assignment.batch?._id?.toString() || assignment.batch?.toString();
    if (asmBatchId && teacherBatchIdStrings.includes(asmBatchId)) {
      return true;
    }

    return false;
  }

  static async createAssignment(data: any, userId?: string) {
    if (userId && !data.createdBy) {
      data.createdBy = userId;
    }
    const assignment = await assignmentRepository.create(data);
    await TimelineService.logEvent(assignment._id.toString(), "created", "Assignment draft created", userId);
    return assignment;
  }

  static async publishAssignment(id: string, userId?: string) {
    const updated = await Assignment.findByIdAndUpdate(id, { status: "published" }, { new: true });
    await TimelineService.logEvent(id, "published", "Assignment published and visible to students", userId);
    return updated;
  }

  static async closeAssignment(id: string, userId?: string) {
    const updated = await Assignment.findByIdAndUpdate(id, { status: "closed" }, { new: true });
    await TimelineService.logEvent(id, "updated", "Assignment closed for submissions", userId);
    return updated;
  }

  static async archiveAssignment(id: string, userId?: string) {
    const updated = await Assignment.findByIdAndUpdate(id, { status: "archived" }, { new: true });
    await TimelineService.logEvent(id, "archived", "Assignment archived and hidden", userId);
    return updated;
  }
}
