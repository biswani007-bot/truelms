import { logger } from "../../utils/logger";

export interface IEmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

function maskEmail(email: string): string {
  if (!email) return "";
  const parts = email.split("@");
  if (parts.length < 2) return "***";
  const user = parts[0];
  const domain = parts[1];
  return `${user.substring(0, 1)}***@${domain}`;
}

export class EmailService {
  /**
   * Send transactional email through Brevo REST API (v3) using native fetch.
   * POST https://api.brevo.com/v3/smtp/email
   */
  static async sendMail(options: IEmailOptions): Promise<{
    success: boolean;
    messageId: string;
    error?: string;
    failureCategory?: string;
    status?: number;
    isTerminal?: boolean;
  }> {
    const apiKey = process.env.BREVO_API_KEY;
    const senderEmail = process.env.BREVO_FROM_EMAIL || process.env.SMTP_FROM || "notifications@truelern.com";
    const senderName = process.env.BREVO_FROM_NAME || "TrueLern Academy";

    // Validate recipient
    if (!options.to || !options.to.trim()) {
      logger.error("[EmailService] Cannot send email: recipient address is empty.");
      return {
        success: false,
        messageId: "",
        error: "Recipient address is required",
        failureCategory: "VALIDATION_ERROR",
        isTerminal: true,
      };
    }

    // Handle missing provider configuration honestly
    if (!apiKey) {
      logger.warn(
        { recipient: maskEmail(options.to), subject: options.subject },
        "[EmailService] BREVO_API_KEY is not configured in environment; transactional email skipped."
      );
      return {
        success: false,
        messageId: "",
        error: "BREVO_API_KEY is not configured",
        failureCategory: "CONFIGURATION_ERROR",
        isTerminal: true,
      };
    }

    try {
      const payload: Record<string, unknown> = {
        sender: {
          name: senderName,
          email: senderEmail,
        },
        to: [
          {
            email: options.to.trim(),
          },
        ],
        subject: options.subject,
      };

      if (options.html) {
        payload.htmlContent = options.html;
      }
      if (options.text) {
        payload.textContent = options.text;
      } else if (!options.html) {
        payload.textContent = options.subject;
      }

      const res = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "api-key": apiKey,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let errorMessage = `Brevo HTTP ${res.status}: ${res.statusText}`;
        let rawCode = "";
        try {
          const errData = await res.json();
          if (errData?.message) {
            errorMessage = errData.message;
          }
          if (errData?.code) {
            rawCode = errData.code;
          }
        } catch {
          // ignore json parsing error on unexpected non-JSON error pages
        }

        let failureCategory = "PROVIDER_ERROR";
        let isTerminal = false;

        if (res.status === 401 || res.status === 403) {
          if (errorMessage.toLowerCase().includes("authorised_ips") || errorMessage.toLowerCase().includes("unrecognised ip")) {
            failureCategory = "UNAUTHORIZED_IP";
            isTerminal = true;
          } else {
            failureCategory = "AUTHENTICATION_ERROR";
            isTerminal = true;
          }
        } else if (res.status === 400) {
          failureCategory = "VALIDATION_ERROR";
          isTerminal = true;
        } else if (res.status === 429) {
          failureCategory = "RATE_LIMIT";
          isTerminal = false; // eligible for retry
        } else if (res.status >= 500) {
          failureCategory = "PROVIDER_SERVER_ERROR";
          isTerminal = false; // eligible for retry
        }

        logger.error(
          {
            recipient: maskEmail(options.to),
            subject: options.subject,
            status: res.status,
            category: failureCategory,
            error: errorMessage,
            code: rawCode || undefined,
          },
          "[EmailService] Brevo API rejected transactional email."
        );

        return {
          success: false,
          messageId: "",
          error: errorMessage,
          failureCategory,
          status: res.status,
          isTerminal,
        };
      }

      const data = await res.json();
      const messageId = data?.messageId || `brevo-${Date.now()}`;

      logger.info(
        { recipient: maskEmail(options.to), subject: options.subject, messageId },
        "[EmailService] Transactional email ACCEPTED by Brevo provider (201)."
      );

      logger.warn(
        { messageId },
        "[EmailService] Mailbox delivery is UNVERIFIED. Webhook integration required for actual delivery evidence."
      );

      return {
        success: true,
        messageId,
        status: res.status,
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Unknown network error";
      logger.error(
        { recipient: maskEmail(options.to), subject: options.subject, error: errorMsg },
        "[EmailService] Network exception while communicating with Brevo API."
      );

      return {
        success: false,
        messageId: "",
        error: errorMsg,
        failureCategory: "NETWORK_ERROR",
        isTerminal: false,
      };
    }
  }
}
