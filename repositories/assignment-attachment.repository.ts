import { AssignmentAttachment, IAssignmentAttachment } from "../models/assignment-attachment.model";
import { BaseRepository } from "./base.repository";

class AssignmentAttachmentRepository extends BaseRepository<IAssignmentAttachment> {
  constructor() {
    super(AssignmentAttachment);
  }
}

export const assignmentAttachmentRepository = new AssignmentAttachmentRepository();
