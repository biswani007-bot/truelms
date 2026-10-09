import { LiveClassResource, ILiveClassResource } from "../models/live-class-resource.model";
import { BaseRepository } from "./base.repository";

class LiveClassResourceRepository extends BaseRepository<ILiveClassResource> {
  constructor() {
    super(LiveClassResource);
  }
}

export const liveClassResourceRepository = new LiveClassResourceRepository();
