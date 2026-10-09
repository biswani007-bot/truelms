/* eslint-disable @typescript-eslint/no-explicit-any */
import { Role, IRole } from "../models/role.model";
import { Permission, IPermission } from "../models/permission.model";
import { BaseRepository } from "./base.repository";

export class RoleRepository extends BaseRepository<IRole> {
  constructor() {
    super(Role);
  }

  async findRoleByName(name: string): Promise<IRole | null> {
    return this.findOne({ name }, { populate: "permissions" });
  }

  async findRoleById(id: string): Promise<IRole | null> {
    return this.findById(id, { populate: "permissions" });
  }

  async createRole(name: string, description: string): Promise<IRole> {
    return this.create({ name, description } as any);
  }

  async findPermissionByName(name: string): Promise<IPermission | null> {
    return Permission.findOne({ name, isDeleted: false }).lean<IPermission>().exec();
  }

  async createPermission(name: string, description: string): Promise<IPermission> {
    const perm = new Permission({ name, description });
    return perm.save();
  }

  async addPermissionToRole(roleId: string, permissionId: string): Promise<IRole | null> {
    return this.model.findByIdAndUpdate(
      roleId,
      { $addToSet: { permissions: permissionId } },
      { new: true }
    )
      .populate("permissions")
      .lean()
      .exec() as any;
  }
}

export const roleRepository = new RoleRepository();
