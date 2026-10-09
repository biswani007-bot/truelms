import { Payment, IPayment } from "../models/payment.model";
import { BaseRepository } from "./base.repository";

class PaymentRepository extends BaseRepository<IPayment> {
  constructor() {
    super(Payment);
  }
}

export const paymentRepository = new PaymentRepository();
