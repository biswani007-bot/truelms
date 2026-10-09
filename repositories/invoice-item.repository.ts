import { InvoiceItem, IInvoiceItem } from "../models/invoice-item.model";
import { BaseRepository } from "./base.repository";

class InvoiceItemRepository extends BaseRepository<IInvoiceItem> {
  constructor() {
    super(InvoiceItem);
  }
}

export const invoiceItemRepository = new InvoiceItemRepository();
