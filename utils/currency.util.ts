export class CurrencyUtil {
  // Stripe zero-decimal currencies
  private static ZERO_DECIMAL_CURRENCIES = [
    "bif", "clp", "djf", "gnf", "jpy", "kmf", "krw", "mga",
    "pyg", "rwf", "ugx", "vnd", "vuv", "xaf", "xof", "xpf",
  ];

  /**
   * TrueLern consistently stores money as generic "cents" (major unit * 100).
   * For standard currencies (like USD), Stripe also expects cents (major unit * 100).
   * For zero-decimal currencies (like JPY), Stripe expects the major unit directly.
   * Therefore, we must divide by 100 for zero-decimal currencies.
   */
  static toStripeMinorUnits(amountInTrueLernCents: number, currency: string): number {
    const curr = currency.toLowerCase();
    if (this.ZERO_DECIMAL_CURRENCIES.includes(curr)) {
      return Math.round(amountInTrueLernCents / 100);
    }
    return Math.round(amountInTrueLernCents);
  }

  /**
   * Convert from Stripe minor units back to TrueLern generic "cents" (major unit * 100).
   */
  static fromStripeMinorUnits(stripeAmount: number, currency: string): number {
    const curr = currency.toLowerCase();
    if (this.ZERO_DECIMAL_CURRENCIES.includes(curr)) {
      return Math.round(stripeAmount * 100);
    }
    return Math.round(stripeAmount);
  }
}
