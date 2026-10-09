import { LeadFollowUp, ILeadFollowUp } from "../models/lead-followup.model";
import { BaseRepository } from "./base.repository";

export class LeadFollowUpRepository extends BaseRepository<ILeadFollowUp> {
  constructor() {
    super(LeadFollowUp);
  }
}

export const leadFollowUpRepository = new LeadFollowUpRepository();
