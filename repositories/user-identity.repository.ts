import { UserIdentity, IUserIdentity } from "../models/user-identity.model";
import { BaseRepository } from "./base.repository";

export class UserIdentityRepository extends BaseRepository<IUserIdentity> {
  constructor() {
    super(UserIdentity);
  }

  async findByProviderSubject(
    provider: "google" | "microsoft",
    providerSubject: string
  ): Promise<IUserIdentity | null> {
    return this.findOne({ provider, providerSubject });
  }

  async findByUserAndProvider(
    userId: string,
    provider: "google" | "microsoft"
  ): Promise<IUserIdentity | null> {
    return this.findOne({ user: userId, provider });
  }

  async createIdentity(
    userId: string,
    provider: "google" | "microsoft",
    providerSubject: string
  ): Promise<IUserIdentity> {
    return this.create({
      user: userId,
      provider,
      providerSubject,
    } as any);
  }
}

export const userIdentityRepository = new UserIdentityRepository();
