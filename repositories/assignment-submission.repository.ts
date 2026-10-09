import { AssignmentSubmission, IAssignmentSubmission } from "../models/assignment-submission.model";
import { BaseRepository } from "./base.repository";

class AssignmentSubmissionRepository extends BaseRepository<IAssignmentSubmission> {
  constructor() {
    super(AssignmentSubmission);
  }
}

export const assignmentSubmissionRepository = new AssignmentSubmissionRepository();
