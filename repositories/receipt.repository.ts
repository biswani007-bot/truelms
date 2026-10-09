import { Receipt, IReceipt } from "../models/receipt.model";
import { BaseRepository } from "./base.repository";

class ReceiptRepository extends BaseRepository<IReceipt> {
  constructor() {
    super(Receipt);
  }
}

export const receiptRepository = new ReceiptRepository();
