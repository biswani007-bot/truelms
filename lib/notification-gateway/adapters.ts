import { logger } from "../../utils/logger";

export interface INotificationAdapter {
  send(
    recipientContact: string, // Email address, Phone number, or Device Token
    subject: string,
    body: string,
    variables?: Record<string, unknown>
  ): Promise<{ success: boolean; gatewayMessageId?: string; error?: string }>;
}

import { EmailService } from "../../services/email/email.service";

// ─── Concrete Email Adapter (via EmailService / Brevo) ───────────────────────

export class EmailAdapter implements INotificationAdapter {
  async send(
    recipientContact: string,
    subject: string,
    body: string,
    variables?: Record<string, unknown>
  ): Promise<{ success: boolean; gatewayMessageId?: string; error?: string }> {
    logger.info(
      { recipient: recipientContact, subject, variables },
      "[Notification Center] [Adapter] dispatching EMAIL via EmailService..."
    );

    const res = await EmailService.sendMail({
      to: recipientContact,
      subject,
      html: body,
      text: body.replace(/<[^>]*>?/gm, ""),
    });

    return {
      success: res.success,
      gatewayMessageId: res.messageId || undefined,
      error: res.error,
    };
  }
}

// ─── Concrete SMS Adapter (Twilio / Production Aware) ───────────────────────

export class SMSAdapter implements INotificationAdapter {
  async send(
    recipientContact: string,
    subject: string,
    body: string,
    variables?: Record<string, unknown>
  ): Promise<{ success: boolean; gatewayMessageId?: string; error?: string }> {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromPhone = process.env.TWILIO_PHONE_NUMBER || process.env.TWILIO_FROM_PHONE;

    if (!recipientContact) {
      return { success: false, error: "Recipient phone number is required" };
    }

    if (!accountSid || !authToken || !fromPhone) {
      const isTest = process.env.NODE_ENV === "test" || process.env.NOTIFICATION_MOCK === "true";
      if (isTest) {
        logger.info(
          { recipient: recipientContact, body, variables },
          "[Notification Center] [Adapter] dispatching SMS in test/mock mode..."
        );
        return {
          success: true,
          gatewayMessageId: `sms-test-${Date.now()}`,
        };
      }

      logger.warn(
        { recipient: recipientContact },
        "[Notification Center] [Adapter] Twilio credentials (TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN) not configured in environment."
      );
      return {
        success: false,
        error: "SMS provider configuration missing: TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN not set in environment.",
      };
    }

    try {
      const params = new URLSearchParams();
      params.append("To", recipientContact);
      params.append("From", fromPhone);
      params.append("Body", body);

      const authHeader = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
      const res = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${authHeader}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: params.toString(),
        }
      );

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        const errMessage = (errJson as any)?.message || `Twilio HTTP ${res.status}: ${res.statusText}`;
        logger.error({ recipient: recipientContact, error: errMessage }, "[SMSAdapter] Twilio rejected dispatch.");
        return { success: false, error: errMessage };
      }

      const resData = await res.json();
      const messageId = (resData as any)?.sid || `twilio-${Date.now()}`;
      logger.info({ recipient: recipientContact, messageId }, "[SMSAdapter] SMS sent via Twilio.");
      return { success: true, gatewayMessageId: messageId };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Network error contacting Twilio";
      logger.error({ recipient: recipientContact, error: errorMsg }, "[SMSAdapter] Network error sending SMS.");
      return { success: false, error: errorMsg };
    }
  }
}

// ─── Concrete WhatsApp Adapter Stub ──────────────────────────────────────────

export class WhatsAppAdapter implements INotificationAdapter {
  async send(
    recipientContact: string,
    subject: string,
    body: string,
    variables?: Record<string, unknown>
  ): Promise<{ success: boolean; gatewayMessageId: string }> {
    logger.info(
      { recipient: recipientContact, body, variables },
      "[Notification Center] [Adapter] dispatching WHATSAPP stub..."
    );
    return {
      success: true,
      gatewayMessageId: `wa-gw-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
  }
}

// ─── Concrete Push Notification Adapter Stub ──────────────────────────────────

export class PushAdapter implements INotificationAdapter {
  async send(
    recipientContact: string,
    subject: string,
    body: string,
    variables?: Record<string, unknown>
  ): Promise<{ success: boolean; gatewayMessageId: string }> {
    logger.info(
      { recipient: recipientContact, subject, body, variables },
      "[Notification Center] [Adapter] dispatching PUSH stub..."
    );
    return {
      success: true,
      gatewayMessageId: `push-gw-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
  }
}

// ─── Concrete In-App Notification Adapter Stub ────────────────────────────────

export class InAppAdapter implements INotificationAdapter {
  async send(
    recipientContact: string,
    subject: string,
    body: string,
    variables?: Record<string, unknown>
  ): Promise<{ success: boolean; gatewayMessageId: string }> {
    logger.info(
      { recipient: recipientContact, subject, body, variables },
      "[Notification Center] [Adapter] dispatching IN-APP stub..."
    );
    return {
      success: true,
      gatewayMessageId: `inapp-gw-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
  }
}

// ─── Adapter Factory ─────────────────────────────────────────────────────────

export function getChannelAdapter(channel: string): INotificationAdapter {
  switch (channel) {
    case "email":
      return new EmailAdapter();
    case "sms":
      return new SMSAdapter();
    case "whatsapp":
      return new WhatsAppAdapter();
    case "push":
      return new PushAdapter();
    case "in-app":
      return new InAppAdapter();
    default:
      throw new Error(`Unsupported channel adapter: ${channel}`);
  }
}
