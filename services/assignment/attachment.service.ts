/* eslint-disable @typescript-eslint/no-explicit-any */
import { assignmentAttachmentRepository } from "../../repositories/assignment-attachment.repository";

export class AttachmentService {
  static async addAttachment(assignmentId: string, file: { fileName: string; fileUrl: string; fileSize?: number; fileType: string }) {
    return assignmentAttachmentRepository.create({
      assignment: assignmentId as any,
      ...file,
    });
  }
}
