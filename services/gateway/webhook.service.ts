import crypto from "crypto";
import { Webhook } from "../../models/webhook.model";
import { webhookRepository } from "../../repositories/webhook.repository";
import { PaginationInput } from "../../dtos/pagination.dto";

export class WebhookService {
  static async listWebhooks(paginationInput: PaginationInput) {
    return webhookRepository.paginate(
      paginationInput,
      ["targetUrl"],
      { populate: ["apiClient"] }
    );
  }

  static async registerWebhook(data: {
    apiClient: string;
    targetUrl: string;
    subscribedEvents: string[];
  }) {
    const secret = `whsec_${crypto.randomBytes(24).toString("hex")}`;
    return Webhook.create({
      ...data,
      secret,
      isActive: true,
    });
  }

  static async rotateSecret(id: string): Promise<string> {
    const secret = `whsec_${crypto.randomBytes(24).toString("hex")}`;
    await webhookRepository.update(id, { secret });
    return secret;
  }

  static async deleteWebhook(id: string) {
    return webhookRepository.softDelete(id);
  }

  /**
   * Generates a Hex HMAC SHA256 signature for payload verification
   */
  static generateSignature(payload: string, secret: string, timestamp: number): string {
    const signaturePayload = `${timestamp}.${payload}`;
    return crypto.createHmac("sha256", secret).update(signaturePayload).digest("hex");
  }
}
