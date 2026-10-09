import { AdmissionOffer, IAdmissionOffer } from "../models/admission-offer.model";
import { BaseRepository } from "./base.repository";

export class AdmissionOfferRepository extends BaseRepository<IAdmissionOffer> {
  constructor() {
    super(AdmissionOffer);
  }
}

export const admissionOfferRepository = new AdmissionOfferRepository();
