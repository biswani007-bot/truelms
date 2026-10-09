import { GradeScale, IGradeScale } from "../models/grade-scale.model";
import { BaseRepository } from "./base.repository";

class GradeScaleRepository extends BaseRepository<IGradeScale> {
  constructor() {
    super(GradeScale);
  }
}

export const gradeScaleRepository = new GradeScaleRepository();
