import { ApiUsage, IApiUsage } from "../models/api-usage.model";
import { BaseRepository } from "./base.repository";

class ApiUsageRepository extends BaseRepository<IApiUsage> {
  constructor() {
    super(ApiUsage);
  }
}

export const apiUsageRepository = new ApiUsageRepository();
