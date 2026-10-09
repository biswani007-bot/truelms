import { Partner, IPartner } from "../models/partner.model";
import { BaseRepository } from "./base.repository";

export class PartnerRepository extends BaseRepository<IPartner> {
  constructor() {
    super(Partner);
  }
}

export const partnerRepository = new PartnerRepository();
