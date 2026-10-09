import { PaymentInstallment, IPaymentInstallment } from "../models/payment-installment.model";
import { BaseRepository } from "./base.repository";

class PaymentInstallmentRepository extends BaseRepository<IPaymentInstallment> {
  constructor() {
    super(PaymentInstallment);
  }
}

export const paymentInstallmentRepository = new PaymentInstallmentRepository();
