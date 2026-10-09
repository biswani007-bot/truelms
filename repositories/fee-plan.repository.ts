import { FeePlan, IFeePlan } from "../models/fee-plan.model";
import { BaseRepository } from "./base.repository";

class FeePlanRepository extends BaseRepository<IFeePlan> {
  constructor() {
    super(FeePlan);
  }
}

export const feePlanRepository = new FeePlanRepository();
