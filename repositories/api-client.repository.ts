import { ApiClient, IApiClient } from "../models/api-client.model";
import { BaseRepository } from "./base.repository";

class ApiClientRepository extends BaseRepository<IApiClient> {
  constructor() {
    super(ApiClient);
  }
}

export const apiClientRepository = new ApiClientRepository();
