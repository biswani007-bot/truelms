import { AssessmentQuestion, IAssessmentQuestion } from "../models/assessment-question.model";
import { BaseRepository } from "./base.repository";

class AssessmentQuestionRepository extends BaseRepository<IAssessmentQuestion> {
  constructor() {
    super(AssessmentQuestion);
  }
}

export const assessmentQuestionRepository = new AssessmentQuestionRepository();
