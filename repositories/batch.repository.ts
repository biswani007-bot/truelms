import { Batch, IBatch } from "../models/batch.model";
import { BaseRepository } from "./base.repository";
import "../models/cohort.model";
import "../models/course.model";
import "../models/user.model";

class BatchRepository extends BaseRepository<IBatch> {
  constructor() {
    super(Batch);
  }
}

export const batchRepository = new BatchRepository();
