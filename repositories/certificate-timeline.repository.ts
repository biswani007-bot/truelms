import { CertificateTimeline, ICertificateTimeline } from "../models/certificate-timeline.model";
import { BaseRepository } from "./base.repository";

class CertificateTimelineRepository extends BaseRepository<ICertificateTimeline> {
  constructor() {
    super(CertificateTimeline);
  }
}

export const certificateTimelineRepository = new CertificateTimelineRepository();
