import mongoose, { ClientSession } from "mongoose";

export class TransactionManager {
  /**
   * Executes the given callback inside a MongoDB transaction session.
   * If any error is thrown, the transaction is aborted and rolled back.
   */
  static async runTransaction<T>(
    callback: (session: ClientSession) => Promise<T>
  ): Promise<T> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const result = await callback(session);
      await session.commitTransaction();
      return result;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}
