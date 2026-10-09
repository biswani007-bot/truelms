/**
 * Payment Gateway Adapter Interface
 *
 * This interface defines the contract for all future payment gateway integrations.
 * No live gateway is implemented here.
 *
 * Future implementations:
 *  - RazorpayAdapter implements IPaymentGatewayAdapter
 *  - StripeAdapter implements IPaymentGatewayAdapter
 *  - PayPalAdapter implements IPaymentGatewayAdapter
 */

export interface PaymentInitiateRequest {
  /** Invoice ID (internal reference) */
  invoiceId: string;
  /** Amount in cents (integer, decimal-safe) */
  amount: number;
  /** ISO 4217 currency code e.g. "USD", "INR" */
  currency: string;
  /** Customer email for gateway notifications */
  customerEmail: string;
  /** Customer display name */
  customerName: string;
  /** Short description shown on payment page */
  description: string;
  /** Return URL after payment completes */
  returnUrl: string;
  /** Additional metadata to attach to the gateway order */
  metadata?: Record<string, string>;
}

export interface PaymentInitiateResponse {
  /** Gateway-generated order/session ID */
  gatewayOrderId: string;
  /** Redirect URL to gateway payment page */
  redirectUrl?: string;
  /** Payment token for frontend SDK use */
  paymentToken?: string;
  /** Raw response from gateway for logging */
  rawResponse: Record<string, unknown>;
}

export interface PaymentVerifyRequest {
  /** Gateway-generated order/session ID */
  gatewayOrderId: string;
  /** Gateway-generated payment/transaction ID */
  gatewayPaymentId: string;
  /** Gateway-generated signature for tamper verification */
  gatewaySignature?: string;
}

export interface PaymentVerifyResponse {
  /** Whether the payment is confirmed successful */
  success: boolean;
  /** Internal transaction reference to store in Payment record */
  transactionReference: string;
  /** Amount verified by gateway (in cents) */
  verifiedAmount: number;
  /** ISO 4217 currency code */
  currency: string;
  /** Raw response from gateway for logging */
  rawResponse: Record<string, unknown>;
}

export interface RefundInitiateRequest {
  /** Gateway transaction ID of the original payment */
  gatewayPaymentId: string;
  /** Refund amount in cents */
  amount: number;
  /** Reason for the refund */
  reason: string;
}

export interface RefundInitiateResponse {
  /** Gateway-generated refund ID */
  gatewayRefundId: string;
  /** Refund status at gateway */
  status: "initiated" | "processing" | "completed" | "failed";
  /** Raw response from gateway for logging */
  rawResponse: Record<string, unknown>;
}

/**
 * IPaymentGatewayAdapter
 *
 * All payment gateway integrations MUST implement this interface.
 * This ensures the finance engine can swap gateways without changing business logic.
 */
export interface IPaymentGatewayAdapter {
  /** Human-readable gateway name (e.g. "Razorpay", "Stripe") */
  readonly gatewayName: string;

  /**
   * Initiate a payment session/order with the gateway.
   * Returns the data needed to redirect student to gateway checkout.
   */
  initiatePayment(request: PaymentInitiateRequest): Promise<PaymentInitiateResponse>;

  /**
   * Verify a payment after student completes gateway checkout.
   * Returns whether payment succeeded and the transaction reference.
   */
  verifyPayment(request: PaymentVerifyRequest): Promise<PaymentVerifyResponse>;

  /**
   * Initiate a refund for a previously completed payment.
   * Returns gateway refund ID and status.
   */
  refund(request: RefundInitiateRequest): Promise<RefundInitiateResponse>;
}
