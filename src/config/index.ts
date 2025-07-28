import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  
  // Stripe configuration
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    apiUrl: 'https://api.stripe.com/v1'
  },
  
  // PayPal configuration
  paypal: {
    clientId: process.env.PAYPAL_CLIENT_ID || '',
    clientSecret: process.env.PAYPAL_CLIENT_SECRET || '',
    mode: process.env.PAYPAL_MODE || '',
    apiUrl: process.env.PAYPAL_MODE === 'live' 
      ? 'https://api-m.paypal.com' 
      : 'https://api-m.sandbox.paypal.com'
  },
  
  // GoPay configuration
  gopay: {
    goId: process.env.GOPAY_GOID || '',
    clientId: process.env.GOPAY_CLIENT_ID || '',
    clientSecret: process.env.GOPAY_CLIENT_SECRET || '',
    apiUrl: 'https://gw.sandbox.gopay.com/api/v3'
  }
}; 