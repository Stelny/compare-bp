import { Router, Request, Response } from 'express';
import { PaymentRequest } from '../types/payment';
import { StripeGateway } from '../services/stripe';
import { PayPalGateway } from '../services/paypal';
import { GoPayGateway } from '../services/gopay';
import { database } from '../database';

const router = Router();
const stripeGateway = new StripeGateway();
const paypalGateway = new PayPalGateway();
const gopayGateway = new GoPayGateway();

// Get all payments endpoint
router.get('/all', async (req: Request, res: Response) => {
  try {
    const payments = await database.getAllPayments();
    res.json({
      success: true,
      payments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get payments'
    });
  }
});

// Create payment endpoint
router.post('/create', async (req: Request, res: Response) => {
  try {
    const paymentRequest: PaymentRequest = req.body;
    
    if (!paymentRequest.gateway || !paymentRequest.amount || !paymentRequest.currency) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: gateway, amount, currency'
      });
    }

    let response;
    switch (paymentRequest.gateway) {
      case 'stripe':
        response = await stripeGateway.createPayment(paymentRequest);
        break;
      case 'paypal':
        response = await paypalGateway.createPayment(paymentRequest);
        break;
      case 'gopay':
        response = await gopayGateway.createPayment(paymentRequest);
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Unsupported payment gateway'
        });
    }

    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

// Gateway-specific endpoints
router.post('/create/stripe', async (req: Request, res: Response) => {
  try {
    const paymentRequest: PaymentRequest = { ...req.body, gateway: 'stripe' };
    const response = await stripeGateway.createPayment(paymentRequest);
    
    // Save payment to database if creation was successful
    if (response.success && response.paymentId) {
      await database.createPayment({
        paymentId: response.paymentId,
        gateway: 'stripe',
        amount: paymentRequest.amount,
        currency: paymentRequest.currency,
        status: 'pending',
        customerEmail: paymentRequest.customerEmail,
        orderId: paymentRequest.orderId,
        sessionId: response.paymentId // For Stripe, paymentId is the session ID
      });
    }
    
    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Stripe payment creation failed'
    });
  }
});

router.post('/create/paypal', async (req: Request, res: Response) => {
  try {
    const paymentRequest: PaymentRequest = { ...req.body, gateway: 'paypal' };
    const response = await paypalGateway.createPayment(paymentRequest);
    
    // Save payment to database if creation was successful
    if (response.success && response.paymentId) {
      await database.createPayment({
        paymentId: response.paymentId,
        gateway: 'paypal',
        amount: paymentRequest.amount,
        currency: paymentRequest.currency,
        status: 'pending',
        customerEmail: paymentRequest.customerEmail,
        orderId: paymentRequest.orderId,
        sessionId: response.paymentId
      });
    }
    
    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'PayPal payment creation failed'
    });
  }
});

router.post('/create/gopay', async (req: Request, res: Response) => {
  try {
    const paymentRequest: PaymentRequest = { ...req.body, gateway: 'gopay' };
    const response = await gopayGateway.createPayment(paymentRequest);
    
    // Save payment to database if creation was successful
    if (response.success && response.paymentId) {
      await database.createPayment({
        paymentId: response.paymentId,
        gateway: 'gopay',
        amount: paymentRequest.amount,
        currency: paymentRequest.currency,
        status: 'pending',
        customerEmail: paymentRequest.customerEmail,
        orderId: paymentRequest.orderId,
        sessionId: response.paymentId
      });
    }
    
    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'GoPay payment creation failed'
    });
  }
});

export const createPaymentRouter = router; 