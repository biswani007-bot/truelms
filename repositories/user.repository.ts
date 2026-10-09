/* eslint-disable @typescript-eslint/no-explicit-any */
import { User, IUser } from "../models/user.model";
import { BaseRepository } from "./base.repository";

export class UserRepository extends BaseRepository<IUser> {
  constructor() {
    super(User);
  }

  async findByEmail(email: string): Promise<IUser | null> {
    return this.findOne({ email }, { populate: "role" });
  }

  async findByEmailWithPassword(email: string): Promise<IUser | null> {
    return this.findOne({ email }, { select: "+password", populate: "role" });
  }

  override async findById(id: string): Promise<IUser | null> {
    return super.findById(id, { populate: "role" });
  }

  async findByRefreshToken(refreshToken: string): Promise<IUser | null> {
    return this.findOne({ refreshToken }, { populate: "role" });
  }

  async updateRefreshToken(id: string, token: string | null): Promise<void> {
    await User.findByIdAndUpdate(id, { refreshToken: token });
  }

  async findByResetToken(token: string): Promise<IUser | null> {
    return this.findOne({
      resetPasswordToken: token,
      resetPasswordExpire: { $gt: Date.now() as any },
    }, { populate: "role" });
  }
}

export const userRepository = new UserRepository();
