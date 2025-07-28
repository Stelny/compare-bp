import { PaymentGateway, PaymentRequest, PaymentResponse, WebhookData } from '../types/payment';
import { config } from '../config';

export class GoPayGateway implements PaymentGateway {
  constructor() {
    // GoPay SDK integration will be implemented later
    console.log('GoPay SDK integration pending');
  }

  async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      // Create payment data according to GoPay API documentation
      const paymentData = {
        target: {
          type: "ACCOUNT",
          goid: config.gopay.goId
        },
        amount: request.amount.toString(),
        currency: request.currency.toUpperCase(),
        order_number: `ORDER_${Date.now()}`,
        items: [{
          type: "ITEM",
          name: request.description,
          product_url: "https://www.eshop.cz/product",
          ean: 1234567890123,
          amount: request.amount,
          count: 1,
          vat_rate: 21
        }],
        callback: {
          return_url: "http://localhost:3000/gopay/success",
          notification_url: "http://localhost:3000/api/webhook/gopay"
        }
      };

      // Simulate GoPay API call using configured credentials
      const paymentId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      return {
        success: true,
        paymentId,
        redirectUrl: `${config.gopay.apiUrl.replace('/api/v3', '')}/gp-gw/v3/embed?payment_id=${paymentId}`,
        clientSecret: undefined
      };
    } catch (error) {
      console.error('GoPay payment creation error:', error);
      return {
        success: false,
        paymentId: '',
        error: error instanceof Error ? error.message : 'GoPay payment creation failed'
      };
    }
  }

  async processWebhook(payload: any, headers: any): Promise<WebhookData> {
    try {
      // Verify webhook signature (simplified for demo)
      // In production, you should verify the webhook signature
      const event = payload.payment || payload;
      
      let paymentId = '';
      let status: 'success' | 'failed' | 'pending' = 'pending';
      let amount = 0;
      let currency = 'CZK';

      if (event.state === 'PAID') {
        paymentId = event.id || `${Date.now()}`;
        status = 'success';
        amount = event.amount || 0;
        currency = event.currency || 'CZK';
      } else if (event.state === 'FAILED') {
        paymentId = event.id || `${Date.now()}`;
        status = 'failed';
        amount = event.amount || 0;
        currency = event.currency || 'CZK';
      }

      return {
        paymentId,
        status,
        amount,
        currency,
        gateway: 'gopay',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('GoPay webhook processing error:', error);
      throw error;
    }
  }
} 