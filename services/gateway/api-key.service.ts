import crypto from "crypto";
import { apiKeyRepository } from "../../repositories/api-key.repository";
import { ApiKey, IApiKey } from "../../models/api-key.model";

export class ApiKeyService {
  /**
   * Generates a plain-text API key prefix/secret pair, hashes it, and registers it.
   */
  static async issueKey(data: {
    apiClient: string;
    scopes: string[];
    allowedIps: string[];
    expiresInDays: number;
  }): Promise<{ plainKey: string; secret: string }> {
    const keyId = `key_${crypto.randomBytes(8).toString("hex")}`;
    const secret = `sec_${crypto.randomBytes(24).toString("hex")}`;
    const hashedSecret = crypto.createHash("sha256").update(secret).digest("hex");

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + data.expiresInDays);

    await ApiKey.create({
      apiClient: data.apiClient,
      keyId,
      hashedSecret,
      scopes: data.scopes,
      allowedIps: data.allowedIps,
      expiresAt,
      status: "active",
    });

    return {
      plainKey: keyId,
      secret,
    };
  }

  /**
   * Validates plainKey & secret, matches scopes, allowed IP checks, and expiration limits.
   */
  static async authenticate(keyId: string, secret: string, requestIp: string): Promise<IApiKey | null> {
    const key = await ApiKey.findOne({ keyId });
    if (!key || key.status !== "active") return null;

    // Check expiration
    if (new Date() > new Date(key.expiresAt)) {
      await apiKeyRepository.update(key._id.toString(), { status: "expired" });
      return null;
    }

    // Check secret
    const hashedSecret = crypto.createHash("sha256").update(secret).digest("hex");
    if (key.hashedSecret !== hashedSecret) return null;

    // Check IP restriction if configured
    if (key.allowedIps && key.allowedIps.length > 0) {
      const ipAllowed = key.allowedIps.includes(requestIp);
      if (!ipAllowed) return null;
    }

    // Update lastUsedAt
    await apiKeyRepository.update(key._id.toString(), { lastUsedAt: new Date() });

    return key;
  }

  static async rotateSecret(id: string): Promise<string> {
    const secret = `sec_${crypto.randomBytes(24).toString("hex")}`;
    const hashedSecret = crypto.createHash("sha256").update(secret).digest("hex");

    await apiKeyRepository.update(id, { hashedSecret });
    return secret;
  }

  static async revokeKey(id: string): Promise<void> {
    await apiKeyRepository.update(id, { status: "revoked" });
  }
}
