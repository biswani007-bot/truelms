import { BatchTeacher, IBatchTeacher } from "../models/batch-teacher.model";
import { BaseRepository } from "./base.repository";

class BatchTeacherRepository extends BaseRepository<IBatchTeacher> {
  constructor() {
    super(BatchTeacher);
  }
}

export const batchTeacherRepository = new BatchTeacherRepository();
