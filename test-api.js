const http = require('http');

const BASE_URL = 'http://localhost:3000';

function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const jsonBody = JSON.parse(body);
          resolve({ status: res.statusCode, data: jsonBody });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Spouštím testy API...\n');

  try {
    // Test health endpoint
    console.log('1. Test health endpoint...');
    const health = await makeRequest('/health');
    console.log(`   Status: ${health.status}, Response: ${JSON.stringify(health.data)}\n`);

    // Test Stripe payment creation
    console.log('2. Test Stripe payment creation...');
    const stripePayment = await makeRequest('/api/payment/create/stripe', 'POST', {
      amount: 1000,
      currency: 'CZK',
      description: 'Test Stripe payment',
      customerEmail: 'test@example.com'
    });
    console.log(`   Status: ${stripePayment.status}, Response: ${JSON.stringify(stripePayment.data)}\n`);

    // Test PayPal payment creation
    console.log('3. Test PayPal payment creation...');
    const paypalPayment = await makeRequest('/api/payment/create/paypal', 'POST', {
      amount: 2000,
      currency: 'CZK',
      description: 'Test PayPal payment',
      customerEmail: 'test@example.com'
    });
    console.log(`   Status: ${paypalPayment.status}, Response: ${JSON.stringify(paypalPayment.data)}\n`);

    // Test GoPay payment creation
    console.log('4. Test GoPay payment creation...');
    const gopayPayment = await makeRequest('/api/payment/create/gopay', 'POST', {
      amount: 3000,
      currency: 'CZK',
      description: 'Test GoPay payment',
      customerEmail: 'test@example.com'
    });
    console.log(`   Status: ${gopayPayment.status}, Response: ${JSON.stringify(gopayPayment.data)}\n`);

    // Test webhook endpoints
    console.log('5. Test webhook endpoints...');
    const webhookData = {
      id: 'pi_test_123',
      status: 'succeeded',
      amount: 1000,
      currency: 'CZK'
    };

    const stripeWebhook = await makeRequest('/api/webhook/stripe', 'POST', {
      data: { object: webhookData }
    });
    console.log(`   Stripe webhook: ${stripeWebhook.status}`);

    const paypalWebhook = await makeRequest('/api/webhook/paypal', 'POST', {
      resource: { ...webhookData, state: 'approved' }
    });
    console.log(`   PayPal webhook: ${paypalWebhook.status}`);

    const gopayWebhook = await makeRequest('/api/webhook/gopay', 'POST', {
      payment: { ...webhookData, state: 'PAID' }
    });
    console.log(`   GoPay webhook: ${gopayWebhook.status}\n`);

    console.log('✅ Všechny testy úspěšně dokončeny!');
    console.log('🌐 Frontend je dostupný na: http://localhost:3000');

  } catch (error) {
    console.error('❌ Chyba při testování:', error.message);
  }
}

// Počkej chvíli, než se server spustí
setTimeout(runTests, 2000); 