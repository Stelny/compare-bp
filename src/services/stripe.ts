import Stripe from 'stripe';
import { PaymentGateway, PaymentRequest, PaymentResponse, WebhookData } from '../types/payment';
import { config } from '../config';

export class StripeGateway implements PaymentGateway {
  private stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(config.stripe.secretKey, {
      apiVersion: '2025-06-30.basil',
    });
  }

  async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      // Create checkout session with Stripe SDK
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: request.currency.toLowerCase(),
              product_data: {
                name: request.description,
              },
              unit_amount: request.amount,
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: 'http://localhost:3000/success?session_id={CHECKOUT_SESSION_ID}',
        cancel_url: 'http://localhost:3000/cancel',
        metadata: {
          customer_email: request.customerEmail || '',
          order_id: request.orderId || '',
        },
      });

      return {
        success: true,
        paymentId: session.id,
        redirectUrl: session.url || undefined,
        clientSecret: undefined
      };
    } catch (error) {
      console.error('Stripe payment creation error:', error);
      return {
        success: false,
        paymentId: '',
        error: error instanceof Error ? error.message : 'Stripe payment creation failed'
      };
    }
  }

  async processWebhook(payload: any, headers: any): Promise<WebhookData> {
    try {
      // Verify webhook signature
      const signature = headers['stripe-signature'] as string;
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        config.stripe.webhookSecret
      );

      let paymentId = '';
      let status: 'success' | 'failed' | 'pending' = 'pending';
      let amount = 0;
      let currency = 'usd';

      switch (event.type) {
        case 'checkout.session.completed':
          const session = event.data.object as Stripe.Checkout.Session;
          paymentId = session.id;
          status = 'success';
          amount = session.amount_total || 0;
          currency = session.currency || 'usd';
          break;
        case 'checkout.session.expired':
          const expiredSession = event.data.object as Stripe.Checkout.Session;
          paymentId = expiredSession.id;
          status = 'failed';
          amount = expiredSession.amount_total || 0;
          currency = expiredSession.currency || 'usd';
          break;
        case 'payment_intent.succeeded':
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          paymentId = paymentIntent.id;
          status = 'success';
          amount = paymentIntent.amount;
          currency = paymentIntent.currency;
          break;
        case 'payment_intent.payment_failed':
          const failedPayment = event.data.object as Stripe.PaymentIntent;
          paymentId = failedPayment.id;
          status = 'failed';
          amount = failedPayment.amount;
          currency = failedPayment.currency;
          break;
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      return {
        paymentId,
        status,
        amount,
        currency,
        gateway: 'stripe',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Stripe webhook processing error:', error);
      throw error;
    }
  }
} 