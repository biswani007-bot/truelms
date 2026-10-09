import { AssignmentEvaluation, IAssignmentEvaluation } from "../models/assignment-evaluation.model";
import { BaseRepository } from "./base.repository";

class AssignmentEvaluationRepository extends BaseRepository<IAssignmentEvaluation> {
  constructor() {
    super(AssignmentEvaluation);
  }
}

export const assignmentEvaluationRepository = new AssignmentEvaluationRepository();
