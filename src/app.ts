import express from 'express';
import { createPaymentRouter } from './routes/payment';
import { webhookRouter } from './routes/webhook';
import { config } from './config';
import { database } from './database';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware for webhook raw body parsing
app.use('/api/webhook/stripe', express.raw({ type: 'application/json' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Routes
app.use('/api/payment', createPaymentRouter);
app.use('/api/webhook', webhookRouter);

// Success page route
app.get('/success', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/success.html'));
});

// Cancel page route
app.get('/cancel', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/cancel.html'));
});

// Admin page route
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/admin.html'));
});

// API endpoint to get payment info for success page
app.get('/api/payment-info/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const payment = await database.getPaymentBySessionId(sessionId);
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
    }
    
    res.json({
      success: true,
      payment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get payment info'
    });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Frontend: http://localhost:${PORT}`);
  console.log(`Success page: http://localhost:${PORT}/success`);
  console.log(`Admin panel: http://localhost:${PORT}/admin`);
});

export default app; 