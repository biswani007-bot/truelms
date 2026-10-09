import { AssessmentAttempt, IAssessmentAttempt } from "../models/assessment-attempt.model";
import { BaseRepository } from "./base.repository";

class AssessmentAttemptRepository extends BaseRepository<IAssessmentAttempt> {
  constructor() {
    super(AssessmentAttempt);
  }
}

export const assessmentAttemptRepository = new AssessmentAttemptRepository();
