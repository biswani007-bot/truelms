import mongoose from "mongoose";
import { ApiKey, IApiKey } from "../models/api-key.model";
import { BaseRepository } from "./base.repository";

class ApiKeyRepository extends BaseRepository<IApiKey> {
  constructor() {
    super(ApiKey as mongoose.Model<IApiKey>);
  }
}

export const apiKeyRepository = new ApiKeyRepository();
