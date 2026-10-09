import { Refund, IRefund } from "../models/refund.model";
import { BaseRepository } from "./base.repository";

class RefundRepository extends BaseRepository<IRefund> {
  constructor() {
    super(Refund);
  }
}

export const refundRepository = new RefundRepository();
