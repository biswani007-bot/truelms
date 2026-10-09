import { AssessmentEvaluation, IAssessmentEvaluation } from "../models/assessment-evaluation.model";
import { BaseRepository } from "./base.repository";

class AssessmentEvaluationRepository extends BaseRepository<IAssessmentEvaluation> {
  constructor() {
    super(AssessmentEvaluation);
  }
}

export const assessmentEvaluationRepository = new AssessmentEvaluationRepository();
