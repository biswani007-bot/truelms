import { BatchRule, IBatchRule } from "../models/batch-rule.model";
import { BaseRepository } from "./base.repository";

class BatchRuleRepository extends BaseRepository<IBatchRule> {
  constructor() {
    super(BatchRule);
  }
}

export const batchRuleRepository = new BatchRuleRepository();
