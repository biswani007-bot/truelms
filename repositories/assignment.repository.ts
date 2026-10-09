import { Assignment, IAssignment } from "../models/assignment.model";
import { BaseRepository } from "./base.repository";

class AssignmentRepository extends BaseRepository<IAssignment> {
  constructor() {
    super(Assignment);
  }

  async softDelete(id: string, options: any = {}): Promise<IAssignment | null> {
    const data: any = { isDeleted: true, deletedAt: new Date(), status: "archived" };
    return this.update(id, data, { ...options, lean: false });
  }
}

export const assignmentRepository = new AssignmentRepository();
