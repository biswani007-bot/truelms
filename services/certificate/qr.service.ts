export class QRService {
  static generateVerificationQRMetadata(certificateNumber: string, verificationCode: string) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://lmsca.com";
    return `${baseUrl}/verify?certNo=${certificateNumber}&code=${verificationCode}`;
  }
}
