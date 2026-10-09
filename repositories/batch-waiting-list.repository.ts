import { BatchWaitingList, IBatchWaitingList } from "../models/batch-waiting-list.model";
import { BaseRepository } from "./base.repository";

class BatchWaitingListRepository extends BaseRepository<IBatchWaitingList> {
  constructor() {
    super(BatchWaitingList);
  }
}

export const batchWaitingListRepository = new BatchWaitingListRepository();
