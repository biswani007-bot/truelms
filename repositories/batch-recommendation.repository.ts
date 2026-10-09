import { BatchRecommendation, IBatchRecommendation } from "../models/batch-recommendation.model";
import { BaseRepository } from "./base.repository";

class BatchRecommendationRepository extends BaseRepository<IBatchRecommendation> {
  constructor() {
    super(BatchRecommendation);
  }
}

export const batchRecommendationRepository = new BatchRecommendationRepository();
