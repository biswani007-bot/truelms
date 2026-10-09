import { Invoice, IInvoice } from "../models/invoice.model";
import { BaseRepository } from "./base.repository";

class InvoiceRepository extends BaseRepository<IInvoice> {
  constructor() {
    super(Invoice);
  }
}

export const invoiceRepository = new InvoiceRepository();
