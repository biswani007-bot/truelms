import { AssignmentRubric, IAssignmentRubric } from "../models/assignment-rubric.model";
import { BaseRepository } from "./base.repository";

class AssignmentRubricRepository extends BaseRepository<IAssignmentRubric> {
  constructor() {
    super(AssignmentRubric);
  }
}

export const assignmentRubricRepository = new AssignmentRubricRepository();
