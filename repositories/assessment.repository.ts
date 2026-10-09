import { Assessment, IAssessment } from "../models/assessment.model";
import { BaseRepository } from "./base.repository";
import "../models/course.model";
import "../models/batch.model";
import "../models/user.model";
import "../models/teacher.model";

class AssessmentRepository extends BaseRepository<IAssessment> {
  constructor() {
    super(Assessment);
  }
}

export const assessmentRepository = new AssessmentRepository();
