import { FinanceApproval, IFinanceApproval } from "../models/finance-approval.model";
import { BaseRepository } from "./base.repository";

class FinanceApprovalRepository extends BaseRepository<IFinanceApproval> {
  constructor() {
    super(FinanceApproval);
  }
}

export const financeApprovalRepository = new FinanceApprovalRepository();
