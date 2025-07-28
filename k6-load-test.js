import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 10 }, // Ramp up to 10 users
    { duration: '1m', target: 50 },  // Ramp up to 50 users
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '1m', target: 100 }, // Stay at 100 users
    { duration: '30s', target: 0 },  // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests must complete below 2s
    http_req_failed: ['rate<0.1'],     // Error rate must be below 10%
  },
};

const BASE_URL = 'http://localhost:3000';

export default function () {
  const paymentData = {
    amount: Math.floor(Math.random() * 5000) + 100, // Random amount between 100-5100 CZK
    currency: 'CZK',
    description: `Test payment ${Date.now()}`,
    customerEmail: `test${Date.now()}@example.com`
  };

  // Test Stripe payment creation
  const stripeResponse = http.post(`${BASE_URL}/api/payment/create/stripe`, JSON.stringify(paymentData), {
    headers: { 'Content-Type': 'application/json' },
  });

  check(stripeResponse, {
    'Stripe payment creation successful': (r) => r.status === 200 && r.json('success') === true,
    'Stripe response time < 2000ms': (r) => r.timings.duration < 2000,
  });

  sleep(1);

  // Test PayPal payment creation
  const paypalResponse = http.post(`${BASE_URL}/api/payment/create/paypal`, JSON.stringify(paymentData), {
    headers: { 'Content-Type': 'application/json' },
  });

  check(paypalResponse, {
    'PayPal payment creation successful': (r) => r.status === 200 && r.json('success') === true,
    'PayPal response time < 2000ms': (r) => r.timings.duration < 2000,
  });

  sleep(1);

  // Test GoPay payment creation
  const gopayResponse = http.post(`${BASE_URL}/api/payment/create/gopay`, JSON.stringify(paymentData), {
    headers: { 'Content-Type': 'application/json' },
  });

  check(gopayResponse, {
    'GoPay payment creation successful': (r) => r.status === 200 && r.json('success') === true,
    'GoPay response time < 2000ms': (r) => r.timings.duration < 2000,
  });

  sleep(1);

  // Test webhook endpoints (simulate payment gateway callbacks)
  const webhookData = {
    id: `pi_${Date.now()}`,
    status: 'succeeded',
    amount: paymentData.amount,
    currency: paymentData.currency
  };

  // Test Stripe webhook
  const stripeWebhookResponse = http.post(`${BASE_URL}/api/webhook/stripe`, JSON.stringify({
    data: { object: webhookData }
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  check(stripeWebhookResponse, {
    'Stripe webhook processed successfully': (r) => r.status === 200,
    'Stripe webhook response time < 1000ms': (r) => r.timings.duration < 1000,
  });

  sleep(0.5);

  // Test PayPal webhook
  const paypalWebhookResponse = http.post(`${BASE_URL}/api/webhook/paypal`, JSON.stringify({
    resource: { ...webhookData, state: 'approved' }
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  check(paypalWebhookResponse, {
    'PayPal webhook processed successfully': (r) => r.status === 200,
    'PayPal webhook response time < 1000ms': (r) => r.timings.duration < 1000,
  });

  sleep(0.5);

  // Test GoPay webhook
  const gopayWebhookResponse = http.post(`${BASE_URL}/api/webhook/gopay`, JSON.stringify({
    payment: { ...webhookData, state: 'PAID' }
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  check(gopayWebhookResponse, {
    'GoPay webhook processed successfully': (r) => r.status === 200,
    'GoPay webhook response time < 1000ms': (r) => r.timings.duration < 1000,
  });

  sleep(1);
} 