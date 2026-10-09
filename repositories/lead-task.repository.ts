import { LeadTask, ILeadTask } from "../models/lead-task.model";
import { BaseRepository } from "./base.repository";

export class LeadTaskRepository extends BaseRepository<ILeadTask> {
  constructor() {
    super(LeadTask);
  }
}

export const leadTaskRepository = new LeadTaskRepository();
