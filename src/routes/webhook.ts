import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { StripeGateway } from '../services/stripe';
import { PayPalGateway } from '../services/paypal';
import { GoPayGateway } from '../services/gopay';
import { config } from '../config';
import { database } from '../database';

const router = Router();
const stripeGateway = new StripeGateway();
const paypalGateway = new PayPalGateway();
const gopayGateway = new GoPayGateway();

// Initialize Stripe for webhook verification
const stripe = new Stripe(config.stripe.secretKey, {
  apiVersion: '2025-06-30.basil',
});

// Stripe webhook
router.post('/stripe', async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = config.stripe.webhookSecret;

  let event: Stripe.Event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      req.body,
      sig as string,
      endpointSecret
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return res.status(400).send(`Webhook Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }

  console.log('🔔 Stripe webhook received:', event.type);

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session;
      console.log('✅ Checkout session completed:', session.id);
      console.log('💰 Amount:', session.amount_total);
      console.log('💱 Currency:', session.currency);
      console.log('👤 Customer email:', session.customer_details?.email);
      
      // Update payment status in database
      try {
        await database.updatePaymentStatus(session.id, 'success');
        console.log('✅ Payment status updated to success in database');
      } catch (dbError) {
        console.error('❌ Failed to update payment status in database:', dbError);
      }
      
      break;
      
    case 'checkout.session.expired':
      const expiredSession = event.data.object as Stripe.Checkout.Session;
      console.log('⏰ Checkout session expired:', expiredSession.id);
      console.log('💰 Amount:', expiredSession.amount_total);
      
      // Update payment status in database
      try {
        await database.updatePaymentStatus(expiredSession.id, 'failed');
        console.log('❌ Payment status updated to failed in database');
      } catch (dbError) {
        console.error('❌ Failed to update payment status in database:', dbError);
      }
      
      break;
      
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log('✅ Payment succeeded:', paymentIntent.id);
      console.log('💰 Amount:', paymentIntent.amount);
      console.log('💳 Customer:', paymentIntent.customer);
      
      // Update payment status in database
      try {
        await database.updatePaymentStatus(paymentIntent.id, 'success');
        console.log('✅ Payment status updated to success in database');
      } catch (dbError) {
        console.error('❌ Failed to update payment status in database:', dbError);
      }
      
      break;
      
    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object as Stripe.PaymentIntent;
      console.log('❌ Payment failed:', failedPayment.id);
      console.log('💸 Amount:', failedPayment.amount);
      console.log('🔍 Last payment error:', failedPayment.last_payment_error);
      
      // Update payment status in database
      try {
        await database.updatePaymentStatus(failedPayment.id, 'failed');
        console.log('❌ Payment status updated to failed in database');
      } catch (dbError) {
        console.error('❌ Failed to update payment status in database:', dbError);
      }
      
      break;
      
    case 'charge.succeeded':
      const charge = event.data.object as Stripe.Charge;
      console.log('💳 Charge succeeded:', charge.id);
      console.log('💰 Amount:', charge.amount);
      console.log('🏦 Payment method:', charge.payment_method);
      
      break;
      
    case 'charge.failed':
      const failedCharge = event.data.object as Stripe.Charge;
      console.log('💸 Charge failed:', failedCharge.id);
      console.log('💰 Amount:', failedCharge.amount);
      
      break;
      
    case 'customer.subscription.created':
      const subscription = event.data.object as Stripe.Subscription;
      console.log('📅 Subscription created:', subscription.id);
      console.log('👤 Customer:', subscription.customer);
      console.log('💳 Plan:', subscription.items.data[0]?.price.id);
      
      break;
      
    case 'customer.subscription.updated':
      const updatedSubscription = event.data.object as Stripe.Subscription;
      console.log('📝 Subscription updated:', updatedSubscription.id);
      console.log('📊 Status:', updatedSubscription.status);
      
      break;
      
    case 'customer.subscription.deleted':
      const deletedSubscription = event.data.object as Stripe.Subscription;
      console.log('🗑️ Subscription deleted:', deletedSubscription.id);
      
      break;
      
    case 'invoice.payment_succeeded':
      const invoice = event.data.object as Stripe.Invoice;
      console.log('🧾 Invoice paid:', invoice.id);
      console.log('💰 Amount:', invoice.amount_paid);
      
      break;
      
    case 'invoice.payment_failed':
      const failedInvoice = event.data.object as Stripe.Invoice;
      console.log('💸 Invoice payment failed:', failedInvoice.id);
      
      break;
      
    default:
      console.log(`🤔 Unhandled event type: ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  res.json({ received: true });
});

// PayPal webhook
router.post('/paypal', async (req: Request, res: Response) => {
  try {
    console.log('PayPal webhook received:', JSON.stringify(req.body, null, 2));
    
    const webhookData = await paypalGateway.processWebhook(req.body, req.headers);
    
    // Update payment status in database
    try {
      await database.updatePaymentStatus(webhookData.paymentId, webhookData.status);
      console.log(`✅ PayPal payment status updated to ${webhookData.status} in database`);
    } catch (dbError) {
      console.error('❌ Failed to update PayPal payment status in database:', dbError);
    }
    
    // Process order based on payment status
    if (webhookData.status === 'success') {
      console.log(`✅ Order marked as paid via PayPal: ${webhookData.paymentId}`);
      // Here you would update your database, send confirmation emails, etc.
    } else if (webhookData.status === 'failed') {
      console.log(`❌ Payment failed via PayPal: ${webhookData.paymentId}`);
      // Here you would handle failed payments
    }
    
    res.json({ 
      success: true, 
      message: 'PayPal webhook processed successfully',
      paymentId: webhookData.paymentId,
      status: webhookData.status
    });
  } catch (error) {
    console.error('PayPal webhook error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Webhook processing failed'
    });
  }
});

// GoPay webhook
router.post('/gopay', async (req: Request, res: Response) => {
  try {
    console.log('GoPay webhook received:', JSON.stringify(req.body, null, 2));
    
    const webhookData = await gopayGateway.processWebhook(req.body, req.headers);
    
    // Update payment status in database
    try {
      await database.updatePaymentStatus(webhookData.paymentId, webhookData.status);
      console.log(`✅ GoPay payment status updated to ${webhookData.status} in database`);
    } catch (dbError) {
      console.error('❌ Failed to update GoPay payment status in database:', dbError);
    }
    
    // Process order based on payment status
    if (webhookData.status === 'success') {
      console.log(`✅ Order marked as paid via GoPay: ${webhookData.paymentId}`);
      // Here you would update your database, send confirmation emails, etc.
    } else if (webhookData.status === 'failed') {
      console.log(`❌ Payment failed via GoPay: ${webhookData.paymentId}`);
      // Here you would handle failed payments
    }
    
    res.json({ 
      success: true, 
      message: 'GoPay webhook processed successfully',
      paymentId: webhookData.paymentId,
      status: webhookData.status
    });
  } catch (error) {
    console.error('GoPay webhook error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Webhook processing failed'
    });
  }
});

export const webhookRouter = router; 