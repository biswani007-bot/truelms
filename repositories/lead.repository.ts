import { Lead, ILead } from "../models/lead.model";
import { BaseRepository } from "./base.repository";

export class LeadRepository extends BaseRepository<ILead> {
  constructor() {
    super(Lead);
  }
}

export const leadRepository = new LeadRepository();
