import { AssessmentResult, IAssessmentResult } from "../models/assessment-result.model";
import { BaseRepository } from "./base.repository";

class AssessmentResultRepository extends BaseRepository<IAssessmentResult> {
  constructor() {
    super(AssessmentResult);
  }
}

export const assessmentResultRepository = new AssessmentResultRepository();
