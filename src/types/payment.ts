export interface PaymentRequest {
  amount: number;
  currency: string;
  description: string;
  customerEmail?: string;
  orderId?: string;
  gateway?: string;
}

export interface PaymentResponse {
  success: boolean;
  paymentId: string;
  redirectUrl?: string;
  clientSecret?: string;
  error?: string;
}

export interface WebhookData {
  paymentId: string;
  status: 'success' | 'failed' | 'pending';
  amount: number;
  currency: string;
  gateway: string;
  timestamp: string;
}

export interface PaymentGateway {
  createPayment(request: PaymentRequest): Promise<PaymentResponse>;
  processWebhook(payload: any, headers: any): Promise<WebhookData>;
} 