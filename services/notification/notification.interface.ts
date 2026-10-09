/* eslint-disable @typescript-eslint/no-explicit-any */
export interface INotificationPayload {
  to: string;
  subject?: string;
  body: string;
  metadata?: Record<string, any>;
}

export interface IEmailProvider {
  sendEmail(payload: INotificationPayload): Promise<boolean>;
}

export interface ISmsProvider {
  sendSms(payload: INotificationPayload): Promise<boolean>;
}

export interface IPushProvider {
  sendPush(payload: INotificationPayload): Promise<boolean>;
}

export interface IInAppProvider {
  sendInApp(payload: INotificationPayload & { userId: string }): Promise<boolean>;
}

export interface INotificationService {
  email: IEmailProvider;
  sms: ISmsProvider;
  push: IPushProvider;
  inApp: IInAppProvider;
}
